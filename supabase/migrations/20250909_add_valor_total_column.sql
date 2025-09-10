-- Agregar la columna valor_total a la tabla egresos
ALTER TABLE egresos
ADD COLUMN valor_total numeric(15,2);

-- Actualizar los valores existentes en la columna valor_total
UPDATE egresos
SET valor_total = COALESCE(monto_sin_iva_10, 0) + COALESCE(monto_iva_10, 0) + COALESCE(monto_sin_iva_5, 0) + COALESCE(monto_iva_5, 0) + COALESCE(monto_exenta, 0);

-- Asegurar que la columna no permita valores nulos
ALTER TABLE egresos
ALTER COLUMN valor_total SET NOT NULL;
