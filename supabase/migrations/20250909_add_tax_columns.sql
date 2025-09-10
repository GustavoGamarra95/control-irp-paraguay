-- Asegurar que todas las columnas necesarias estén presentes
ALTER TABLE egresos
ADD COLUMN IF NOT EXISTS monto_sin_iva_10 NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_sin_iva_5 NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_exenta NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_iva_10 NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_iva_5 NUMERIC(15, 2) DEFAULT 0;

-- Actualizar la columna monto_total para almacenar datos informados
ALTER TABLE egresos
DROP COLUMN monto_total,
ADD COLUMN monto_total NUMERIC(15, 2) DEFAULT 0;

-- Agregar columna valor_total a la tabla egresos
ALTER TABLE egresos
ADD COLUMN IF NOT EXISTS valor_total NUMERIC(15, 2) DEFAULT 0;
