-- Agregar columna cancellation_comment a la tabla orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_comment VARCHAR(1000);
