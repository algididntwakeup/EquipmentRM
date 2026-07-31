'use client';

import { useRouter } from 'next/navigation';
import EquipmentForm from '@/components/equipment/EquipmentForm';
import AppShell from '@/components/layout/AppShell';
import { createEquipment } from '@/lib/api';
import { EquipmentInput } from '@/types/equipment';

export default function AddEquipmentPage() {
  const router = useRouter();

  const handleSubmit = async (input: EquipmentInput) => {
    const equipment = await createEquipment(input);
    router.push(`/equipment/${equipment.id}`);
  };

  return (
    <AppShell
      title="Tambah Equipment"
      description="Catat equipment dan tanggal inspeksi terakhir."
      maxWidth="3xl"
    >
      <EquipmentForm
        submitLabel="Simpan Equipment"
        cancelHref="/equipment"
        onSubmit={handleSubmit}
      />
    </AppShell>
  );
}
