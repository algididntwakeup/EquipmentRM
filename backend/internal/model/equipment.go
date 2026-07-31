package model

import "time"

// Equipment adalah bentuk data lengkap yang dipetakan ke kolom PostgreSQL dan
// dikirim kembali sebagai JSON. Tag json dan db sengaja dipisahkan agar satu
// struct dapat digunakan oleh handler maupun sqlx.
type Equipment struct {
	ID                      string    `json:"id" db:"id"`
	NamaEquipment           string    `json:"nama_equipment" db:"nama_equipment"`
	TipeEquipment           string    `json:"tipe_equipment" db:"tipe_equipment"`
	Lokasi                  string    `json:"lokasi" db:"lokasi"`
	TanggalInspeksiTerakhir Date      `json:"tanggal_inspeksi_terakhir" db:"tanggal_inspeksi_terakhir"`
	Status                  string    `json:"status" db:"status"`
	CreatedAt               time.Time `json:"created_at" db:"created_at"`
	UpdatedAt               time.Time `json:"updated_at" db:"updated_at"`
}

// EquipmentInput adalah payload yang boleh dikirim client saat create/update.
// ID dan timestamp tidak disertakan karena nilainya dikelola oleh server.
type EquipmentInput struct {
	NamaEquipment           string `json:"nama_equipment"`
	TipeEquipment           string `json:"tipe_equipment"`
	Lokasi                  string `json:"lokasi"`
	TanggalInspeksiTerakhir string `json:"tanggal_inspeksi_terakhir"` // Format: YYYY-MM-DD
	Status                  string `json:"status"`
}

// PaginationMeta memberi frontend informasi untuk membangun kontrol pagination.
type PaginationMeta struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalItems int `json:"total_items"`
	TotalPages int `json:"total_pages"`
}
