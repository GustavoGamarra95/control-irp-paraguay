-- 1. Primero agregar las columnas sin restricciones
alter table egresos
  add column if not exists monto_sin_iva numeric(15,2),
  add column if not exists monto_iva numeric(15,2);

-- 2. Migrar los datos existentes
update egresos
set 
  monto_sin_iva = case 
    when tipo_iva = 'exenta' then monto
    when tipo_iva = '5' then round(monto / 1.05, 2)
    else round(monto / 1.10, 2)
  end,
  monto_iva = case 
    when tipo_iva = 'exenta' then 0
    when tipo_iva = '5' then round((monto / 1.05) * 0.05, 2)
    else round((monto / 1.10) * 0.10, 2)
  end;

-- 3. Agregar las restricciones después de la migración
alter table egresos
  alter column monto_sin_iva set not null,
  alter column monto_iva set not null;

-- 4. Agregar las restricciones CHECK
alter table egresos
  add constraint egresos_monto_sin_iva_check check (monto_sin_iva > 0),
  add constraint egresos_monto_iva_check check (monto_iva >= 0);

-- 5. Agregar la columna calculada
alter table egresos
  add column if not exists monto_total numeric(15,2) generated always as (monto_sin_iva + monto_iva) stored;

-- 6. Quitar la columna monto antigua
alter table egresos drop column if exists monto;
