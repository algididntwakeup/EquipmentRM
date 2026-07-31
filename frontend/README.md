# Frontend Equipment Inventory

Frontend Next.js untuk modul Equipment Inventory Reksolindo. Seluruh data berasal dari REST API Golang.

## Menjalankan lokal

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Default API URL adalah `http://localhost:8080` dan dapat diubah melalui `NEXT_PUBLIC_API_URL`.

## Fitur

- Dashboard ringkasan `Aktif`, `Dalam Perbaikan`, dan `Non-Aktif`.
- List equipment dengan server-side pagination dan filter status.
- Sorting data pada halaman aktif.
- Create, read detail, update, dan delete equipment.
- Loading, empty, validation, not-found, dan network error state.
- Layout responsif untuk desktop dan mobile.

## Verifikasi

```powershell
npm run lint
npm run build
```

`npm audit --omit=dev` lulus dengan 0 advisory. Advisory yang masih muncul pada audit lengkap berasal dari toolchain ESLint development dan tidak ikut ke image production.
