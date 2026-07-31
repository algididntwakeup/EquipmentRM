package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"reksolindo-api/internal/handler"
	"reksolindo-api/internal/repository"
	"reksolindo-api/internal/service"
	"reksolindo-api/pkg/db"
)

func main() {
	// Environment dari Docker/production selalu menang; file .env hanya menjadi
	// fallback agar backend tetap mudah dijalankan langsung dari folder project.
	if err := godotenv.Load(".env"); err != nil {
		if errLoad := godotenv.Load("../../.env"); errLoad != nil {
			log.Println("Note: .env file not found or error loading, using system environment variables")
		}
	}

	// Batasi proses koneksi awal supaya aplikasi tidak menggantung tanpa batas
	// ketika PostgreSQL salah konfigurasi atau belum siap.
	connectContext, cancelConnect := context.WithTimeout(context.Background(), 10*time.Second)
	database, err := db.InitDB(connectContext)
	cancelConnect()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()
	log.Println("Database connection established successfully")

	// Dependency dirangkai dari layer paling luar ke dalam:
	// HTTP handler -> business service -> PostgreSQL repository.
	eqRepo := repository.NewEquipmentRepository(database)
	eqService := service.NewEquipmentService(eqRepo)
	eqHandler := handler.NewEquipmentHandler(eqService)

	router := gin.Default()
	allowedOrigins := configuredOrigins(os.Getenv("CORS_ALLOWED_ORIGINS"))
	// Middleware CORS hanya memantulkan origin yang tercantum di konfigurasi.
	// Request dari origin lain tetap diproses, tetapi browser tidak diberi izin
	// untuk membaca responsnya.
	router.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if allowedOrigins[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
			c.Header("Access-Control-Allow-Credentials", "true")
		}
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		// Preflight OPTIONS tidak perlu diteruskan ke handler endpoint.
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"message": "pong",
			},
		})
	})
	router.GET("/health", func(c *gin.Context) {
		// Health check ikut melakukan ping database agar status healthy berarti
		// API dan dependency utamanya sama-sama dapat digunakan.
		pingContext, cancelPing := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancelPing()
		if err := database.PingContext(pingContext); err != nil {
			log.Printf("database health check failed: %v", err)
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "DATABASE_UNAVAILABLE",
					"message": "Database tidak tersedia",
				},
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"status": "healthy",
			},
		})
	})

	eqHandler.RegisterRoutes(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Timeout HTTP mencegah koneksi lambat menahan resource server terlalu lama.
	server := &http.Server{
		Addr:              ":" + port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	serverErrors := make(chan error, 1)
	go func() {
		log.Printf("Server starting on port %s", port)
		serverErrors <- server.ListenAndServe()
	}()

	// Tunggu SIGINT/SIGTERM lalu hentikan server secara graceful supaya request
	// yang sedang berjalan diberi kesempatan untuk selesai.
	shutdownSignals := make(chan os.Signal, 1)
	signal.Notify(shutdownSignals, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Failed to start server: %v", err)
		}
	case <-shutdownSignals:
		shutdownContext, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()
		if err := server.Shutdown(shutdownContext); err != nil {
			log.Printf("Graceful shutdown failed: %v", err)
		}
	}
}

// configuredOrigins mengubah daftar origin yang dipisahkan koma menjadi lookup
// map agar pengecekan CORS pada setiap request tetap sederhana dan cepat.
func configuredOrigins(rawOrigins string) map[string]bool {
	if strings.TrimSpace(rawOrigins) == "" {
		rawOrigins = "http://localhost:3000"
	}

	origins := make(map[string]bool)
	for _, origin := range strings.Split(rawOrigins, ",") {
		if trimmedOrigin := strings.TrimSpace(origin); trimmedOrigin != "" {
			origins[trimmedOrigin] = true
		}
	}
	return origins
}
