interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  limit?: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1);
  const firstItem = totalItems && limit ? (currentPage - 1) * limit + 1 : undefined;
  const lastItem =
    totalItems && limit && firstItem ? Math.min(firstItem + limit - 1, totalItems) : undefined;

  return (
    <nav aria-label="Pagination equipment" className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6">
      <p className="text-xs text-on-surface-variant">
        {totalItems === 0
          ? 'Belum ada equipment'
          : firstItem && lastItem && totalItems
            ? `Menampilkan ${firstItem}–${lastItem} dari ${totalItems}`
            : null}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Halaman sebelumnya"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          className="p-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
        </button>
        <span className="min-w-28 text-center text-xs text-on-surface-variant font-medium">
          Halaman {currentPage} dari {safeTotalPages}
        </span>
        <button
          type="button"
          aria-label="Halaman berikutnya"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage >= safeTotalPages}
          className="p-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
        </button>
      </div>
    </nav>
  );
}
