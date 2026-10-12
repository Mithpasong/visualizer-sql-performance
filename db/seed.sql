-- Sample data (about users 50k / products 20k / orders 300k / order_items 750k / reviews 100k)
SELECT setseed(0.42);

INSERT INTO users (email, name, city, grade, created_at)
SELECT
  'user' || g || '@example.com',
  (ARRAY['James','Olivia','Liam','Emma','Noah','Ava','Ethan','Mia','Lucas','Sophia'])[1 + floor(random() * 10)::int]
    || ' ' ||
  (ARRAY['Smith','Johnson','Brown','Lee','Garcia','Miller','Davis','Wilson','Taylor','Clark'])[1 + floor(random() * 10)::int],
  (ARRAY['Seoul','Busan','Tokyo','New York','London','Paris','Berlin','Sydney','Toronto','Singapore'])[1 + floor(random() * 10)::int],
  (ARRAY['BRONZE','BRONZE','BRONZE','SILVER','SILVER','GOLD','VIP'])[1 + floor(random() * 7)::int],
  now() - random() * interval '1500 days'
FROM generate_series(1, 50000) g;

-- Top-level categories 1-6, subcategories 7-30
INSERT INTO categories (parent_id, name) VALUES
  (NULL, 'Electronics'), (NULL, 'Fashion'), (NULL, 'Food'), (NULL, 'Books'), (NULL, 'Sports'), (NULL, 'Home');

INSERT INTO categories (parent_id, name) VALUES
  (1, 'Laptops'), (1, 'Smartphones'), (1, 'Earphones'), (1, 'Monitors'),
  (2, 'T-Shirts'), (2, 'Jeans'), (2, 'Sneakers'), (2, 'Bags'),
  (3, 'Fruit'), (3, 'Coffee'), (3, 'Ready Meals'), (3, 'Supplements'),
  (4, 'Fiction'), (4, 'Business'), (4, 'Programming'), (4, 'Kids'),
  (5, 'Camping'), (5, 'Cycling'), (5, 'Yoga'), (5, 'Golf'),
  (6, 'Furniture'), (6, 'Kitchen'), (6, 'Bedding'), (6, 'Lighting');

INSERT INTO products (category_id, name, price, stock, created_at)
SELECT
  c.id,
  (ARRAY['Basic','Premium','Special','Classic','Modern','Eco','Pro','Lite'])[1 + floor(random() * 8)::int]
    || ' ' || c.name || ' ' || x.g,
  (round((1000 + random() * 499000) / 100) * 100)::int,
  floor(random() * 500)::int,
  now() - random() * interval '1000 days'
FROM (
  SELECT g, 7 + floor(random() * 24)::int AS category_id
  FROM generate_series(1, 20000) g
) x
JOIN categories c ON c.id = x.category_id
ORDER BY x.g;

INSERT INTO orders (user_id, status, ordered_at)
SELECT
  1 + floor(random() * 50000)::bigint,
  (ARRAY['DELIVERED','DELIVERED','DELIVERED','DELIVERED','DELIVERED','DELIVERED',
         'SHIPPED','PAID','PENDING','CANCELLED'])[1 + floor(random() * 10)::int],
  now() - random() * interval '730 days'
FROM generate_series(1, 300000) g;

-- 1 to 4 items per order
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT x.order_id, p.id, x.quantity, p.price
FROM (
  SELECT
    o.id AS order_id,
    (1 + floor(random() * 20000))::bigint AS product_id,
    (1 + floor(random() * 3))::int AS quantity
  FROM orders o
  CROSS JOIN LATERAL generate_series(1, (1 + floor(random() * 4))::int + (o.id * 0)::int) s
) x
JOIN products p ON p.id = x.product_id;

UPDATE orders o
SET total_amount = s.total
FROM (
  SELECT order_id, sum(quantity * unit_price)::int AS total
  FROM order_items
  GROUP BY order_id
) s
WHERE s.order_id = o.id;

INSERT INTO reviews (product_id, user_id, rating, content, created_at)
SELECT
  1 + floor(random() * 20000)::bigint,
  1 + floor(random() * 50000)::bigint,
  (ARRAY[1,2,3,3,4,4,4,5,5,5])[1 + floor(random() * 10)::int],
  (ARRAY['Fast delivery','Great value for money','Not what I expected','Would buy again','Great quality',
         'Carefully packaged','Runs a bit small','Love the color','It is okay','Highly recommended'])[1 + floor(random() * 10)::int],
  now() - random() * interval '700 days'
FROM generate_series(1, 100000) g;

ANALYZE;
