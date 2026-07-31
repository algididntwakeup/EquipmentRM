export const EQUIPMENT_STATUSES = [
  'Aktif',
  'Dalam Perbaikan',
  'Non-Aktif',
] as const;

export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];
export type EquipmentStatusFilter = EquipmentStatus | 'All';

export type SortField =
  | 'id'
  | 'nama_equipment'
  | 'tipe_equipment'
  | 'lokasi'
  | 'tanggal_inspeksi_terakhir'
  | 'status';

export type SortOrder = 'asc' | 'desc';

export interface Equipment {
  id: string;
  nama_equipment: string;
  tipe_equipment: string;
  lokasi: string;
  tanggal_inspeksi_terakhir: string;
  status: EquipmentStatus;
  created_at: string;
  updated_at: string;
}

export interface EquipmentInput {
  nama_equipment: string;
  tipe_equipment: string;
  lokasi: string;
  tanggal_inspeksi_terakhir: string;
  status: EquipmentStatus;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface EquipmentListResponse {
  items: Equipment[];
  pagination: PaginationMeta;
}

export interface MetricsSummary {
  totalAssets: number;
  activeCount: number;
  inRepairCount: number;
  inactiveCount: number;
}
