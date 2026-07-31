import { MetricsSummary } from '@/types/equipment';

interface MetricsOverviewProps {
  metrics: MetricsSummary;
  loading?: boolean;
}

const metricConfig: Array<{
  key: keyof MetricsSummary;
  label: string;
  icon: string;
  iconColor: string;
}> = [
  { key: 'totalAssets', label: 'Total Equipment', icon: 'inventory_2', iconColor: 'text-primary' },
  { key: 'activeCount', label: 'Aktif', icon: 'check_circle', iconColor: 'text-emerald-600' },
  { key: 'inRepairCount', label: 'Dalam Perbaikan', icon: 'build', iconColor: 'text-amber-600' },
  { key: 'inactiveCount', label: 'Non-Aktif', icon: 'pause_circle', iconColor: 'text-slate-600' },
];

export default function MetricsOverview({ metrics, loading = false }: MetricsOverviewProps) {
  return (
    <section aria-label="Ringkasan status equipment" className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
      {metricConfig.map((metric) => (
        <article
          key={metric.key}
          className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm min-h-28 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start text-on-surface-variant gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider leading-snug">
              {metric.label}
            </span>
            <span className={`material-symbols-outlined ${metric.iconColor}`} aria-hidden="true">
              {metric.icon}
            </span>
          </div>
          {loading ? (
            <div className="h-9 w-20 rounded-md bg-surface-container-high animate-pulse" />
          ) : (
            <div className="text-3xl font-bold text-on-surface tracking-tight">
              {metrics[metric.key].toLocaleString('id-ID')}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
