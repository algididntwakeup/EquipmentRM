package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
	"reksolindo-api/internal/model"
)

// ErrNotFound menjadi error bersama yang dapat diterjemahkan service/handler
// menjadi HTTP 404 tanpa membocorkan detail database.
var ErrNotFound = errors.New("equipment not found")

// EquipmentRepository mendefinisikan operasi persistence yang dibutuhkan
// service. Interface ini membuat business logic mudah diuji memakai stub/mock.
type EquipmentRepository interface {
	Create(ctx context.Context, eq *model.Equipment) error
	GetByID(ctx context.Context, id string) (*model.Equipment, error)
	GetAll(ctx context.Context, statusFilter, search string, limit, offset int) ([]model.Equipment, int, error)
	Update(ctx context.Context, id string, eq *model.Equipment) error
	Delete(ctx context.Context, id string) error
}

type equipmentRepository struct {
	db *sqlx.DB
}

// NewEquipmentRepository membuat implementasi repository berbasis sqlx.
func NewEquipmentRepository(db *sqlx.DB) EquipmentRepository {
	return &equipmentRepository{db: db}
}

// Create menyimpan equipment baru dan menetapkan timestamp dari server.
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

// GetByID mengambil satu equipment dan menormalkan sql.ErrNoRows menjadi
// repository.ErrNotFound yang dipahami layer di atasnya.
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

// GetAll menjalankan filter, live search, dan pagination di database agar hasil
// pencarian tidak terbatas pada data yang kebetulan tampil di halaman frontend.
func (r *equipmentRepository) GetAll(ctx context.Context, statusFilter, search string, limit, offset int) ([]model.Equipment, int, error) {
	var items []model.Equipment
	var total int

	countQuery := "SELECT COUNT(*) FROM equipment"
	selectQuery := `
		SELECT id, nama_equipment, tipe_equipment, lokasi, tanggal_inspeksi_terakhir, status, created_at, updated_at
		FROM equipment
	`

	var conditions []string
	var args []interface{}
	// Placeholder PostgreSQL ($1, $2, ...) dibuat dinamis, tetapi semua nilai
	// tetap dikirim sebagai parameter sehingga tidak membuka SQL injection.
	if statusFilter != "" && statusFilter != "All" {
		args = append(args, statusFilter)
		conditions = append(conditions, fmt.Sprintf("status = $%d", len(args)))
	}

	if search != "" {
		// ILIKE membuat pencarian case-insensitive pada tiga kolom bisnis utama.
		args = append(args, "%"+escapeLikePattern(search)+"%")
		placeholder := fmt.Sprintf("$%d", len(args))
		conditions = append(conditions, fmt.Sprintf(
			"(nama_equipment ILIKE %s ESCAPE E'\\\\' OR tipe_equipment ILIKE %s ESCAPE E'\\\\' OR lokasi ILIKE %s ESCAPE E'\\\\')",
			placeholder,
			placeholder,
			placeholder,
		))
	}

	if len(conditions) > 0 {
		// WHERE yang sama dipakai oleh query COUNT dan SELECT agar metadata
		// pagination selalu sesuai dengan data yang ditampilkan.
		whereClause := " WHERE " + strings.Join(conditions, " AND ")
		countQuery += whereClause
		selectQuery += whereClause
	}

	// Hitung total sebelum LIMIT/OFFSET untuk menentukan jumlah halaman.
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, err
	}

	selectQuery += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", len(args)+1, len(args)+2)
	argsWithPaging := append(append([]interface{}{}, args...), limit, offset)
	if err := r.db.SelectContext(ctx, &items, selectQuery, argsWithPaging...); err != nil {
		return nil, 0, err
	}

	if items == nil {
		// API mengembalikan [] alih-alih null agar lebih mudah dikonsumsi frontend.
		items = []model.Equipment{}
	}

	return items, total, nil
}

// escapeLikePattern memperlakukan %, _, dan backslash sebagai karakter literal,
// bukan wildcard buatan pengguna pada ekspresi SQL LIKE/ILIKE.
func escapeLikePattern(value string) string {
	replacer := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)
	return replacer.Replace(value)
}

// Update memperbarui field yang dikelola pengguna dan timestamp updated_at.
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
		// UPDATE yang tidak mengenai baris apa pun berarti ID tidak ditemukan.
		return ErrNotFound
	}

	return nil
}

// Delete menghapus equipment berdasarkan ID dan melaporkan not found secara
// eksplisit ketika tidak ada baris yang terhapus.
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
