# Product Requirements Document (PRD)
## Equipment Inventory Module
### Reksolindo — Asset Reliability Management Platform

| | |
|---|---|
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 31 Juli 2026 |
| **Status** | Draft — untuk review |
| **Referensi** | Take-Home Test — Software Engineer (Reksolindo) |
| **Cakupan** | Modul inti: Pencatatan & pemantauan data inspeksi peralatan industri |

---

## 1. Ringkasan Eksekutif

Dokumen ini menjabarkan kebutuhan pengembangan **modul Equipment Inventory** untuk platform *asset reliability management* Reksolindo, sesuai spesifikasi pada take-home test. Modul ini adalah REST API sederhana untuk mengelola data inventaris peralatan industri (Pressure Vessel, Piping, Storage Tank, dll) dengan operasi CRUD standar, pagination, filter, validasi input, dan penanganan error yang wajar.

**Stack yang dipilih:**

| Layer | Teknologi |
|---|---|
| Backend | Golang (REST API) |
| Database | PostgreSQL |
| Frontend | Next.js |
| Deployment | Docker + docker-compose |

---

## 2. Latar Belakang & Masalah

Reksolindo mengelola banyak peralatan industri yang wajib diinspeksi berkala untuk alasan keselamatan dan kepatuhan (safety & compliance). Saat ini pencatatan data equipment dan histori inspeksi belum tersentral, sehingga menyulitkan tim reliability untuk mengetahui status, lokasi, dan riwayat inspeksi terakhir setiap aset secara cepat dan andal.

---

## 3. Tujuan Produk & Success Metrics

| Tujuan | Metrik Keberhasilan |
|---|---|
| Sentralisasi data equipment | 100% data equipment tercatat di satu sumber (PostgreSQL), bukan spreadsheet terpisah |
| Kemudahan pencarian & filter | User dapat menemukan status equipment dalam < 3 klik |
| Reliabilitas sistem | Setiap endpoint merespons dengan status code & pesan error yang jelas (tidak ada 500 tanpa keterangan) |
| Kemudahan operasional | Project bisa dijalankan reviewer hanya dengan `docker-compose up` |

---

## 4. Target Pengguna

| Persona | Kebutuhan Utama |
|---|---|
| **Reliability Engineer** | Input & update data equipment, catat tanggal inspeksi terakhir |
| **Manajer Operasional** | Melihat ringkasan status aset (Aktif/Dalam Perbaikan/Non-Aktif) di lokasi tertentu |

---

## 5. Ruang Lingkup

### 5.1 In-Scope — Wajib (sesuai soal take-home test)
- CRUD Equipment: create, read list (dengan pagination), read detail, update, delete
- Filter equipment berdasarkan `status` (bonus, opsional di soal — tetap dimasukkan sebagai target)
- Validasi input dasar (field wajib, format tanggal)
- Penanganan error yang wajar (404 untuk id tidak ditemukan, 400 untuk input tidak valid)
- Penyimpanan data di PostgreSQL (bukan in-memory/array)

### 5.2 In-Scope — Bonus (nilai tambah, sesuai soal)
- Stack Golang + PostgreSQL untuk backend
- Frontend sederhana (Next.js) untuk berinteraksi dengan API
- Containerized dengan Docker (`docker-compose up` langsung jalan)
- Unit test untuk minimal satu endpoint

### 5.3 Out-of-Scope (tidak diminta di soal, tidak dikerjakan)
- Autentikasi & role-based access control (RBAC)
- Modul jadwal inspeksi otomatis / reminder
- Upload dokumen/foto inspeksi
- Audit trail / histori perubahan data
- Fitur finansial (nilai aset, penyusutan, dsb.)

---

## 6. Arsitektur & Tech Stack

```
┌─────────────────┐        HTTPS/JSON        ┌───────────────────┐        SQL         ┌──────────────┐
│   Next.js FE     │  ───────────────────▶   │   Golang REST API  │  ───────────────▶ │  PostgreSQL   │
│ (App Router, TS) │  ◀───────────────────   │ (Gin/Echo + sqlx)   │  ◀─────────────── │              │
└─────────────────┘                          └───────────────────┘                    └──────────────┘
```

