package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"reksolindo-api/internal/model"
)

var ErrNotFound = errors.New("equipment not found")

type EquipmentRepository interface {
	Create(ctx context.Context, eq *model.Equipment) error
	GetByID(ctx context.Context, id string) (*model.Equipment, error)
	GetAll(ctx context.Context, statusFilter string, limit, offset int) ([]model.Equipment, int, error)
	Update(ctx context.Context, id string, eq *model.Equipment) error
	Delete(ctx context.Context, id string) error
}

type equipmentRepository struct {
	db *sqlx.DB
}

// NewEquipmentRepository constructs a new sqlx-backed EquipmentRepository.
func NewEquipmentRepository(db *sqlx.DB) EquipmentRepository {
	return &equipmentRepository{db: db}
}

func (r *equipmentRepository) Create(ctx context.Context, eq *model.Equipment) error {
	query := `
		INSERT INTO equipment (id, nama_equipment, tipe_equipment, lokasi, tanggal_inspeksi_terakhir, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	now := time.Now()
	eq.CreatedAt = now
	eq.UpdatedAt = now

	_, err := r.db.ExecContext(ctx, query,
		eq.ID,
		eq.NamaEquipment,
		eq.TipeEquipment,
		eq.Lokasi,
		eq.TanggalInspeksiTerakhir,
		eq.Status,
		eq.CreatedAt,
		eq.UpdatedAt,
	)
	return err
}

func (r *equipmentRepository) GetByID(ctx context.Context, id string) (*model.Equipment, error) {
	query := `
		SELECT id, nama_equipment, tipe_equipment, lokasi, tanggal_inspeksi_terakhir, status, created_at, updated_at
		FROM equipment
		WHERE id = $1
	`
	var eq model.Equipment
	err := r.db.GetContext(ctx, &eq, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &eq, nil
}

func (r *equipmentRepository) GetAll(ctx context.Context, statusFilter string, limit, offset int) ([]model.Equipment, int, error) {
	var items []model.Equipment
	var total int

	countQuery := "SELECT COUNT(*) FROM equipment"
	selectQuery := `
		SELECT id, nama_equipment, tipe_equipment, lokasi, tanggal_inspeksi_terakhir, status, created_at, updated_at
		FROM equipment
	`

	var args []interface{}
	if statusFilter != "" && statusFilter != "All" {
		countQuery += " WHERE status = $1"
		selectQuery += " WHERE status = $1"
		args = append(args, statusFilter)

		selectQuery += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", len(args)+1, len(args)+2)
		argsWithPaging := append(args, limit, offset)

		if err := r.db.GetContext(ctx, &total, countQuery, statusFilter); err != nil {
			return nil, 0, err
		}
		if err := r.db.SelectContext(ctx, &items, selectQuery, argsWithPaging...); err != nil {
			return nil, 0, err
		}
	} else {
		selectQuery += " ORDER BY created_at DESC LIMIT $1 OFFSET $2"
		if err := r.db.GetContext(ctx, &total, countQuery); err != nil {
			return nil, 0, err
		}
		if err := r.db.SelectContext(ctx, &items, selectQuery, limit, offset); err != nil {
			return nil, 0, err
		}
	}

	if items == nil {
		items = []model.Equipment{}
	}

	return items, total, nil
}

func (r *equipmentRepository) Update(ctx context.Context, id string, eq *model.Equipment) error {
	query := `
		UPDATE equipment
		SET nama_equipment = $1, tipe_equipment = $2, lokasi = $3, tanggal_inspeksi_terakhir = $4, status = $5, updated_at = $6
		WHERE id = $7
	`
	now := time.Now()
	eq.UpdatedAt = now

	res, err := r.db.ExecContext(ctx, query,
		eq.NamaEquipment,
		eq.TipeEquipment,
		eq.Lokasi,
		eq.TanggalInspeksiTerakhir,
		eq.Status,
		eq.UpdatedAt,
		id,
	)
	if err != nil {
		return err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}

	return nil
}

func (r *equipmentRepository) Delete(ctx context.Context, id string) error {
	query := "DELETE FROM equipment WHERE id = $1"
	res, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}

	return nil
}
