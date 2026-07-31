import Link from 'next/link';
import { Equipment } from '@/types/equipment';
import StatusBadge from './StatusBadge';
import { compactEquipmentId } from './EquipmentTable';

interface EquipmentCardProps {
  item: Equipment;
  onDelete?: (item: Equipment) => void;
  deleting?: boolean;
}

export default function EquipmentCard({ item, onDelete, deleting = false }: EquipmentCardProps) {
  return (
    <article className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm">
      <div className="flex justify-between items-start gap-3 mb-3">
        <span
          className="text-xs font-mono text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded"
          title={item.id}
        >
          #{compactEquipmentId(item.id)}
        </span>
        <StatusBadge status={item.status} size="sm" />
      </div>
      <Link href={`/equipment/${item.id}`} className="block group">
        <h2 className="text-base font-bold text-on-surface group-hover:text-primary">
          {item.nama_equipment}
        </h2>
        <p className="mt-1 text-xs text-on-surface-variant">{item.tipe_equipment}</p>
      </Link>
      <dl className="grid grid-cols-2 gap-3 text-xs mt-4">
        <div>
          <dt className="text-outline text-[10px] uppercase tracking-wider font-semibold">Lokasi</dt>
          <dd className="text-on-surface font-medium mt-1 break-words">{item.lokasi}</dd>
        </div>
        <div>
          <dt className="text-outline text-[10px] uppercase tracking-wider font-semibold">Inspeksi</dt>
          <dd className="text-on-surface font-mono mt-1">{item.tanggal_inspeksi_terakhir}</dd>
        </div>
      </dl>
      <div className="mt-4 pt-3 border-t border-outline-variant flex justify-end gap-2">
        <Link
          href={`/equipment/${item.id}/edit`}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-fixed"
        >
          Edit
        </Link>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(item)}
            disabled={deleting}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-error hover:bg-error-container disabled:opacity-50"
          >
            {deleting ? 'Menghapus…' : 'Hapus'}
          </button>
        )}
      </div>
    </article>
  );
}
