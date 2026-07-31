package db

import (
	"context"
	"fmt"
	"net"
	"net/url"
	"os"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

// InitDB membuat connection pool PostgreSQL dari environment dan langsung
// memverifikasi koneksi melalui sqlx.ConnectContext.
func InitDB(ctx context.Context) (*sqlx.DB, error) {
	host := envOrDefault("DB_HOST", "localhost")
	port := envOrDefault("DB_PORT", "5432")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	databaseName := os.Getenv("DB_NAME")
	sslMode := envOrDefault("DB_SSLMODE", "disable")

	if user == "" || databaseName == "" {
		return nil, fmt.Errorf("DB_USER dan DB_NAME wajib dikonfigurasi")
	}

	// url.URL memastikan karakter khusus pada username/password di-encode dengan
	// benar, tidak dirangkai manual menjadi connection string yang rapuh.
	dsn := url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(user, password),
		Host:   net.JoinHostPort(host, port),
		Path:   databaseName,
	}
	query := dsn.Query()
	query.Set("sslmode", sslMode)
	dsn.RawQuery = query.Encode()

	database, err := sqlx.ConnectContext(ctx, "postgres", dsn.String())
	if err != nil {
		return nil, fmt.Errorf("connect PostgreSQL %s@%s/%s: %w", user, dsn.Host, databaseName, err)
	}

	// Batas pool menjaga API tetap responsif tanpa membuka koneksi database secara
	// tidak terkendali ketika banyak request datang bersamaan.
	database.SetMaxOpenConns(25)
	database.SetMaxIdleConns(10)
	database.SetConnMaxLifetime(30 * time.Minute)
	database.SetConnMaxIdleTime(5 * time.Minute)

	return database, nil
}

// envOrDefault membaca environment variable dan memakai nilai default hanya
// ketika variable tersebut benar-benar kosong.
func envOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
