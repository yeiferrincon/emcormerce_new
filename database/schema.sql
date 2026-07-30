-- RopaShop - PostgreSQL schema (manual install)
-- Target: PostgreSQL 13+

BEGIN;

-- Optional: better ILIKE search
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Tabla de Usuarios (Independiente)
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(20) NOT NULL DEFAULT 'user',
  phone           VARCHAR(32) NULL,
  address         VARCHAR(500) NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_users_email UNIQUE (email)
);

-- 2. Tabla de Categorías (Independiente)
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  description TEXT NULL,
  CONSTRAINT uq_categories_name UNIQUE (name)
);

-- 3. Tabla de Productos (Depende de Categorías)
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  description TEXT NULL,
  price       NUMERIC(12,2) NOT NULL CHECK (price > 0),
  stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  image_url   VARCHAR(500) NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabla de Variantes de Productos (Depende de Productos)
CREATE TABLE IF NOT EXISTS product_variants (
  id          SERIAL PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size        VARCHAR(32) NOT NULL,
  color       VARCHAR(64) NOT NULL,
  stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  CONSTRAINT uq_product_variant_product_size_color UNIQUE (product_id, size, color)
);

-- 5. Tabla de Carrito de Compras (Depende de Usuarios)
CREATE TABLE IF NOT EXISTS cart (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_cart_user_id UNIQUE (user_id)
);

-- 6. Tabla de Ítems del Carrito (Depende de Carrito y Variantes)
CREATE TABLE IF NOT EXISTS cart_items (
  id                  SERIAL PRIMARY KEY,
  cart_id             INT NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
  product_variant_id  INT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity            INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  CONSTRAINT uq_cart_item_cart_variant UNIQUE (cart_id, product_variant_id)
);

-- 7. Tabla de Pedidos / Órdenes (Depende de Usuarios)
CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  user_id          INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_price      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  currency         CHAR(3) NOT NULL DEFAULT 'COP',
  shipping_address VARCHAR(500) NULL,
  shipping_phone   VARCHAR(32) NULL,
  cancellation_comment VARCHAR(1000) NULL,
  original_order_id INT NULL REFERENCES orders(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Tabla de Detalles del Pedido (Depende de Órdenes y Variantes)
CREATE TABLE IF NOT EXISTS order_items (
  id                  SERIAL PRIMARY KEY,
  order_id            INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id          INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_variant_id  INT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity            INT NOT NULL CHECK (quantity >= 1),
  price               NUMERIC(12,2) NOT NULL CHECK (price > 0)
);






BEGIN;

-- ==========================
-- TABLA DE USUARIOS
-- ==========================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    phone VARCHAR(32),
    address VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- TABLA DE CATEGORÍAS
-- ==========================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT
);

-- ==========================
-- TABLA DE PRODUCTOS
-- ==========================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL,
    stock INT NOT NULL,
    image_url VARCHAR(500),
    category_id INT REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- TABLA DE VARIANTES
-- ==========================
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    size VARCHAR(30),
    color VARCHAR(50),
    stock INT
);

-- ==========================
-- TABLA DE CARRITO
-- ==========================
CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- TABLA DE PRODUCTOS DEL CARRITO
-- ==========================
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT REFERENCES cart(id),
    product_variant_id INT REFERENCES product_variants(id),
    quantity INT NOT NULL
);

-- ==========================
-- TABLA DE PEDIDOS
-- ==========================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    status VARCHAR(20),
    total_price NUMERIC(12,2),
    currency CHAR(3),
    shipping_address VARCHAR(500),
    shipping_phone VARCHAR(30),
    cancellation_comment VARCHAR(1000),
    original_order_id INT REFERENCES orders(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- TABLA DE DETALLE DEL PEDIDO
-- ==========================
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    product_variant_id INT REFERENCES product_variants(id),
    quantity INT NOT NULL,
    price NUMERIC(12,2) NOT NULL
);

COMMIT;