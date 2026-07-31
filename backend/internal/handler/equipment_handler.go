package handler

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"reksolindo-api/internal/model"
	"reksolindo-api/internal/service"
)

type EquipmentHandler struct {
	svc service.EquipmentService
}

func NewEquipmentHandler(svc service.EquipmentService) *EquipmentHandler {
	return &EquipmentHandler{svc: svc}
}

func (h *EquipmentHandler) RegisterRoutes(r *gin.Engine) {
	api := r.Group("/equipment")
	{
		api.POST("", h.Create)
		api.GET("", h.GetAll)
		api.GET("/:id", h.GetByID)
		api.PUT("/:id", h.Update)
		api.DELETE("/:id", h.Delete)
	}
}

// POST /equipment
func (h *EquipmentHandler) Create(c *gin.Context) {
	var input model.EquipmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Input JSON tidak valid", nil)
		return
	}

	eq, valErrors, err := h.svc.Create(c.Request.Context(), input)
	if err != nil {
		if errors.Is(err, service.ErrValidation) {
			writeError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Input tidak valid", valErrors)
			return
		}
		writeInternalError(c, "create equipment", "Gagal menyimpan data equipment", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    eq,
	})
}

// GET /equipment?page=1&limit=10&status=Aktif
func (h *EquipmentHandler) GetAll(c *gin.Context) {
	page, err := parsePositiveIntQuery(c, "page", 1, 0)
	if err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Query pagination tidak valid", map[string]string{
			"page": "Page harus berupa bilangan bulat lebih dari 0",
		})
		return
	}

	limit, err := parsePositiveIntQuery(c, "limit", 10, 100)
	if err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Query pagination tidak valid", map[string]string{
			"limit": "Limit harus berupa bilangan bulat antara 1 dan 100",
		})
		return
	}
	statusFilter := c.Query("status")

	items, meta, err := h.svc.GetAll(c.Request.Context(), statusFilter, page, limit)
	if err != nil {
		if errors.Is(err, service.ErrValidation) {
			writeError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Filter status tidak valid", map[string]string{
				"status": "Status harus salah satu dari: Aktif, Dalam Perbaikan, Non-Aktif",
			})
			return
		}
		writeInternalError(c, "list equipment", "Gagal mengambil daftar equipment", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"data":       items,
		"pagination": meta,
	})
}

// GET /equipment/:id
func (h *EquipmentHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	eq, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(c, http.StatusNotFound, "NOT_FOUND", "Equipment dengan id tersebut tidak ditemukan", nil)
			return
		}
		writeInternalError(c, "get equipment", "Gagal mengambil detail equipment", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    eq,
	})
}

// PUT /equipment/:id
func (h *EquipmentHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input model.EquipmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Input JSON tidak valid", nil)
		return
	}

	eq, valErrors, err := h.svc.Update(c.Request.Context(), id, input)
	if err != nil {
		if errors.Is(err, service.ErrValidation) {
			writeError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Input tidak valid", valErrors)
			return
		}
		if errors.Is(err, service.ErrNotFound) {
			writeError(c, http.StatusNotFound, "NOT_FOUND", "Equipment dengan id tersebut tidak ditemukan", nil)
			return
		}
		writeInternalError(c, "update equipment", "Gagal mengupdate equipment", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    eq,
	})
}

// DELETE /equipment/:id
func (h *EquipmentHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	err := h.svc.Delete(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(c, http.StatusNotFound, "NOT_FOUND", "Equipment dengan id tersebut tidak ditemukan", nil)
			return
		}
		writeInternalError(c, "delete equipment", "Gagal menghapus equipment", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Equipment berhasil dihapus",
	})
}

func parsePositiveIntQuery(c *gin.Context, key string, defaultValue, maxValue int) (int, error) {
	rawValue := c.Query(key)
	if rawValue == "" {
		return defaultValue, nil
	}

	value, err := strconv.Atoi(rawValue)
	if err != nil || value < 1 || (maxValue > 0 && value > maxValue) {
		return 0, errors.New("invalid positive integer query parameter")
	}

	return value, nil
}

func writeError(c *gin.Context, status int, code, message string, details map[string]string) {
	errorBody := gin.H{
		"code":    code,
		"message": message,
	}
	if len(details) > 0 {
		errorBody["details"] = details
	}

	c.JSON(status, gin.H{
		"success": false,
		"error":   errorBody,
	})
}

func writeInternalError(c *gin.Context, operation, clientMessage string, err error) {
	log.Printf("%s failed: %v", operation, err)
	writeError(c, http.StatusInternalServerError, "INTERNAL_ERROR", clientMessage, nil)
}
