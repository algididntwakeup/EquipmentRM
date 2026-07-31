import Link from 'next/link';
import { Equipment, SortField, SortOrder } from '@/types/equipment';
import StatusBadge from './StatusBadge';

interface EquipmentTableProps {
  items: Equipment[];
  sortField?: SortField;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
  onDelete?: (item: Equipment) => void;
  deletingId?: string | null;
}

const columns: Array<{ field: SortField; label: string }> = [
  { field: 'nama_equipment', label: 'Nama Equipment' },
  { field: 'tipe_equipment', label: 'Tipe' },
  { field: 'lokasi', label: 'Lokasi' },
  { field: 'tanggal_inspeksi_terakhir', label: 'Inspeksi Terakhir' },
  { field: 'status', label: 'Status' },
];

export function compactEquipmentId(id: string): string {
  return id.length > 12 ? id.slice(0, 8).toUpperCase() : id;
}

export default function EquipmentTable({
  items,
  sortField,
  sortOrder,
  onSort,
  onDelete,
  deletingId,
}: EquipmentTableProps) {
  return (
    <div className="hidden md:block bg-surface rounded-xl border border-outline-variant shadow-sm overflow-x-auto">
      <table className="w-full min-w-[900px] text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
            <th
              className="py-3 px-4"
              aria-sort={sortField === 'id' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              {onSort ? (
                <button
                  type="button"
                  onClick={() => onSort('id')}
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                >
                  ID
                  <span className="material-symbols-outlined text-base" aria-hidden="true">
                    {sortField === 'id'
                      ? sortOrder === 'asc'
                        ? 'arrow_upward'
                        : 'arrow_downward'
                      : 'swap_vert'}
                  </span>
                </button>
              ) : (
                'ID'
              )}
            </th>
            {columns.map((column) => {
              const isSorted = sortField === column.field;
              return (
                <th
                  key={column.field}
                  className="py-3 px-4"
                  aria-sort={
                    isSorted ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'
                  }
                >
                  {onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.field)}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      {column.label}
                      <span className="material-symbols-outlined text-base" aria-hidden="true">
                        {isSorted
                          ? sortOrder === 'asc'
                            ? 'arrow_upward'
                            : 'arrow_downward'
                          : 'swap_vert'}
                      </span>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              );
            })}
            <th className="py-3 px-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="text-sm text-on-surface">
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors"
            >
              <td className="py-3.5 px-4 font-mono text-xs text-on-surface-variant" title={item.id}>
                #{compactEquipmentId(item.id)}
              </td>
              <td className="py-3.5 px-4 font-semibold">
                <Link href={`/equipment/${item.id}`} className="hover:text-primary hover:underline">
                  {item.nama_equipment}
                </Link>
              </td>
              <td className="py-3.5 px-4 text-on-surface-variant">{item.tipe_equipment}</td>
              <td className="py-3.5 px-4">{item.lokasi}</td>
              <td className="py-3.5 px-4 text-xs font-mono text-on-surface-variant">
                {item.tanggal_inspeksi_terakhir}
              </td>
              <td className="py-3.5 px-4"><StatusBadge status={item.status} /></td>
              <td className="py-3.5 px-4">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/equipment/${item.id}`}
                    aria-label={`Lihat ${item.nama_equipment}`}
                    title="Lihat detail"
                    className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">visibility</span>
                  </Link>
                  <Link
                    href={`/equipment/${item.id}/edit`}
                    aria-label={`Edit ${item.nama_equipment}`}
                    title="Edit"
                    className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">edit</span>
                  </Link>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      disabled={deletingId === item.id}
                      aria-label={`Hapus ${item.nama_equipment}`}
                      title="Hapus"
                      className="p-2 rounded-full text-on-surface-variant hover:bg-error-container hover:text-error disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-lg" aria-hidden="true">
                        {deletingId === item.id ? 'progress_activity' : 'delete'}
                      </span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
