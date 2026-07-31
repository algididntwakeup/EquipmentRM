import {
  Equipment,
  EquipmentInput,
  EquipmentListResponse,
  EquipmentStatus,
  PaginationMeta,
} from '@/types/equipment';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080').replace(
  /\/$/,
  '',
);

interface ApiSuccess<T> {
  success: true;
  data: T;
  pagination?: PaginationMeta;
  message?: string;
}

interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

export class ApiClientError extends Error {
  status: number;
  code: string;
  details: Record<string, string>;

  constructor(
    message: string,
    options: { status: number; code?: string; details?: Record<string, string> },
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.code = options.code ?? 'REQUEST_ERROR';
    this.details = options.details ?? {};
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiClientError(
      'Tidak dapat terhubung ke API. Pastikan backend berjalan di port 8080.',
      { status: 0, code: 'NETWORK_ERROR' },
    );
  }

  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;

  if (!response.ok || !payload || payload.success === false) {
    const failure = payload && payload.success === false ? payload.error : undefined;
    throw new ApiClientError(failure?.message ?? 'Permintaan ke API gagal.', {
      status: response.status,
      code: failure?.code,
      details: failure?.details,
    });
  }

  return payload;
}

export async function getEquipmentList(
  options: {
    page?: number;
    limit?: number;
    status?: EquipmentStatus | '';
    signal?: AbortSignal;
  } = {},
): Promise<EquipmentListResponse> {
  const query = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 10),
  });
  if (options.status) {
    query.set('status', options.status);
  }

  const response = await request<Equipment[]>(`/equipment?${query}`, {
    signal: options.signal,
  });

  return {
    items: response.data,
    pagination: response.pagination ?? {
      page: options.page ?? 1,
      limit: options.limit ?? 10,
      total_items: response.data.length,
      total_pages: 1,
    },
  };
}

export async function getEquipment(id: string, signal?: AbortSignal): Promise<Equipment> {
  const response = await request<Equipment>(`/equipment/${encodeURIComponent(id)}`, { signal });
  return response.data;
}

export async function createEquipment(input: EquipmentInput): Promise<Equipment> {
  const response = await request<Equipment>('/equipment', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function updateEquipment(id: string, input: EquipmentInput): Promise<Equipment> {
  const response = await request<Equipment>(`/equipment/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function deleteEquipment(id: string): Promise<void> {
  await request<never>(`/equipment/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function getApiErrorMessage(error: unknown): string {
  return error instanceof ApiClientError
    ? error.message
    : 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.';
}
