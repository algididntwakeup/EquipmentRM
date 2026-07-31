'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import EquipmentCard from '@/components/ui/EquipmentCard';
import EquipmentTable from '@/components/ui/EquipmentTable';
import Pagination from '@/components/ui/Pagination';
import StatePanel from '@/components/ui/StatePanel';
import { deleteEquipment, getApiErrorMessage, getEquipmentList } from '@/lib/api';
import {
  EQUIPMENT_STATUSES,
  Equipment,
  EquipmentStatusFilter,
  PaginationMeta,
  SortField,
  SortOrder,
} from '@/types/equipment';

const emptyPagination: PaginationMeta = {
  page: 1,
  limit: 10,
  total_items: 0,
  total_pages: 1,
};

export default function EquipmentListPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination);
  const [status, setStatus] = useState<EquipmentStatusFilter>('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState<SortField>('nama_equipment');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const normalizedSearch = search.trim();
    if (normalizedSearch === debouncedSearch) return;

    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError('');
      setPage(1);
      setDebouncedSearch(normalizedSearch);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [debouncedSearch, search]);

  useEffect(() => {
    const controller = new AbortController();

    getEquipmentList({
      page,
      limit,
      status: status === 'All' ? '' : status,
      search: debouncedSearch,
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
  }, [debouncedSearch, limit, page, reloadToken, status]);

  const isSearchPending = search.trim() !== debouncedSearch;

  const sortedEquipment = useMemo(() => {
    return [...equipment].sort((left, right) => {
      const comparison = String(left[sortField]).localeCompare(String(right[sortField]), 'id', {
        numeric: true,
        sensitivity: 'base',
      });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [equipment, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortOrder('asc');
  };

  const handleDelete = async (item: Equipment) => {
    if (!window.confirm(`Hapus ${item.nama_equipment}? Tindakan ini tidak dapat dibatalkan.`)) return;

    setDeletingId(item.id);
    setError('');
    setNotice('');
    try {
      await deleteEquipment(item.id);
      setNotice(`${item.nama_equipment} berhasil dihapus.`);
      if (equipment.length === 1 && page > 1) {
        setLoading(true);
        setPage((current) => current - 1);
      } else {
        setLoading(true);
        setReloadToken((value) => value + 1);
      }
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppShell
      title="Daftar Equipment"
      description="Kelola inventaris dan status inspeksi peralatan industri."
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Inventaris Equipment</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Data ditampilkan langsung dari PostgreSQL melalui REST API.
          </p>
        </div>
        <Link
          href="/equipment/add"
          className="bg-primary-container text-white hover:bg-primary font-semibold text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined" aria-hidden="true">add</span>
          Tambah Equipment
        </Link>
      </div>

      <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm mb-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="md:flex-[1.5]">
          <label htmlFor="equipment-search" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            Cari equipment
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant" aria-hidden="true">
              search
            </span>
            <input
              id="equipment-search"
              type="search"
              value={search}
              maxLength={100}
              autoComplete="off"
              placeholder="Nama, tipe, atau lokasi..."
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 pl-10 pr-20 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {isSearchPending && (
              <span
                className={`material-symbols-outlined absolute ${search ? 'right-10' : 'right-3'} top-1/2 -translate-y-1/2 animate-spin text-lg text-primary`}
                aria-label="Menunggu pencarian"
              >
                progress_activity
              </span>
            )}
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label="Hapus kata pencarian"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
              </button>
            )}
          </div>
        </div>
        <div className="md:flex-1">
          <label htmlFor="equipment-status" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            Filter status
          </label>
          <select
            id="equipment-status"
            value={status}
            onChange={(event) => {
              setLoading(true);
              setError('');
              setStatus(event.target.value as EquipmentStatusFilter);
              setPage(1);
            }}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="All">Semua status</option>
            {EQUIPMENT_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className="md:w-40 md:flex-none">
          <label htmlFor="page-limit" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            Data per halaman
          </label>
          <select
            id="page-limit"
            value={limit}
            onChange={(event) => {
              setLoading(true);
              setError('');
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {[10, 20, 50].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className="sm:w-56 md:hidden">
          <label htmlFor="mobile-sort" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            Urutkan halaman ini
          </label>
          <select
            id="mobile-sort"
            value={`${sortField}:${sortOrder}`}
            onChange={(event) => {
              const [field, order] = event.target.value.split(':') as [SortField, SortOrder];
              setSortField(field);
              setSortOrder(order);
            }}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm"
          >
            <option value="nama_equipment:asc">Nama A–Z</option>
            <option value="nama_equipment:desc">Nama Z–A</option>
            <option value="tanggal_inspeksi_terakhir:desc">Inspeksi terbaru</option>
            <option value="tanggal_inspeksi_terakhir:asc">Inspeksi terlama</option>
          </select>
        </div>
      </div>

      {notice && (
        <div role="status" className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      {loading ? (
        <StatePanel type="loading" />
      ) : error ? (
        <StatePanel
          type="error"
          message={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            setReloadToken((value) => value + 1);
          }}
        />
      ) : sortedEquipment.length === 0 ? (
        <StatePanel
          type="empty"
          message={debouncedSearch
            ? `Tidak ada equipment yang cocok dengan “${debouncedSearch}”.`
            : 'Belum ada data untuk filter yang dipilih.'}
        />
      ) : (
        <>
          <p className="mb-3 text-xs text-on-surface-variant" role="status" aria-live="polite">
            {debouncedSearch
              ? `${pagination.total_items} hasil untuk “${debouncedSearch}”. Kolom tabel dapat diurutkan untuk halaman ini.`
              : 'Kolom tabel dapat diurutkan untuk data pada halaman ini.'}
          </p>
          <EquipmentTable
            items={sortedEquipment}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
          <div className="md:hidden flex flex-col gap-3">
            {sortedEquipment.map((item) => (
              <EquipmentCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                deleting={deletingId === item.id}
              />
            ))}
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.total_pages}
            totalItems={pagination.total_items}
            limit={pagination.limit}
            onPageChange={(nextPage) => {
              setLoading(true);
              setError('');
              setPage(nextPage);
            }}
            disabled={loading}
          />
        </>
      )}
    </AppShell>
  );
}
