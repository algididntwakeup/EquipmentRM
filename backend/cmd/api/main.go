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
	// Docker/production environment variables take precedence over local .env files.
	if err := godotenv.Load(".env"); err != nil {
		if errLoad := godotenv.Load("../../.env"); errLoad != nil {
			log.Println("Note: .env file not found or error loading, using system environment variables")
		}
	}

	connectContext, cancelConnect := context.WithTimeout(context.Background(), 10*time.Second)
	database, err := db.InitDB(connectContext)
	cancelConnect()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()
	log.Println("Database connection established successfully")

	eqRepo := repository.NewEquipmentRepository(database)
	eqService := service.NewEquipmentService(eqRepo)
	eqHandler := handler.NewEquipmentHandler(eqService)

	router := gin.Default()
	allowedOrigins := configuredOrigins(os.Getenv("CORS_ALLOWED_ORIGINS"))
	router.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if allowedOrigins[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
			c.Header("Access-Control-Allow-Credentials", "true")
		}
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

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
