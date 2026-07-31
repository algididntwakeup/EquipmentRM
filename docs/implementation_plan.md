# Implementation Plan — Equipment Inventory Reksolindo

Dokumen rencana implementasi hulu ke hilir untuk pengembangan platform **Asset Reliability Management — Modul Equipment Inventory** Reksolindo sesuai panduan dokumen [PRD_Equipment_Inventory_Reksolindo (1).md](file:///c:/Algi%20Punya/takehomet-arm/docs/PRD_Equipment_Inventory_Reksolindo%20%281%29.md).

---

## User Review Required

> [!NOTE]
> Seluruh pengerjaan arsitektur backend dan frontend mengikuti aturan absolut pada PRD:
> - **Backend**: Golang (`Gin` + `sqlx` + PostgreSQL driver `pq`).
> - **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS.
> - **Database**: PostgreSQL 15+.
> - **Architecture**: Pattern 3-Tier Layered (`handler → service → repository`).

---

## Proposed Changes & Milestones

---

### Phase 1: Frontend Next.js & UI Components (SELESAI)

#### [NEW] [frontend/app/page.tsx](file:///c:/Algi%20Punya/takehomet-arm/frontend/app/page.tsx)
- Halaman utama **Dashboard** yang mengintegrasikan Sidebar, Top Header, Mobile Navigation, Metrics Overview, Action Header, dan Equipment Table.

#### [NEW] [frontend/app/equipment/page.tsx](file:///c:/Algi%20Punya/takehomet-arm/frontend/app/equipment/page.tsx)
- Halaman **Daftar Equipment** dengan fitur pengurutan (*sorting*) interaktif pada seluruh kolom (`id`, `nama_equipment`, `tipe_equipment`, `lokasi`, `tanggal_inspeksi_terakhir`, `status`), pencarian real-time, dan filter status.

#### [NEW] [frontend/app/equipment/add/page.tsx](file:///c:/Algi%20Punya/takehomet-arm/frontend/app/equipment/add/page.tsx)
- Halaman **Formulir Tambah Equipment** dengan validasi input interaktif, penanganan error state visual, dan alur submit.

#### [NEW] `frontend/app/equipment/[id]/page.tsx` & `frontend/app/equipment/[id]/edit/page.tsx`
- Halaman detail dan edit equipment yang terhubung ke endpoint GET, PUT, dan DELETE.

#### [NEW] [frontend/components/ui/](file:///c:/Algi%20Punya/takehomet-arm/frontend/components/ui) & [layout/](file:///c:/Algi%20Punya/takehomet-arm/frontend/components/layout)
- Komponen UI terpisah: `StatusBadge`, `MetricsOverview`, `ActionHeader`, `EquipmentTable`, `EquipmentCard`, `Pagination`, `Sidebar`, `Header`, `MobileNav`.

---

### Phase 2: Fondasi Backend Golang (SELESAI)

#### [NEW] [backend/go.mod](file:///c:/Algi%20Punya/takehomet-arm/backend/go.mod)
- Inisialisasi modul Golang `reksolindo-api` dengan dependencies `gin-gonic/gin`, `jmoiron/sqlx`, `lib/pq`, `joho/godotenv`, dan `stretchr/testify`.

#### [NEW] [backend/.env](file:///c:/Algi%20Punya/takehomet-arm/backend/.env)
- Konfigurasi variabel environment database PostgreSQL dan server port.

#### [NEW] [backend/internal/model/equipment.go](file:///c:/Algi%20Punya/takehomet-arm/backend/internal/model/equipment.go)
- Definisi struct `Equipment` dan `EquipmentInput` lengkap dengan tag `json`, `db`, dan `binding:"required"`.

#### [NEW] [backend/pkg/db/postgres.go](file:///c:/Algi%20Punya/takehomet-arm/backend/pkg/db/postgres.go)
- Pengaturan koneksi PostgreSQL menggunakan `sqlx.Connect`.

#### [NEW] [backend/cmd/api/main.go](file:///c:/Algi%20Punya/takehomet-arm/backend/cmd/api/main.go)
- Entry point server Gin HTTP dengan rute `/ping`.

---

### Phase 3: Implementasi Layered CRUD API Backend (SELESAI)

#### [NEW] `internal/repository/equipment_repository.go`
- Implementasi query SQL eksplisit menggunakan `sqlx`:
  - `Create(ctx, equipment)`
  - `GetByID(ctx, id)`
  - `GetAll(ctx, limit, offset, statusFilter)`
  - `Update(ctx, id, equipment)`
  - `Delete(ctx, id)`

#### [NEW] `internal/service/equipment_service.go`
- Implementasi business logic & aturan validasi (misal: cek enum status, format tanggal, sanitasi string).

#### [NEW] `internal/handler/equipment_handler.go`
- Implementasi HTTP Handlers Gin dengan format response konsisten standar PRD:
  - `POST /equipment`
  - `GET /equipment`
  - `GET /equipment/:id`
  - `PUT /equipment/:id`
  - `DELETE /equipment/:id`

---

### Phase 4: Testing & Containerization Backend (SELESAI)

- Unit test untuk business logic dan endpoint handler backend (`stretchr/testify`).
- Docker Compose untuk `db`, migration, `api`, dan `web`, lengkap dengan health check dan dependency ordering.
- Migration up/down dijalankan otomatis oleh service `migrate` sebelum API dimulai.
- Frontend telah terhubung ke REST API untuk dashboard metrics, list, pagination, filter status, create, detail, update, dan delete.

---

## Verification Plan

### Automated Verification
- **Frontend**: Running `npm run build` inside `frontend/` to ensure 0 TypeScript/Turbopack errors.
- **Backend**: Running `go build ./...` and `go test ./...` inside `backend/` to verify clean compilation and passing tests.

### Manual Verification
- Testing CRUD endpoints via HTTP requests (`curl` / Postman).
- Verifying UI interactions (sorting, filtering, add equipment submit flow) in browser.
