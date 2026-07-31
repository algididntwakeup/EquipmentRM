package service

import (
	"context"
	"errors"
	"math"
	"strings"

	"github.com/google/uuid"
	"reksolindo-api/internal/model"
	"reksolindo-api/internal/repository"
)

var (
	// Error sentinel memungkinkan handler membedakan kegagalan validasi/not found
	// dari error internal tanpa membandingkan teks pesan error.
	ErrValidation = errors.New("validation failed")
	ErrNotFound   = repository.ErrNotFound
)

// Map dipakai sebagai set agar pengecekan status valid berlangsung O(1).
var allowedStatuses = map[string]struct{}{
	"Aktif":           {},
	"Dalam Perbaikan": {},
	"Non-Aktif":       {},
}

// EquipmentService mendefinisikan seluruh use case equipment. Handler hanya
// bergantung pada kontrak ini, bukan pada implementasi database.
type EquipmentService interface {
	Create(ctx context.Context, input model.EquipmentInput) (*model.Equipment, map[string]string, error)
	GetByID(ctx context.Context, id string) (*model.Equipment, error)
	GetAll(ctx context.Context, statusFilter, search string, page, limit int) ([]model.Equipment, model.PaginationMeta, error)
	Update(ctx context.Context, id string, input model.EquipmentInput) (*model.Equipment, map[string]string, error)
	Delete(ctx context.Context, id string) error
}

type equipmentService struct {
	repo repository.EquipmentRepository
}

// NewEquipmentService membuat service dengan repository yang diberikan.
func NewEquipmentService(repo repository.EquipmentRepository) EquipmentService {
	return &equipmentService{repo: repo}
}

// ValidateInput memusatkan aturan bisnis create/update sehingga validasi yang
// sama tidak perlu diduplikasi di setiap handler.
func (s *equipmentService) ValidateInput(input model.EquipmentInput) (model.Date, map[string]string) {
	valErrors := make(map[string]string)

	if strings.TrimSpace(input.NamaEquipment) == "" {
		valErrors["nama_equipment"] = "Nama equipment tidak boleh kosong"
	}
	if strings.TrimSpace(input.TipeEquipment) == "" {
		valErrors["tipe_equipment"] = "Tipe equipment tidak boleh kosong"
	}
	if strings.TrimSpace(input.Lokasi) == "" {
		valErrors["lokasi"] = "Lokasi tidak boleh kosong"
	}

	var parsedDate model.Date
	if strings.TrimSpace(input.TanggalInspeksiTerakhir) == "" {
		valErrors["tanggal_inspeksi_terakhir"] = "Tanggal inspeksi terakhir tidak boleh kosong"
	} else {
		t, err := model.ParseDate(strings.TrimSpace(input.TanggalInspeksiTerakhir))
		if err != nil {
			valErrors["tanggal_inspeksi_terakhir"] = "Format tanggal harus YYYY-MM-DD"
		} else {
			parsedDate = t
		}
	}

	status := strings.TrimSpace(input.Status)
	if status == "" {
		valErrors["status"] = "Status tidak boleh kosong"
	} else if !isAllowedStatus(status) {
		valErrors["status"] = "Status harus salah satu dari: Aktif, Dalam Perbaikan, Non-Aktif"
	}

	return parsedDate, valErrors
}

// Create memvalidasi payload, membersihkan whitespace, membuat UUID, lalu
// menyerahkan proses penyimpanan ke repository.
func (s *equipmentService) Create(ctx context.Context, input model.EquipmentInput) (*model.Equipment, map[string]string, error) {
	parsedDate, valErrors := s.ValidateInput(input)
	if len(valErrors) > 0 {
		return nil, valErrors, ErrValidation
	}

	eq := &model.Equipment{
		ID:                      uuid.New().String(),
		NamaEquipment:           strings.TrimSpace(input.NamaEquipment),
		TipeEquipment:           strings.TrimSpace(input.TipeEquipment),
		Lokasi:                  strings.TrimSpace(input.Lokasi),
		TanggalInspeksiTerakhir: parsedDate,
		Status:                  strings.TrimSpace(input.Status),
	}

	if err := s.repo.Create(ctx, eq); err != nil {
		return nil, nil, err
	}

	return eq, nil, nil
}

// GetByID meneruskan pengambilan detail ke repository.
func (s *equipmentService) GetByID(ctx context.Context, id string) (*model.Equipment, error) {
	return s.repo.GetByID(ctx, id)
}

// GetAll menormalisasi filter/search dan menghitung metadata pagination dari
// total data yang dikembalikan repository.
func (s *equipmentService) GetAll(ctx context.Context, statusFilter, search string, page, limit int) ([]model.Equipment, model.PaginationMeta, error) {
	statusFilter = strings.TrimSpace(statusFilter)
	search = strings.TrimSpace(search)
	if statusFilter == "All" {
		// "All" dipertahankan untuk kompatibilitas client, lalu diubah menjadi
		// filter kosong sebelum mencapai query database.
		statusFilter = ""
	}
	if statusFilter != "" && !isAllowedStatus(statusFilter) {
		return nil, model.PaginationMeta{}, ErrValidation
	}

	if page < 1 {
		// Guard tambahan untuk caller non-HTTP; handler sendiri sudah menolak
		// pagination yang tidak valid.
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	offset := (page - 1) * limit
	items, totalItems, err := s.repo.GetAll(ctx, statusFilter, search, limit, offset)
	if err != nil {
		return nil, model.PaginationMeta{}, err
	}

	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))
	if totalPages == 0 {
		// Frontend tetap memakai halaman 1 ketika hasil pencarian kosong.
		totalPages = 1
	}

	meta := model.PaginationMeta{
		Page:       page,
		Limit:      limit,
		TotalItems: totalItems,
		TotalPages: totalPages,
	}

	return items, meta, nil
}

// Update memvalidasi payload lebih dahulu, memastikan record masih ada, lalu
// menerapkan perubahan melalui repository.
func (s *equipmentService) Update(ctx context.Context, id string, input model.EquipmentInput) (*model.Equipment, map[string]string, error) {
	parsedDate, valErrors := s.ValidateInput(input)
	if len(valErrors) > 0 {
		return nil, valErrors, ErrValidation
	}

	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}

	existing.NamaEquipment = strings.TrimSpace(input.NamaEquipment)
	existing.TipeEquipment = strings.TrimSpace(input.TipeEquipment)
	existing.Lokasi = strings.TrimSpace(input.Lokasi)
	existing.TanggalInspeksiTerakhir = parsedDate
	existing.Status = strings.TrimSpace(input.Status)

	if err := s.repo.Update(ctx, id, existing); err != nil {
		return nil, nil, err
	}

	return existing, nil, nil
}

// Delete menyerahkan penghapusan dan propagasi ErrNotFound ke repository.
func (s *equipmentService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

// isAllowedStatus mengecek membership pada set status yang diizinkan PRD.
func isAllowedStatus(status string) bool {
	_, ok := allowedStatuses[status]
	return ok
}
