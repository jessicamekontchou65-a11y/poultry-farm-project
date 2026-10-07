import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

export type CampayStatus = "PENDING" | "SUCCESSFUL" | "FAILED";

export interface CampayCollectResult {
  reference: string;
  ussdCode?: string;
  operator?: string;
  chargedAmount: number;
  simulated: boolean;
}

export interface CampayTransaction {
  reference: string;
  status: CampayStatus;
  amount?: number;
  currency?: string;
  operator?: string;
  code?: string;
  operator_reference?: string;
  external_reference?: string;
  reason?: string;
}

const TOKEN_TTL_MS = 50 * 60 * 1000; // CamPay tokens last ~1h

/**
 * Thin client for the CamPay mobile money API (MTN MoMo / Orange Money, Cameroon).
 * https://documenter.getpostman.com/view/2391374/T1LV8PVA
 */
@Injectable()
export class CampayService {
  private readonly logger = new Logger(CampayService.name);
  private cachedToken?: { value: string; expiresAt: number };

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService
  ) {}

  isConfigured() {
    return this.isSimulation() || !!(this.get("CAMPAY_TOKEN") || (this.get("CAMPAY_USERNAME") && this.get("CAMPAY_PASSWORD")));
  }

  /** Simulation never touches CamPay; it is refused in production. */
  isSimulation() {
    return this.get("CAMPAY_SIMULATION") === "true" && process.env.NODE_ENV !== "production";
  }

  /** Normalizes Cameroonian mobile numbers to the 2376XXXXXXXX format CamPay expects. */
  normalizePhone(input: unknown) {
    const digits = String(input ?? "").replace(/\D/g, "");
    const local = digits.startsWith("237") ? digits.slice(3) : digits;
    if (!/^6\d{8}$/.test(local)) {
      throw new BadRequestException("Enter a valid Cameroonian mobile number (e.g. 6XXXXXXXX)");
    }
    return `237${local}`;
  }

  /** Demo accounts reject large amounts, so the charge is capped there. */
  chargeableAmount(orderTotal: number) {
    const amount = Math.round(orderTotal);
    const demoMax = Number(this.get("CAMPAY_DEMO_MAX_AMOUNT"));
    if (this.isDemo() && demoMax > 0) return Math.min(amount, demoMax);
    return amount;
  }

  async collect(params: {
    amount: number;
    phone: string;
    description: string;
    externalReference: string;
  }): Promise<CampayCollectResult> {
    const chargedAmount = this.chargeableAmount(params.amount);
    if (chargedAmount < 1) throw new BadRequestException("Amount must be at least 1 XAF");

    if (this.isSimulation()) {
      return { reference: `SIM-${params.externalReference}`, chargedAmount, simulated: true, operator: "SIMULATION" };
    }

    const data = await this.request<{ reference: string; ussd_code?: string; operator?: string }>("/api/collect/", {
      method: "POST",
      body: JSON.stringify({
        amount: String(chargedAmount),
        currency: "XAF",
        from: params.phone,
        description: params.description.slice(0, 100),
        external_reference: params.externalReference
      })
    });

    if (!data.reference) throw new BadGatewayException("CamPay did not return a transaction reference");
    return {
      reference: data.reference,
      ussdCode: data.ussd_code,
      operator: data.operator,
      chargedAmount,
      simulated: false
    };
  }

  async getTransaction(reference: string): Promise<CampayTransaction> {
    if (this.isSimulation() && reference.startsWith("SIM-")) {
      return { reference, status: "SUCCESSFUL", operator: "SIMULATION" };
    }
    return this.request<CampayTransaction>(`/api/transaction/${encodeURIComponent(reference)}/`, { method: "GET" });
  }

  /**
   * CamPay signs webhook calls with a JWT (HS256) using the app's webhook key.
   * Returns false for a missing, forged or expired signature.
   */
  verifyWebhookSignature(signature: unknown) {
    const key = this.get("CAMPAY_WEBHOOK_KEY");
    if (!key || typeof signature !== "string" || !signature) return false;
    try {
      this.jwt.verify(signature, { secret: key, algorithms: ["HS256"] });
      return true;
    } catch {
      return false;
    }
  }

  private async request<T>(path: string, init: RequestInit, retried = false): Promise<T> {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl()}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Token ${token}` }
    });

    if (response.status === 401 && !retried && this.cachedToken) {
      this.cachedToken = undefined;
      return this.request<T>(path, init, true);
    }

    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      this.logger.warn(`CamPay ${init.method} ${path} failed: ${response.status} ${JSON.stringify(body)}`);
      const detail = typeof body.message === "string" ? body.message : `status ${response.status}`;
      throw new BadGatewayException(`Mobile money provider error: ${detail}`);
    }
    return body as T;
  }

  private async getAccessToken() {
    const username = this.get("CAMPAY_USERNAME");
    const password = this.get("CAMPAY_PASSWORD");

    if (username && password) {
      if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) return this.cachedToken.value;
      const response = await fetch(`${this.baseUrl()}/api/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const body = (await response.json().catch(() => ({}))) as { token?: string };
      if (response.ok && body.token) {
        this.cachedToken = { value: body.token, expiresAt: Date.now() + TOKEN_TTL_MS };
        return body.token;
      }
      this.logger.warn(`CamPay token request failed with status ${response.status}`);
    }

    // Permanent access token from the CamPay dashboard, if provided.
    const permanent = this.get("CAMPAY_TOKEN");
    if (permanent) return permanent;
    throw new ServiceUnavailableException("Mobile money payments are not configured");
  }

  private isDemo() {
    return this.get("CAMPAY_USE_DEMO") !== "false";
  }

  private baseUrl() {
    const fallback = this.isDemo() ? "https://demo.campay.net" : "https://www.campay.net";
    return (this.get("CAMPAY_BASE_URL") || fallback).replace(/\/$/, "");
  }

  private get(key: string) {
    return this.config.get<string>(key)?.trim() || undefined;
  }
}
