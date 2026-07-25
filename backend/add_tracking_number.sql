-- Agregar campo tracking_number a la tabla orders
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100);

-- Crear índice para búsquedas por número de guía
CREATE INDEX idx_orders_tracking_number ON orders(tracking_number);
