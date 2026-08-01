'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { ApiClientError, getApiErrorMessage } from '@/lib/api';
import {
  EQUIPMENT_STATUSES,
  EquipmentInput,
  EquipmentStatus,
} from '@/types/equipment';

interface EquipmentFormProps {
  initialValues?: EquipmentInput;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (input: EquipmentInput) => Promise<void>;
}

type FormErrors = Partial<Record<keyof EquipmentInput, string>>;

const emptyValues: EquipmentInput = {
  nama_equipment: '',
  tipe_equipment: '',
  lokasi: '',
  tanggal_inspeksi_terakhir: '',
  status: 'Aktif',
};

const equipmentTypes = [
  'Pressure Vessel',
  'Piping',
  'Storage Tank',
  'Heat Exchanger',
  'Power Supply',
  'Steam Generator',
  'Instrumentation & Control',
];

function getLocalToday(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validate(values: EquipmentInput): FormErrors {
  const errors: FormErrors = {};
  if (!values.nama_equipment.trim()) errors.nama_equipment = 'Nama equipment wajib diisi';
  if (!values.tipe_equipment.trim()) errors.tipe_equipment = 'Tipe equipment wajib diisi';
  if (!values.lokasi.trim()) errors.lokasi = 'Lokasi wajib diisi';
  if (!values.tanggal_inspeksi_terakhir) {
    errors.tanggal_inspeksi_terakhir = 'Tanggal inspeksi terakhir wajib diisi';
  } else if (values.tanggal_inspeksi_terakhir > getLocalToday()) {
    errors.tanggal_inspeksi_terakhir = 'Tanggal inspeksi terakhir tidak boleh melewati hari ini';
  }
  if (!EQUIPMENT_STATUSES.includes(values.status)) {
    errors.status = 'Status equipment tidak valid';
  }
  return errors;
}

export default function EquipmentForm({
  initialValues = emptyValues,
  submitLabel,
  cancelHref,
  onSubmit,
}: EquipmentFormProps) {
  const [values, setValues] = useState<EquipmentInput>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inspectionDateInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Nilai max dipasang setelah hydration agar mengikuti tanggal lokal browser,
    // bukan timezone mesin yang menjalankan proses build Next.js.
    if (inspectionDateInput.current) {
      inspectionDateInput.current.max = getLocalToday();
    }
  }, []);

  const updateField = <K extends keyof EquipmentInput>(field: K, value: EquipmentInput[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setGeneralError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setGeneralError('');
    try {
      await onSubmit({
        nama_equipment: values.nama_equipment.trim(),
        tipe_equipment: values.tipe_equipment.trim(),
        lokasi: values.lokasi.trim(),
        tanggal_inspeksi_terakhir: values.tanggal_inspeksi_terakhir,
        status: values.status,
      });
    } catch (error) {
      if (error instanceof ApiClientError && Object.keys(error.details).length > 0) {
        setErrors(error.details as FormErrors);
      }
      setGeneralError(getApiErrorMessage(error));
      setSubmitting(false);
    }
  };

  const fieldClass = (field: keyof EquipmentInput) =>
    `w-full rounded-lg border bg-surface-container-lowest text-sm px-3.5 py-2.5 transition-colors focus:outline-none focus:ring-2 ${
      errors[field]
        ? 'border-error focus:ring-error/20'
        : 'border-outline-variant focus:border-primary focus:ring-primary/20'
    }`;

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-outline-variant rounded-xl shadow-sm p-5 md:p-6 space-y-5" noValidate>
      {generalError && (
        <div role="alert" className="rounded-lg border border-error/30 bg-error-container/40 p-3 text-sm text-on-error-container">
          {generalError}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant" htmlFor="nama_equipment">
          Nama Equipment <span className="text-error">*</span>
        </label>
        <input
          id="nama_equipment"
          value={values.nama_equipment}
          onChange={(event) => updateField('nama_equipment', event.target.value)}
          maxLength={150}
          autoComplete="off"
          placeholder="Contoh: Pressure Vessel PV-101"
          aria-invalid={Boolean(errors.nama_equipment)}
          aria-describedby={errors.nama_equipment ? 'nama-error' : undefined}
          className={fieldClass('nama_equipment')}
        />
        {errors.nama_equipment && <p id="nama-error" className="mt-1 text-xs text-error">{errors.nama_equipment}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant" htmlFor="tipe_equipment">
          Tipe Equipment <span className="text-error">*</span>
        </label>
        <input
          id="tipe_equipment"
          list="equipment-types"
          value={values.tipe_equipment}
          onChange={(event) => updateField('tipe_equipment', event.target.value)}
          maxLength={100}
          autoComplete="off"
          placeholder="Pilih atau tulis tipe equipment"
          aria-invalid={Boolean(errors.tipe_equipment)}
          aria-describedby={errors.tipe_equipment ? 'tipe-error' : undefined}
          className={fieldClass('tipe_equipment')}
        />
        <datalist id="equipment-types">
          {equipmentTypes.map((type) => <option key={type} value={type} />)}
        </datalist>
        {errors.tipe_equipment && <p id="tipe-error" className="mt-1 text-xs text-error">{errors.tipe_equipment}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant" htmlFor="lokasi">
          Lokasi <span className="text-error">*</span>
        </label>
        <input
          id="lokasi"
          value={values.lokasi}
          onChange={(event) => updateField('lokasi', event.target.value)}
          maxLength={150}
          autoComplete="off"
          placeholder="Contoh: Plant Area A"
          aria-invalid={Boolean(errors.lokasi)}
          aria-describedby={errors.lokasi ? 'lokasi-error' : undefined}
          className={fieldClass('lokasi')}
        />
        {errors.lokasi && <p id="lokasi-error" className="mt-1 text-xs text-error">{errors.lokasi}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant" htmlFor="tanggal_inspeksi_terakhir">
            Inspeksi Terakhir <span className="text-error">*</span>
          </label>
          <input
            ref={inspectionDateInput}
            id="tanggal_inspeksi_terakhir"
            type="date"
            value={values.tanggal_inspeksi_terakhir}
            onChange={(event) => updateField('tanggal_inspeksi_terakhir', event.target.value)}
            aria-invalid={Boolean(errors.tanggal_inspeksi_terakhir)}
            aria-describedby={errors.tanggal_inspeksi_terakhir ? 'tanggal-error tanggal-hint' : 'tanggal-hint'}
            className={fieldClass('tanggal_inspeksi_terakhir')}
          />
          {errors.tanggal_inspeksi_terakhir && <p id="tanggal-error" className="mt-1 text-xs text-error">{errors.tanggal_inspeksi_terakhir}</p>}
          <p id="tanggal-hint" className="mt-1 text-xs text-on-surface-variant">
            Maksimal tanggal hari ini; tanggal masa depan akan ditolak.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant" htmlFor="status">
            Status <span className="text-error">*</span>
          </label>
          <select
            id="status"
            value={values.status}
            onChange={(event) => updateField('status', event.target.value as EquipmentStatus)}
            aria-invalid={Boolean(errors.status)}
            className={fieldClass('status')}
          >
            {EQUIPMENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          {errors.status && <p className="mt-1 text-xs text-error">{errors.status}</p>}
        </div>
      </div>

      <div className="pt-4 border-t border-outline-variant flex flex-col-reverse sm:flex-row justify-end gap-3">
        <Link
          href={cancelHref}
          className="px-4 py-2.5 rounded-lg border border-outline-variant text-center text-on-surface-variant text-sm font-semibold hover:bg-surface-container-high"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 rounded-lg bg-primary-container text-white font-semibold text-sm hover:bg-primary flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-wait"
        >
          <span className={`material-symbols-outlined text-lg ${submitting ? 'animate-spin' : ''}`} aria-hidden="true">
            {submitting ? 'progress_activity' : 'save'}
          </span>
          {submitting ? 'Menyimpan…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
