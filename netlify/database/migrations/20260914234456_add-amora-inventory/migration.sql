CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price_pence INTEGER NOT NULL DEFAULT 2500,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  stripe_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'completed', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservation_items (
  reservation_id TEXT NOT NULL
    REFERENCES reservations(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL
    REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (reservation_id, product_id)
);

INSERT INTO products (id, name, price_pence, stock)
VALUES
  (1, 'Amora Golf Cap', 2500, 10),
  (2, 'Amora Black Cap', 2500, 10),
  (3, 'Amora Grey Cap', 2500, 10),
  (4, 'Amora Navy Cap', 2500, 10)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    price_pence = EXCLUDED.price_pence;-- Write your migration SQL here
--
-- Example:
--   CREATE TABLE IF NOT EXISTS users (
--     id SERIAL PRIMARY KEY,
--     name TEXT NOT NULL,
--     created_at TIMESTAMP DEFAULT NOW()
--   );
