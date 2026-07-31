'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import EquipmentForm from '@/components/equipment/EquipmentForm';
import AppShell from '@/components/layout/AppShell';
import StatePanel from '@/components/ui/StatePanel';
import { ApiClientError, getApiErrorMessage, getEquipment, updateEquipment } from '@/lib/api';
import { Equipment, EquipmentInput } from '@/types/equipment';

export default function EditEquipmentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handleSubmit = async (input: EquipmentInput) => {
    const updated = await updateEquipment(params.id, input);
    router.push(`/equipment/${updated.id}`);
  };

  return (
    <AppShell
      title="Edit Equipment"
      description="Perbarui data equipment dan catatan inspeksi terakhir."
      maxWidth="3xl"
    >
      {loading ? (
        <StatePanel type="loading" />
      ) : notFound ? (
        <StatePanel type="empty" title="Equipment tidak ditemukan" message="Data mungkin sudah dihapus atau ID tidak valid." />
      ) : error ? (
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
        <EquipmentForm
          initialValues={{
            nama_equipment: equipment.nama_equipment,
            tipe_equipment: equipment.tipe_equipment,
            lokasi: equipment.lokasi,
            tanggal_inspeksi_terakhir: equipment.tanggal_inspeksi_terakhir,
            status: equipment.status,
          }}
          submitLabel="Simpan Perubahan"
          cancelHref={`/equipment/${equipment.id}`}
          onSubmit={handleSubmit}
        />
      ) : null}
    </AppShell>
  );
}
