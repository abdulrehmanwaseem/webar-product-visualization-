const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { body, ...rest } = options;

  const config: RequestInit = {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...rest.headers,
    },
    credentials: "include",
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Item types
export interface Item {
  id: string;
  merchantId: string;
  name: string;
  slug: string;
  description?: string;
  modelUrl: string;
  usdzUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  totalScans?: number;
  uniqueScans?: number;
}

export interface ItemList {
  items: Item[];
  total: number;
}

// Auth types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  planType: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
}

// Upload types
export interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

export interface DirectUploadResponse {
  publicUrl: string;
  key: string;
}

// Analytics types
export interface ItemAnalytics {
  itemId: string;
  totalScans: number;
  uniqueScans: number;
  avgDuration: number;
  deviceBreakdown: Record<string, number>;
  dailyScans: Array<{ date: string; count: number }>;
}

export interface MerchantOverview {
  totalItems: number;
  totalScans: number;
  recentScans: number;
  topItems: Array<{ id: string; name: string; slug: string; scans: number }>;
}

// QR types
export interface QrPreview {
  dataUrl: string;
  arUrl: string;
}

// API functions
export const api = {
  // Auth
  auth: {
    login: (data: LoginDto) =>
      fetchApi<User>("/auth/login", { method: "POST", body: data }),
    register: (data: RegisterDto) =>
      fetchApi<User>("/auth/register", { method: "POST", body: data }),
    logout: () => fetchApi("/auth/logout", { method: "POST" }),
    me: () => fetchApi<User>("/auth/me"),
  },

  // Items
  items: {
    list: () => fetchApi<ItemList>("/items"),
    getBySlug: (slug: string) => fetchApi<Item>(`/items/slug/${slug}`),
    getById: (id: string) => fetchApi<Item>(`/items/${id}`),
    create: (data: Partial<Item>) =>
      fetchApi<Item>("/items", { method: "POST", body: data }),
    update: (id: string, data: Partial<Item>) =>
      fetchApi<Item>(`/items/${id}`, { method: "PATCH", body: data }),
    delete: (id: string) => fetchApi(`/items/${id}`, { method: "DELETE" }),
  },

  // Upload
  upload: {
    getPresignedUrl: (
      fileName: string,
      fileType: "glb" | "usdz" | "thumbnail",
      contentType?: string
    ) =>
      fetchApi<PresignedUrlResponse>("/upload/presigned-url", {
        method: "POST",
        body: { fileName, fileType, contentType },
      }),
    // Direct upload through server (bypasses CORS issues with R2)
    uploadFile: async (file: File, fileType: "glb" | "usdz" | "thumbnail") => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", fileType);

      const response = await fetch(`${API_BASE_URL}/upload/direct`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Upload failed" }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result: DirectUploadResponse = await response.json();
      return result.publicUrl;
    },
  },

  // QR
  qr: {
    preview: (itemId: string) =>
      fetchApi<QrPreview>(`/qr/items/${itemId}/preview`),
    downloadUrl: (itemId: string, format: "png" | "svg" = "png", size = 300) =>
      `${API_BASE_URL}/qr/items/${itemId}?format=${format}&size=${size}`,
  },

  // Analytics
  analytics: {
    recordScan: (data: {
      itemId: string;
      deviceType: string;
      sessionId: string;
      userAgent?: string;
    }) =>
      fetchApi<{ id: string }>("/analytics/scan", {
        method: "POST",
        body: data,
      }),
    updateDuration: (scanEventId: string, duration: number) =>
      fetchApi("/analytics/scan/duration", {
        method: "PATCH",
        body: { scanEventId, duration },
      }),
    getItemAnalytics: (itemId: string) =>
      fetchApi<ItemAnalytics>(`/analytics/items/${itemId}`),
    getMerchantOverview: () =>
      fetchApi<MerchantOverview>("/analytics/overview"),
  },
};
