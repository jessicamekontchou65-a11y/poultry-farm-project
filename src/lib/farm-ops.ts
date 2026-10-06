import { api, apiFetch } from "./api";
import type { ApiSingle, FarmOpsDaySummary, FarmWithFlocks, PoultryBatch } from "./types";

export const farmOpsApi = {
  context(token: string) {
    return apiFetch<ApiSingle<{ farms: FarmWithFlocks[] }>>("/farm-ops/context", { token });
  },

  summary(
    token: string,
    params: {
      farmId: string;
      batchId: string;
      date?: string;
      includeRecords?: boolean;
    }
  ) {
    return apiFetch<ApiSingle<FarmOpsDaySummary & { records?: Record<string, any[]> }>>(
      "/farm-ops/summary",
      {
        token,
        query: {
          farmId: params.farmId,
          batchId: params.batchId,
          date: params.date,
          includeRecords: params.includeRecords ? "1" : undefined
        }
      }
    );
  },

  getBatch(token: string, batchId: string) {
    return apiFetch<ApiSingle<PoultryBatch & { farm?: Record<string, unknown> }>>(
      `/farm-ops/batches/${batchId}`,
      { token }
    );
  },

  updateBatch(token: string, batchId: string, payload: Record<string, unknown>) {
    return apiFetch<ApiSingle<PoultryBatch>>(`/farm-ops/batches/${batchId}`, {
      token,
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  updateFarm(token: string, farmId: string, payload: Record<string, unknown>) {
    return apiFetch<ApiSingle<Record<string, unknown>>>(`/farm-ops/farms/${farmId}`, {
      token,
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  recordEggs(token: string, batchId: string, payload: Record<string, unknown>) {
    return api.create(`/batches/${batchId}/egg-production-records`, payload, token);
  },

  recordFeed(token: string, batchId: string, payload: Record<string, unknown>) {
    return api.create(`/batches/${batchId}/feeding-records`, payload, token);
  },

  recordMortality(token: string, batchId: string, payload: Record<string, unknown>) {
    return api.create(`/batches/${batchId}/mortality-records`, payload, token);
  },

  recordHealth(token: string, batchId: string, payload: Record<string, unknown>) {
    return api.create(`/batches/${batchId}/vaccination-records`, payload, token);
  },

  recordExpense(token: string, payload: Record<string, unknown>) {
    return api.create("/expenses", payload, token);
  }
};

export const FLOCK_TYPES = [
  { value: "layer", labelEn: "Layers", labelFr: "Pondeuses" },
  { value: "broiler", labelEn: "Broilers", labelFr: "Chair" },
  { value: "breeder", labelEn: "Breeders", labelFr: "Reproducteurs" },
  { value: "chick", labelEn: "Chicks", labelFr: "Poussins" },
  { value: "cockerel", labelEn: "Cockerels", labelFr: "Coqs" },
  { value: "local", labelEn: "Local chicken", labelFr: "Poulet local" },
  { value: "hybrid", labelEn: "Hybrid", labelFr: "Hybride" },
  { value: "other", labelEn: "Other", labelFr: "Autre" }
] as const;

export const FLOCK_STATUSES = [
  { value: "active", labelEn: "Active", labelFr: "Actif" },
  { value: "completed", labelEn: "Completed", labelFr: "Terminé" },
  { value: "sold", labelEn: "Sold", labelFr: "Vendu" },
  { value: "cancelled", labelEn: "Cancelled", labelFr: "Annulé" },
  { value: "lost", labelEn: "Lost", labelFr: "Perdu" }
] as const;

export const FEED_TYPES = [
  "Starter",
  "Grower",
  "Layer",
  "Finisher",
  "Breeder",
  "Other"
] as const;

export const EXPENSE_CATEGORIES = [
  "Feed",
  "Vaccines",
  "Medication",
  "Birds",
  "Equipment",
  "Electricity",
  "Water",
  "Labor",
  "Transport",
  "Packaging",
  "Repairs",
  "Cleaning",
  "Housing",
  "Other"
] as const;

export const MORTALITY_CAUSES = [
  "Unknown",
  "Disease",
  "Injury",
  "Heat stress",
  "Predation",
  "Weak bird",
  "Other"
] as const;

export const RECORD_TYPES = ["eggs", "feed", "mortality", "expense", "health"] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export function flockTypeLabel(value: string, lang: string) {
  const found = FLOCK_TYPES.find((t) => t.value === value);
  if (!found) return value;
  return lang === "en" ? found.labelEn : found.labelFr;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function recordPath(
  type: RecordType,
  params: { farmId: string; batchId: string; date?: string }
) {
  const q = new URLSearchParams({
    farmId: params.farmId,
    batchId: params.batchId,
    ...(params.date ? { date: params.date } : {})
  });
  return `/dashboard/farmer/manage/record/${type}?${q.toString()}`;
}
