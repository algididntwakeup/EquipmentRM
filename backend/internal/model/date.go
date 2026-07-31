package model

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// DateLayout memakai reference time Go untuk merepresentasikan format YYYY-MM-DD.
const DateLayout = "2006-01-02"

// Date merepresentasikan tanggal kalender tanpa komponen jam. Tipe khusus ini
// menjaga PostgreSQL DATE dan JSON API tetap konsisten dalam format YYYY-MM-DD.
type Date struct {
	time.Time
}

// ParseDate memvalidasi string tanggal sekaligus mengubahnya ke tipe Date.
func ParseDate(value string) (Date, error) {
	parsed, err := time.Parse(DateLayout, value)
	if err != nil {
		return Date{}, err
	}

	return Date{Time: parsed}, nil
}

// MarshalJSON mencegah time.Time berubah menjadi timestamp lengkap pada respons.
func (d Date) MarshalJSON() ([]byte, error) {
	return json.Marshal(d.Format(DateLayout))
}

// Scan mengimplementasikan sql.Scanner agar sqlx dapat membaca nilai DATE dari
// driver PostgreSQL, baik dalam bentuk time.Time, string, maupun byte slice.
func (d *Date) Scan(value any) error {
	switch typedValue := value.(type) {
	case time.Time:
		d.Time = typedValue
		return nil
	case string:
		parsed, err := ParseDate(typedValue)
		if err != nil {
			return err
		}
		*d = parsed
		return nil
	case []byte:
		return d.Scan(string(typedValue))
	default:
		return fmt.Errorf("cannot scan %T into Date", value)
	}
}

// Value mengimplementasikan driver.Valuer agar Date dapat dipakai sebagai
// parameter query INSERT dan UPDATE.
func (d Date) Value() (driver.Value, error) {
	return d.Time, nil
}