- **Backend (Golang)**
  - Framework: `Gin` atau `Echo` (rekomendasi Gin — dokumentasi luas, umum dipakai)
  - DB layer: `sqlx` (rekomendasi dibanding ORM penuh seperti GORM, agar query eksplisit dan mudah dijelaskan saat sesi review)
  - Struktur layer: `handler → service → repository`, agar HTTP handling, business logic, dan query DB terpisah rapi — memudahkan penulisan unit test
  - Migration tool: `golang-migrate`
- **Database:** PostgreSQL 15+
- **Frontend:** Next.js (App Router) + TypeScript, fetch ke API via `fetch`/`axios`, styling bebas (Tailwind direkomendasikan agar cepat)
- **Deployment:** `docker-compose.yml` berisi 3 service — `api`, `db`, `web` — supaya `docker-compose up` langsung jalan tanpa setup manual tambahan

---

## 7. Data Model

### Tabel `equipment`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID / SERIAL PK | Primary key |
| `nama_equipment` | VARCHAR(150) | Wajib, tidak boleh kosong |
| `tipe_equipment` | VARCHAR(100) | Contoh: Pressure Vessel, Piping, Storage Tank |
| `lokasi` | VARCHAR(150) | Wajib, tidak boleh kosong |
| `tanggal_inspeksi_terakhir` | DATE | Wajib, format `YYYY-MM-DD` |
| `status` | VARCHAR(30) | Enum: `Aktif`, `Dalam Perbaikan`, `Non-Aktif` |
| `created_at` | TIMESTAMPTZ | Default `now()` |
| `updated_at` | TIMESTAMPTZ | Auto-update saat record diubah |

> **Keputusan desain:** `status` disimpan sebagai `VARCHAR` dengan validasi enum di level aplikasi (bukan `ENUM` type PostgreSQL) — lebih fleksibel kalau ke depan ada penambahan status baru, tanpa perlu migration `ALTER TYPE`.

---

## 8. Fitur & User Stories

| # | User Story | Prioritas |
|---|---|---|
| 1 | Sebagai reliability engineer, saya bisa menambahkan data equipment baru | Wajib |
| 2 | Sebagai reliability engineer, saya bisa melihat daftar semua equipment dengan pagination | Wajib |
| 3 | Sebagai reliability engineer, saya bisa melihat detail satu equipment | Wajib |
| 4 | Sebagai reliability engineer, saya bisa mengupdate data equipment (misal update tanggal inspeksi terakhir) | Wajib |
| 5 | Sebagai reliability engineer, saya bisa menghapus data equipment | Wajib |
| 6 | Sebagai manajer, saya bisa filter equipment berdasarkan status | Bonus |
| 7 | Sebagai reviewer, saya bisa berinteraksi dengan API lewat tampilan frontend sederhana | Bonus |

---

## 9. Spesifikasi API

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/equipment` | Tambah equipment baru |
| GET | `/equipment?page=1&limit=10` | List equipment + pagination sederhana |
| GET | `/equipment/:id` | Detail satu equipment |
| PUT | `/equipment/:id` | Update equipment |
| DELETE | `/equipment/:id` | Hapus equipment |
| GET | `/equipment?status=Aktif` | Filter berdasarkan status |

**Contoh request `POST /equipment`:**
```json
{
  "nama_equipment": "Pressure Vessel PV-101",
  "tipe_equipment": "Pressure Vessel",
  "lokasi": "Plant Area A",
  "tanggal_inspeksi_terakhir": "2026-05-10",
  "status": "Aktif"
}
```

**Contoh response sukses (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "b3f1c2a0-...",
    "nama_equipment": "Pressure Vessel PV-101",
    "tipe_equipment": "Pressure Vessel",
    "lokasi": "Plant Area A",
    "tanggal_inspeksi_terakhir": "2026-05-10",
    "status": "Aktif",
    "created_at": "2026-07-31T10:00:00Z"
  }
}
```

**Contoh response list (`GET /equipment?page=1&limit=10`):**
```json
{
  "success": true,
  "data": [ /* array of equipment */ ],
  "pagination": { "page": 1, "limit": 10, "total_items": 47, "total_pages": 5 }
}
```

**Contoh response error (`404 Not Found`):**
```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Equipment dengan id tersebut tidak ditemukan" }
}
```

