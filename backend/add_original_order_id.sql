-- Agregar columna original_order_id a la tabla orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_original_order_id ON orders(original_order_id);
