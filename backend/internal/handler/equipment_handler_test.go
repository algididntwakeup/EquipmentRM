package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"reksolindo-api/internal/model"
	"reksolindo-api/internal/repository"
	"reksolindo-api/internal/service"
)

type equipmentRepositoryStub struct {
	created      *model.Equipment
	statusFilter string
	search       string
}

func (r *equipmentRepositoryStub) Create(_ context.Context, equipment *model.Equipment) error {
	now := time.Date(2026, time.July, 31, 10, 0, 0, 0, time.UTC)
	equipment.CreatedAt = now
	equipment.UpdatedAt = now
	r.created = equipment
	return nil
}

func (r *equipmentRepositoryStub) GetByID(context.Context, string) (*model.Equipment, error) {
	return nil, repository.ErrNotFound
}

func (r *equipmentRepositoryStub) GetAll(_ context.Context, statusFilter, search string, _, _ int) ([]model.Equipment, int, error) {
	r.statusFilter = statusFilter
	r.search = search
	return []model.Equipment{}, 0, nil
}

func (r *equipmentRepositoryStub) Update(context.Context, string, *model.Equipment) error {
	return repository.ErrNotFound
}

func (r *equipmentRepositoryStub) Delete(context.Context, string) error {
	return repository.ErrNotFound
}

func setupEquipmentRouter(repo repository.EquipmentRepository) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	NewEquipmentHandler(service.NewEquipmentService(repo)).RegisterRoutes(router)
	return router
}

func TestCreateEquipmentSuccess(t *testing.T) {
	repo := &equipmentRepositoryStub{}
	router := setupEquipmentRouter(repo)
	body := []byte(`{
		"nama_equipment":"  Pressure Vessel PV-101  ",
		"tipe_equipment":"Pressure Vessel",
		"lokasi":"Plant Area A",
		"tanggal_inspeksi_terakhir":"2026-05-10",
		"status":"Aktif"
	}`)

	request := httptest.NewRequest(http.MethodPost, "/equipment", bytes.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)

	require.Equal(t, http.StatusCreated, response.Code)
	assert.NotNil(t, repo.created)
	assert.Equal(t, "Pressure Vessel PV-101", repo.created.NamaEquipment)

	var payload struct {
		Success bool `json:"success"`
		Data    struct {
			ID                      string `json:"id"`
			TanggalInspeksiTerakhir string `json:"tanggal_inspeksi_terakhir"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &payload))
	assert.True(t, payload.Success)
	assert.NotEmpty(t, payload.Data.ID)
	assert.Equal(t, "2026-05-10", payload.Data.TanggalInspeksiTerakhir)
}

func TestCreateEquipmentReturnsFieldValidationDetails(t *testing.T) {
	repo := &equipmentRepositoryStub{}
	router := setupEquipmentRouter(repo)
	request := httptest.NewRequest(http.MethodPost, "/equipment", bytes.NewBufferString(`{}`))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	require.Equal(t, http.StatusBadRequest, response.Code)
	assert.Nil(t, repo.created)

	var payload struct {
		Success bool `json:"success"`
		Error   struct {
			Code    string            `json:"code"`
			Details map[string]string `json:"details"`
		} `json:"error"`
	}
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &payload))
	assert.False(t, payload.Success)
	assert.Equal(t, "VALIDATION_ERROR", payload.Error.Code)
	assert.Contains(t, payload.Error.Details, "nama_equipment")
	assert.Contains(t, payload.Error.Details, "tanggal_inspeksi_terakhir")
	assert.Contains(t, payload.Error.Details, "status")
}

func TestCreateEquipmentRejectsFutureInspectionDate(t *testing.T) {
	repo := &equipmentRepositoryStub{}
	router := setupEquipmentRouter(repo)
	body := []byte(`{
		"nama_equipment":"Future Equipment",
		"tipe_equipment":"Pressure Vessel",
		"lokasi":"Plant Area A",
		"tanggal_inspeksi_terakhir":"2999-01-01",
		"status":"Aktif"
	}`)
	request := httptest.NewRequest(http.MethodPost, "/equipment", bytes.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	require.Equal(t, http.StatusBadRequest, response.Code)
	assert.Nil(t, repo.created)
	assert.Contains(t, response.Body.String(), `"tanggal_inspeksi_terakhir":"Tanggal inspeksi terakhir tidak boleh melewati hari ini"`)
}

func TestGetAllRejectsInvalidPagination(t *testing.T) {
	router := setupEquipmentRouter(&equipmentRepositoryStub{})
	request := httptest.NewRequest(http.MethodGet, "/equipment?page=abc&limit=101", nil)
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	assert.Equal(t, http.StatusBadRequest, response.Code)
	assert.Contains(t, response.Body.String(), `"code":"VALIDATION_ERROR"`)
}

func TestGetAllForwardsTrimmedSearchAndStatus(t *testing.T) {
	repo := &equipmentRepositoryStub{}
	router := setupEquipmentRouter(repo)
	request := httptest.NewRequest(http.MethodGet, "/equipment?status=Aktif&search=%20pressure%20", nil)
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	require.Equal(t, http.StatusOK, response.Code)
	assert.Equal(t, "Aktif", repo.statusFilter)
	assert.Equal(t, "pressure", repo.search)
}