**Contoh response error (`400 Bad Request`):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input tidak valid",
    "details": { "nama_equipment": "Field wajib diisi", "tanggal_inspeksi_terakhir": "Format tanggal tidak valid" }
  }
}
```

### 9.1 Aturan Validasi

| Field | Aturan |
|---|---|
| `nama_equipment` | Wajib, tidak boleh string kosong/whitespace |
| `tipe_equipment` | Wajib, tidak boleh string kosong/whitespace |
| `lokasi` | Wajib, tidak boleh string kosong/whitespace |
| `tanggal_inspeksi_terakhir` | Wajib, format `YYYY-MM-DD` valid |
| `status` | Wajib, harus salah satu dari: `Aktif`, `Dalam Perbaikan`, `Non-Aktif` |

### 9.2 Penanganan Error

| Skenario | HTTP Status | Kode Error |
|---|---|---|
| ID tidak ditemukan (GET/PUT/DELETE) | 404 | `NOT_FOUND` |
| Field wajib kosong | 400 | `VALIDATION_ERROR` |
| Format tanggal salah | 400 | `VALIDATION_ERROR` |
| Nilai `status` di luar enum | 400 | `VALIDATION_ERROR` |
| Kesalahan server/DB | 500 | `INTERNAL_ERROR` (pesan generik ke client, detail lengkap dicatat di log server) |

---

## 10. Non-Functional Requirements

| Aspek | Requirement |
|---|---|
| **Performa** | List endpoint dengan pagination tetap responsif meski data bertambah banyak (index di kolom `status`) |
| **Konsistensi response** | Semua response API mengikuti format konsisten (`success`, `data`/`error`) |
| **Portabilitas** | `docker-compose up` harus langsung jalan tanpa setup manual tambahan di mesin reviewer |
| **Testability** | Business logic (validasi, filtering) dipisah dari HTTP handler agar mudah di-unit-test tanpa perlu server aktif |

---

## 11. Deliverables (sesuai instruksi take-home test)

1. **Source code** — repository (link GitHub/GitLab, atau file zip jika tidak memungkinkan public repo)
2. **README.md** berisi:
   - Cara menjalankan project step-by-step (asumsikan reviewer belum tahu apa-apa soal environment)
   - Penjelasan singkat struktur project (folder `handler/service/repository`, dll)
   - Keputusan desain yang diambil & alasannya (contoh: kenapa `status` disimpan sebagai VARCHAR bukan ENUM, kenapa pisah layer service/repository)
   - Bagian yang belum sempat diselesaikan atau ingin diperbaiki kalau ada waktu lebih (jujur soal keterbatasan justru jadi nilai plus)
3. **Unit test** minimal untuk satu endpoint — rekomendasi: test untuk endpoint `POST /equipment` (mencakup kasus sukses & kasus validasi gagal), karena mencerminkan pemahaman validasi + error handling sekaligus.

---

## 12. Pemetaan ke Kriteria Penilaian Test

| Kriteria (dari soal) | Bobot | Bagaimana PRD ini membantu |
|---|---|---|
| Fungsionalitas | 30% | Spesifikasi endpoint di Bagian 9 jadi acuan implementasi langsung |
| Kualitas Kode | 25% | Struktur layer `handler/service/repository` (Bagian 6) memisahkan concern dengan jelas |
| Pemahaman Konsep | 25% | Setiap keputusan desain didokumentasikan beserta alasannya, siap disarikan ke README dan dijelaskan saat sesi review |
| Error & Validasi | 10% | Bagian 9.1–9.2 |
| Dokumentasi (README) | 10% | Bagian 11 jadi checklist README |

---

## 13. Risiko & Open Questions

| Item | Catatan |
|---|---|
| Waktu pengerjaan terbatas (4-6 jam) | Prioritaskan endpoint wajib dulu (Bagian 5.1); item bonus (frontend, Docker, unit test) dikerjakan kalau waktu masih cukup |
| Pagination "basic" | Soal menyebut boleh sederhana — cukup `page` & `limit` di query param, tidak perlu cursor-based pagination |
| Frontend scope | Karena hanya bonus, cukup dibuat minimal: form tambah/edit, tabel list dengan pagination & filter status — tidak perlu styling kompleks |

