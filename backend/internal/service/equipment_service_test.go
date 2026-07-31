package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"reksolindo-api/internal/model"
)

func TestValidateInput_Success(t *testing.T) {
	svc := &equipmentService{}

	input := model.EquipmentInput{
		NamaEquipment:           "Pressure Vessel PV-101",
		TipeEquipment:           "Pressure Vessel",
		Lokasi:                  "Plant Area A",
		TanggalInspeksiTerakhir: "2026-05-10",
		Status:                  "Aktif",
	}

	parsedDate, valErrors := svc.ValidateInput(input)

	assert.Empty(t, valErrors, "expected 0 validation errors for valid input")
	assert.False(t, parsedDate.IsZero(), "expected parsed date to not be zero")
	assert.Equal(t, 2026, parsedDate.Year())
	assert.Equal(t, 5, int(parsedDate.Month()))
	assert.Equal(t, 10, parsedDate.Day())
}

func TestValidateInput_MissingRequiredFields(t *testing.T) {
	svc := &equipmentService{}

	input := model.EquipmentInput{
		NamaEquipment:           "",
		TipeEquipment:           "",
		Lokasi:                  "",
		TanggalInspeksiTerakhir: "",
		Status:                  "",
	}

	_, valErrors := svc.ValidateInput(input)

	assert.NotEmpty(t, valErrors)
	assert.Contains(t, valErrors, "nama_equipment")
	assert.Contains(t, valErrors, "tipe_equipment")
	assert.Contains(t, valErrors, "lokasi")
	assert.Contains(t, valErrors, "tanggal_inspeksi_terakhir")
	assert.Contains(t, valErrors, "status")
}

func TestValidateInput_InvalidStatusAndDateFormat(t *testing.T) {
	svc := &equipmentService{}

	input := model.EquipmentInput{
		NamaEquipment:           "Generator 500kW",
		TipeEquipment:           "Power Supply",
		Lokasi:                  "Warehouse 2",
		TanggalInspeksiTerakhir: "10-05-2026",    // Invalid format (should be YYYY-MM-DD)
		Status:                  "UnknownStatus", // Invalid status enum
	}

	_, valErrors := svc.ValidateInput(input)

	assert.Contains(t, valErrors, "tanggal_inspeksi_terakhir")
	assert.Contains(t, valErrors, "status")
}

func TestValidateInput_RejectsStatusOutsidePRD(t *testing.T) {
	svc := &equipmentService{}
	input := model.EquipmentInput{
		NamaEquipment:           "Generator 500kW",
		TipeEquipment:           "Power Supply",
		Lokasi:                  "Warehouse 2",
		TanggalInspeksiTerakhir: "2026-05-10",
		Status:                  "Rusak",
	}

	_, valErrors := svc.ValidateInput(input)

	assert.Equal(t, "Status harus salah satu dari: Aktif, Dalam Perbaikan, Non-Aktif", valErrors["status"])
}
