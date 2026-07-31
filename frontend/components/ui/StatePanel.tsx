interface StatePanelProps {
  type: 'loading' | 'error' | 'empty';
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function StatePanel({ type, title, message, onRetry }: StatePanelProps) {
  if (type === 'loading') {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface p-10 text-center" role="status">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin" aria-hidden="true">
          progress_activity
        </span>
        <p className="mt-3 text-sm font-semibold text-on-surface">Memuat data equipment…</p>
      </div>
    );
  }

  const isError = type === 'error';
  return (
    <div
      className={`rounded-xl border p-8 text-center ${
        isError ? 'border-error/30 bg-error-container/30' : 'border-outline-variant bg-surface'
      }`}
      role={isError ? 'alert' : 'status'}
    >
      <span
        className={`material-symbols-outlined text-4xl ${isError ? 'text-error' : 'text-outline'}`}
        aria-hidden="true"
      >
        {isError ? 'cloud_off' : 'inventory_2'}
      </span>
      <h2 className="mt-3 font-bold text-on-surface">
        {title ?? (isError ? 'Data belum dapat dimuat' : 'Belum ada equipment')}
      </h2>
      {message && <p className="mx-auto mt-1 max-w-lg text-sm text-on-surface-variant">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
        >
          Coba lagi
        </button>
      )}
    </div>
  );
}
