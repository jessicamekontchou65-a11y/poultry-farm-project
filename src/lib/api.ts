import type { ApiList, ApiSingle, AuthResponse } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:5000/api";

type RequestOptions = RequestInit & {
  token?: string | null;
  query?: Record<string, string | number | undefined>;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  { token, query, headers, ...options }: RequestOptions = {}
): Promise<T> {
  const url = new URL(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    }
  });

  const body = (await response.json().catch(() => ({}))) as unknown;

  if (!response.ok) {
    const errorBody = body as { error?: { message?: string }; message?: string | string[] };
    const rawMessage = errorBody.error?.message ?? errorBody.message;
    const message = Array.isArray(rawMessage) ? rawMessage.join(", ") : rawMessage ?? "Request failed";
    throw new ApiError(response.status, message);
  }

  return body as T;
}

export const api = {
  register(payload: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    role: "customer" | "farmer" | "shopkeeper";
    verificationDocument?: string;
    verificationDocumentName?: string;
    verificationDocumentMimeType?: string;
  }) {
    return apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  login(payload: { identifier: string; password: string }) {
    return apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  me(token: string) {
    return apiFetch<ApiSingle<AuthResponse["data"]["user"]>>("/auth/me", {
      token
    });
  },
  list<T>(path: string, query?: RequestOptions["query"], token?: string | null) {
    return apiFetch<ApiList<T>>(path, { query, token });
  },
  get<T>(path: string, token?: string | null) {
    return apiFetch<ApiSingle<T>>(path, { token });
  },
  create<T>(path: string, payload: Record<string, unknown>, token?: string | null) {
    return apiFetch<ApiSingle<T>>(path, {
      token,
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  update<T>(path: string, payload: Record<string, unknown>, token?: string | null) {
    return apiFetch<ApiSingle<T>>(path, {
      token,
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },
  remove<T>(path: string, token?: string | null) {
    return apiFetch<ApiSingle<T>>(path, { token, method: "DELETE" });
  }
};

export type UploadedMedia = { _id: string; url: string; kind: "image" | "video"; mimeType: string; sizeBytes: number };

/**
 * Uploads one photo or video for a post. Uses XMLHttpRequest (not fetch) so the
 * caller can show upload progress, which matters for videos on mobile data.
 */
export function uploadMedia(file: File, token: string, onProgress?: (percent: number) => void) {
  return new Promise<UploadedMedia>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    xhr.open("POST", `${API_URL}/media/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let body: any = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Non-JSON error page.
      }
      if (xhr.status >= 200 && xhr.status < 300 && body?.data) {
        resolve(body.data as UploadedMedia);
      } else {
        const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
        reject(new ApiError(xhr.status, message || (xhr.status === 413 ? "File too large" : "Upload failed")));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, "Network error during upload"));
    xhr.send(form);
  });
}

