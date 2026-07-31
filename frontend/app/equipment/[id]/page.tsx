'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import StatePanel from '@/components/ui/StatePanel';
import { ApiClientError, deleteEquipment, getApiErrorMessage, getEquipment } from '@/lib/api';
import { Equipment } from '@/types/equipment';

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function EquipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    getEquipment(params.id, controller.signal)
      .then(setEquipment)
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        if (requestError instanceof ApiClientError && requestError.status === 404) {
          setNotFound(true);
        } else {
          setError(getApiErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params.id, retryToken]);

  const handleDelete = async () => {
    if (!equipment || !window.confirm(`Hapus ${equipment.nama_equipment}? Tindakan ini tidak dapat dibatalkan.`)) return;
    setDeleting(true);
    setError('');
    try {
      await deleteEquipment(equipment.id);
      router.push('/equipment');
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
      setDeleting(false);
    }
  };

  return (
    <AppShell
      title="Detail Equipment"
      description="Informasi inventaris dan inspeksi terakhir equipment."
      maxWidth="3xl"
    >
      {loading ? (
        <StatePanel type="loading" />
      ) : notFound ? (
        <StatePanel
          type="empty"
          title="Equipment tidak ditemukan"
          message="Data mungkin sudah dihapus atau ID tidak valid."
        />
      ) : error && !equipment ? (
        <StatePanel
          type="error"
          message={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            setNotFound(false);
            setRetryToken((value) => value + 1);
          }}
        />
      ) : equipment ? (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <Link href="/equipment" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_back</span>
              Kembali ke daftar
            </Link>
            <StatusBadge status={equipment.status} />
          </div>

          {error && <div role="alert" className="mb-4 rounded-lg border border-error/30 bg-error-container/40 p-3 text-sm text-on-error-container">{error}</div>}

          <article className="rounded-xl border border-outline-variant bg-surface shadow-sm overflow-hidden">
            <div className="border-b border-outline-variant bg-surface-container-low p-5 md:p-6">
              <p className="font-mono text-xs text-on-surface-variant">ID: {equipment.id}</p>
              <h2 className="mt-2 text-2xl font-bold text-on-surface">{equipment.nama_equipment}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">{equipment.tipe_equipment}</p>
            </div>

            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-6 p-5 md:p-6">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-outline">Lokasi</dt>
                <dd className="mt-1 text-sm font-semibold text-on-surface">{equipment.lokasi}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-outline">Inspeksi Terakhir</dt>
                <dd className="mt-1 text-sm font-mono text-on-surface">{equipment.tanggal_inspeksi_terakhir}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-outline">Dibuat</dt>
                <dd className="mt-1 text-sm text-on-surface">{formatTimestamp(equipment.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-outline">Terakhir Diperbarui</dt>
                <dd className="mt-1 text-sm text-on-surface">{formatTimestamp(equipment.updated_at)}</dd>
              </div>
            </dl>

            <div className="border-t border-outline-variant p-5 md:p-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-error/40 px-4 py-2.5 text-sm font-semibold text-error hover:bg-error-container disabled:opacity-50"
              >
                {deleting ? 'Menghapus…' : 'Hapus Equipment'}
              </button>
              <Link
                href={`/equipment/${equipment.id}/edit`}
                className="rounded-lg bg-primary-container px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary"
              >
                Edit Equipment
              </Link>
            </div>
          </article>
        </>
      ) : null}
    </AppShell>
  );
}
