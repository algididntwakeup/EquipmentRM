'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import ActionHeader from '@/components/ui/ActionHeader';
import EquipmentCard from '@/components/ui/EquipmentCard';
import EquipmentTable from '@/components/ui/EquipmentTable';
import MetricsOverview from '@/components/ui/MetricsOverview';
import Pagination from '@/components/ui/Pagination';
import StatePanel from '@/components/ui/StatePanel';
import { getApiErrorMessage, getEquipmentList } from '@/lib/api';
import {
  Equipment,
  EquipmentStatusFilter,
  MetricsSummary,
  PaginationMeta,
} from '@/types/equipment';

const emptyMetrics: MetricsSummary = {
  totalAssets: 0,
  activeCount: 0,
  inRepairCount: 0,
  inactiveCount: 0,
};

const emptyPagination: PaginationMeta = {
  page: 1,
  limit: 5,
  total_items: 0,
  total_pages: 1,
};

export default function DashboardPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination);
  const [metrics, setMetrics] = useState<MetricsSummary>(emptyMetrics);
  const [status, setStatus] = useState<EquipmentStatusFilter>('All');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryToken, setRetryToken] = useState(0);

  const loadMetrics = useCallback(async (signal: AbortSignal) => {
    try {
      const [all, active, repair, inactive] = await Promise.all([
        getEquipmentList({ page: 1, limit: 1, signal }),
        getEquipmentList({ page: 1, limit: 1, status: 'Aktif', signal }),
        getEquipmentList({ page: 1, limit: 1, status: 'Dalam Perbaikan', signal }),
        getEquipmentList({ page: 1, limit: 1, status: 'Non-Aktif', signal }),
      ]);
      setMetrics({
        totalAssets: all.pagination.total_items,
        activeCount: active.pagination.total_items,
        inRepairCount: repair.pagination.total_items,
        inactiveCount: inactive.pagination.total_items,
      });
    } finally {
      if (!signal.aborted) setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    getEquipmentList({
      page,
      limit: 5,
      status: status === 'All' ? '' : status,
      signal: controller.signal,
    })
      .then((response) => {
        setEquipment(response.items);
        setPagination(response.pagination);
      })
      .catch((requestError: unknown) => {
        if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) {
          setError(getApiErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, retryToken, status]);

  useEffect(() => {
    const controller = new AbortController();
    loadMetrics(controller.signal).catch((requestError: unknown) => {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) {
        setError(getApiErrorMessage(requestError));
      }
    });
    return () => controller.abort();
  }, [loadMetrics, retryToken]);

  const handleStatusChange = (nextStatus: EquipmentStatusFilter) => {
    setLoading(true);
    setError('');
    setStatus(nextStatus);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setLoading(true);
    setError('');
    setPage(nextPage);
  };

  const handleRetry = () => {
    setLoading(true);
    setMetricsLoading(true);
    setError('');
    setRetryToken((value) => value + 1);
  };

  return (
    <AppShell
      title="Dashboard Equipment"
      description="Ringkasan kondisi aset dan aktivitas inspeksi terbaru."
    >
      <ActionHeader selectedStatus={status} onStatusChange={handleStatusChange} />
      <MetricsOverview metrics={metrics} loading={metricsLoading} />

      <div className="flex items-end justify-between gap-4 mb-3">
        <div>
          <h2 className="font-bold text-on-surface">Equipment Terbaru</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {status === 'All' ? 'Semua status' : `Status: ${status}`}
          </p>
        </div>
      </div>

      {loading ? (
        <StatePanel type="loading" />
      ) : error ? (
        <StatePanel type="error" message={error} onRetry={handleRetry} />
      ) : equipment.length === 0 ? (
        <StatePanel type="empty" message="Tambahkan equipment baru atau pilih filter status lain." />
      ) : (
        <>
          <EquipmentTable items={equipment} />
          <div className="md:hidden flex flex-col gap-3">
            {equipment.map((item) => <EquipmentCard key={item.id} item={item} />)}
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.total_pages}
            totalItems={pagination.total_items}
            limit={pagination.limit}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </AppShell>
  );
}
