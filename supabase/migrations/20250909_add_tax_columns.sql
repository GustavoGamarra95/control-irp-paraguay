-- Add new tax-related columns
ALTER TABLE egresos
ADD COLUMN IF NOT EXISTS monto_sin_iva_10 numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_sin_iva_5 numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_exenta numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_iva_10 numeric(10,2) GENERATED ALWAYS AS (
    COALESCE(monto_sin_iva_10, 0) * 0.1
) STORED,
ADD COLUMN IF NOT EXISTS monto_iva_5 numeric(10,2) GENERATED ALWAYS AS (
    COALESCE(monto_sin_iva_5, 0) * 0.05
) STORED;

-- Update monto_total computation to use new columns
ALTER TABLE egresos
DROP COLUMN monto_total,
ADD COLUMN monto_total numeric(10,2) GENERATED ALWAYS AS (
    COALESCE(monto_sin_iva_10, 0) + 
    (COALESCE(monto_sin_iva_10, 0) * 0.1) + 
    COALESCE(monto_sin_iva_5, 0) + 
    (COALESCE(monto_sin_iva_5, 0) * 0.05) + 
    COALESCE(monto_exenta, 0)
) STORED;
