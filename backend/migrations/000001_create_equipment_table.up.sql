CREATE TABLE IF NOT EXISTS equipment (
    id VARCHAR(50) PRIMARY KEY,
    nama_equipment VARCHAR(150) NOT NULL,
    tipe_equipment VARCHAR(100) NOT NULL,
    lokasi VARCHAR(150) NOT NULL,
    tanggal_inspeksi_terakhir DATE NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for status filtering performance
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
