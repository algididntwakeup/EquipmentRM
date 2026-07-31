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
	ErrValidation = errors.New("validation failed")
	ErrNotFound   = repository.ErrNotFound
)

var allowedStatuses = map[string]struct{}{
	"Aktif":           {},
	"Dalam Perbaikan": {},
	"Non-Aktif":       {},
}

type EquipmentService interface {
	Create(ctx context.Context, input model.EquipmentInput) (*model.Equipment, map[string]string, error)
	GetByID(ctx context.Context, id string) (*model.Equipment, error)
	GetAll(ctx context.Context, statusFilter string, page, limit int) ([]model.Equipment, model.PaginationMeta, error)
	Update(ctx context.Context, id string, input model.EquipmentInput) (*model.Equipment, map[string]string, error)
	Delete(ctx context.Context, id string) error
}

type equipmentService struct {
	repo repository.EquipmentRepository
}

// NewEquipmentService constructs a new EquipmentService instance.
func NewEquipmentService(repo repository.EquipmentRepository) EquipmentService {
	return &equipmentService{repo: repo}
}

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

func (s *equipmentService) GetByID(ctx context.Context, id string) (*model.Equipment, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *equipmentService) GetAll(ctx context.Context, statusFilter string, page, limit int) ([]model.Equipment, model.PaginationMeta, error) {
	statusFilter = strings.TrimSpace(statusFilter)
	if statusFilter == "All" {
		statusFilter = ""
	}
	if statusFilter != "" && !isAllowedStatus(statusFilter) {
		return nil, model.PaginationMeta{}, ErrValidation
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	offset := (page - 1) * limit
	items, totalItems, err := s.repo.GetAll(ctx, statusFilter, limit, offset)
	if err != nil {
		return nil, model.PaginationMeta{}, err
	}

	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))
	if totalPages == 0 {
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

func (s *equipmentService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func isAllowedStatus(status string) bool {
	_, ok := allowedStatuses[status]
	return ok
}
