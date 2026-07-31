import Link from 'next/link';
import { EQUIPMENT_STATUSES, EquipmentStatusFilter } from '@/types/equipment';

interface ActionHeaderProps {
  selectedStatus: EquipmentStatusFilter;
  onStatusChange: (status: EquipmentStatusFilter) => void;
}

export default function ActionHeader({ selectedStatus, onStatusChange }: ActionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6">
      <div className="relative w-full sm:w-56">
        <label htmlFor="status-filter" className="sr-only">Filter berdasarkan status</label>
        <select
          id="status-filter"
          value={selectedStatus}
          onChange={(event) => onStatusChange(event.target.value as EquipmentStatusFilter)}
          className="appearance-none w-full bg-surface border border-outline-variant text-on-surface text-sm py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm cursor-pointer"
        >
          <option value="All">Semua status</option>
          {EQUIPMENT_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
          <span className="material-symbols-outlined" aria-hidden="true">arrow_drop_down</span>
        </div>
      </div>

      <Link
        href="/equipment/add"
        className="bg-primary-container text-white hover:bg-primary font-semibold text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors"
      >
        <span className="material-symbols-outlined" aria-hidden="true">add</span>
        Tambah Equipment
      </Link>
    </div>
  );
}
