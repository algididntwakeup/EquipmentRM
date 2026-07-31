package model

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

const DateLayout = "2006-01-02"

// Date represents a calendar date without a time-of-day component.
// It keeps PostgreSQL DATE values and API responses in YYYY-MM-DD format.
type Date struct {
	time.Time
}

func ParseDate(value string) (Date, error) {
	parsed, err := time.Parse(DateLayout, value)
	if err != nil {
		return Date{}, err
	}

	return Date{Time: parsed}, nil
}

func (d Date) MarshalJSON() ([]byte, error) {
	return json.Marshal(d.Format(DateLayout))
}

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

func (d Date) Value() (driver.Value, error) {
	return d.Time, nil
}
