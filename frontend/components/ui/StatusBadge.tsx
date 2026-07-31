import { EquipmentStatus } from '@/types/equipment';

interface StatusBadgeProps {
  status: EquipmentStatus;
  size?: 'sm' | 'md';
}

const statusStyles: Record<EquipmentStatus, { badge: string; dot: string }> = {
  Aktif: { badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  'Dalam Perbaikan': { badge: 'bg-amber-100 text-amber-900', dot: 'bg-amber-500' },
  'Non-Aktif': { badge: 'bg-slate-200 text-slate-700', dot: 'bg-slate-500' },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const styles = statusStyles[status];
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold tracking-wide ${styles.badge} ${
        isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`rounded-full mr-1.5 ${styles.dot} ${isSmall ? 'w-1 h-1' : 'w-1.5 h-1.5'}`}
      />
      {status}
    </span>
  );
}
