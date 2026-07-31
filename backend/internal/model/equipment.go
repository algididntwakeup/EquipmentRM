package model

import "time"

// Equipment represents the data model for an equipment item in PostgreSQL.
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

// EquipmentInput represents the payload for creating or updating an equipment item.
type EquipmentInput struct {
	NamaEquipment           string `json:"nama_equipment"`
	TipeEquipment           string `json:"tipe_equipment"`
	Lokasi                  string `json:"lokasi"`
	TanggalInspeksiTerakhir string `json:"tanggal_inspeksi_terakhir"` // Format: YYYY-MM-DD
	Status                  string `json:"status"`
}

// PaginationMeta represents pagination metadata for list responses.
type PaginationMeta struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalItems int `json:"total_items"`
	TotalPages int `json:"total_pages"`
}
