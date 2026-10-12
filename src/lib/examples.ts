import type { Locale } from "./i18n";

type Localized = Record<Locale, string>;

export type ExampleVariant = {
  label: Localized;
  sql: string;
};

export type ExampleScenario = {
  id: string;
  title: Localized;
  description: Localized;
  variants: [ExampleVariant, ExampleVariant];
};

export const EXAMPLES: ExampleScenario[] = [
  {
    id: "fk-index",
    title: {
      en: "Foreign key column with vs. without an index",
      ko: "외래키(FK) 컬럼의 인덱스 유무",
    },
    description: {
      en: "order_items.order_id has an index but product_id does not. Even on the same 750k-row table, a missing index forces a full table scan (Seq Scan).",
      ko: "order_items.order_id 에는 인덱스가 있고 product_id 에는 없습니다. 같은 75만 행 테이블이라도 인덱스가 없으면 전체를 훑어야(Seq Scan) 합니다.",
    },
    variants: [
      {
        label: { en: "Column without index", ko: "인덱스 없는 컬럼" },
        sql: `SELECT *
FROM order_items
WHERE product_id = 777;`,
      },
      {
        label: { en: "Column with index", ko: "인덱스 있는 컬럼" },
        sql: `SELECT *
FROM order_items
WHERE order_id = 777;`,
      },
    ],
  },
  {
    id: "function-on-index",
    title: {
      en: "Wrapping an indexed column in a function",
      ko: "인덱스 컬럼을 함수로 감싸기",
    },
    description: {
      en: "orders.ordered_at is indexed, but casting it or wrapping it in a function prevents the index from being used. Rewriting it as a range condition allows an Index Scan.",
      ko: "orders.ordered_at 에 인덱스가 있어도 컬럼을 형변환/함수로 감싸면 인덱스를 쓸 수 없습니다. 범위 조건으로 바꾸면 Index Scan 이 가능합니다.",
    },
    variants: [
      {
        label: { en: "Function on column", ko: "컬럼에 함수 적용" },
        sql: `SELECT count(*)
FROM orders
WHERE ordered_at::date = current_date - 30;`,
      },
      {
        label: { en: "Range condition", ko: "범위 조건" },
        sql: `SELECT count(*)
FROM orders
WHERE ordered_at >= current_date - 30
  AND ordered_at <  current_date - 29;`,
      },
    ],
  },
  {
    id: "correlated-subquery",
    title: {
      en: "Correlated subquery vs. JOIN + GROUP BY",
      ko: "상관 서브쿼리 vs JOIN + GROUP BY",
    },
    description: {
      en: "Count sales for 50 products. A correlated subquery in SELECT runs once per outer row, and since order_items.product_id has no index, each run scans all 750k rows. Aggregating once and joining is far more efficient.",
      ko: "상품 50개의 판매 건수 구하기. SELECT 절의 상관 서브쿼리는 바깥 행마다 한 번씩 실행되는데, order_items.product_id 에 인덱스가 없어 매번 75만 행을 훑습니다. 집계를 한 번에 하고 JOIN 하면 훨씬 효율적입니다.",
    },
    variants: [
      {
        label: { en: "Correlated subquery", ko: "상관 서브쿼리" },
        sql: `SELECT p.id, p.name,
  (SELECT count(*) FROM order_items oi WHERE oi.product_id = p.id) AS sold_count
FROM products p
WHERE p.id <= 50
ORDER BY sold_count DESC
LIMIT 20;`,
      },
      {
        label: { en: "JOIN + GROUP BY", ko: "JOIN + GROUP BY" },
        sql: `SELECT p.id, p.name, count(oi.id) AS sold_count
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
WHERE p.id <= 50
GROUP BY p.id, p.name
ORDER BY sold_count DESC
LIMIT 20;`,
      },
    ],
  },
  {
    id: "offset-vs-keyset",
    title: {
      en: "OFFSET pagination vs. keyset pagination",
      ko: "OFFSET 페이지네이션 vs Keyset 페이지네이션",
    },
    description: {
      en: "OFFSET reads every skipped row and then throws it away. Finding the next page from the last id you saw (keyset) stays fast no matter how deep the page is.",
      ko: "OFFSET 은 건너뛸 행을 모두 읽은 뒤 버립니다. 마지막으로 본 id 를 기준으로 다음 페이지를 찾으면(Keyset) 페이지가 깊어져도 빠릅니다.",
    },
    variants: [
      {
        label: { en: "OFFSET 280000", ko: "OFFSET 280000" },
        sql: `SELECT id, user_id, status, total_amount
FROM orders
ORDER BY id
LIMIT 20 OFFSET 280000;`,
      },
      {
        label: { en: "Keyset (id > 280000)", ko: "Keyset (id > 280000)" },
        sql: `SELECT id, user_id, status, total_amount
FROM orders
WHERE id > 280000
ORDER BY id
LIMIT 20;`,
      },
    ],
  },
  {
    id: "select-star",
    title: {
      en: "SELECT * vs. only the columns you need",
      ko: "SELECT * vs 필요한 컬럼만",
    },
    description: {
      en: "Fetching columns you don't need increases the data the database reads and sends over the network. The more rows returned, the bigger the gap.",
      ko: "필요 없는 컬럼까지 가져오면 DB가 읽고 네트워크로 보내는 데이터가 늘어납니다. 결과 행이 많을수록 차이가 커집니다.",
    },
    variants: [
      {
        label: { en: "SELECT *", ko: "SELECT *" },
        sql: `SELECT *
FROM orders o
JOIN users u ON u.id = o.user_id
JOIN order_items oi ON oi.order_id = o.id
WHERE o.ordered_at >= now() - interval '60 days';`,
      },
      {
        label: { en: "Only needed columns", ko: "필요한 컬럼만" },
        sql: `SELECT o.id, u.name, oi.product_id, oi.quantity
FROM orders o
JOIN users u ON u.id = o.user_id
JOIN order_items oi ON oi.order_id = o.id
WHERE o.ordered_at >= now() - interval '60 days';`,
      },
    ],
  },
  {
    id: "count-vs-exists",
    title: {
      en: "Checking existence: COUNT(*) vs. EXISTS",
      ko: "존재 여부 확인: COUNT(*) vs EXISTS",
    },
    description: {
      en: "When you only need to know whether at least one row exists, COUNT(*) still counts every match, while EXISTS stops as soon as it finds the first one.",
      ko: "'하나라도 있는지'만 알고 싶을 때 COUNT(*) 는 끝까지 세지만, EXISTS 는 첫 번째 행을 찾는 즉시 멈춥니다.",
    },
    variants: [
      {
        label: { en: "COUNT(*) > 0", ko: "COUNT(*) > 0" },
        sql: `SELECT count(*) > 0 AS has_cancelled
FROM orders
WHERE status = 'CANCELLED';`,
      },
      {
        label: { en: "EXISTS", ko: "EXISTS" },
        sql: `SELECT EXISTS (
  SELECT 1 FROM orders WHERE status = 'CANCELLED'
) AS has_cancelled;`,
      },
    ],
  },
  {
    id: "not-in-vs-not-exists",
    title: {
      en: "NOT IN vs. NOT EXISTS",
      ko: "NOT IN vs NOT EXISTS",
    },
    description: {
      en: "Find VIP users who joined in the last 200 days and never wrote a review. Because of its NULL semantics, NOT IN can't be turned into an anti join and compares against the subquery result row by row, while NOT EXISTS runs as a single Hash Anti Join.",
      ko: "최근 200일 안에 가입했고 리뷰를 한 번도 쓰지 않은 VIP 회원 찾기. NOT IN 은 NULL 처리 규칙 때문에 Anti Join 으로 바꿀 수 없어 서브쿼리 결과를 행마다 비교하고, NOT EXISTS 는 Hash Anti Join 으로 한 번에 처리됩니다.",
    },
    variants: [
      {
        label: { en: "NOT IN", ko: "NOT IN" },
        sql: `SELECT count(*)
FROM users u
WHERE u.grade = 'VIP'
  AND u.created_at >= now() - interval '200 days'
  AND u.id NOT IN (SELECT r.user_id FROM reviews r);`,
      },
      {
        label: { en: "NOT EXISTS", ko: "NOT EXISTS" },
        sql: `SELECT count(*)
FROM users u
WHERE u.grade = 'VIP'
  AND u.created_at >= now() - interval '200 days'
  AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.user_id = u.id);`,
      },
    ],
  },
  {
    id: "like-prefix",
    title: {
      en: "LIKE '%...' vs. exact match",
      ko: "LIKE '%...' vs 정확한 일치",
    },
    description: {
      en: "users.email has a UNIQUE index, but a LIKE pattern with a leading % can't use it, so all 50k rows are checked.",
      ko: "users.email 에는 UNIQUE 인덱스가 있지만, 앞에 % 가 붙은 LIKE 는 인덱스를 쓸 수 없어 5만 행을 모두 검사합니다.",
    },
    variants: [
      {
        label: { en: "LIKE '%12345@...'", ko: "LIKE '%12345@...'" },
        sql: `SELECT id, email, name
FROM users
WHERE email LIKE '%12345@example.com';`,
      },
      {
        label: { en: "= (uses index)", ko: "= (인덱스 사용)" },
        sql: `SELECT id, email, name
FROM users
WHERE email = 'user12345@example.com';`,
      },
    ],
  },
];
