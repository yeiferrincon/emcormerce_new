-- Actualizar pedidos con estados obsoletos a estados válidos
-- 'processing' y 'shipped' ya no existen, se cambian a 'delivered'
UPDATE orders SET status = 'delivered' WHERE status IN ('processing', 'shipped');
