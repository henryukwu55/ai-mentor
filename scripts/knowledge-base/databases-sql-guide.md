# Databases & SQL — Core Concepts for Software Engineering Students

## Relational vs Non-Relational Databases

**Relational (SQL) — PostgreSQL, MySQL, SQLite:**
- Data stored in tables with rows and columns
- Relationships enforced with foreign keys
- ACID transactions — Atomicity, Consistency, Isolation, Durability
- Use when: data has clear structure, relationships matter, consistency is critical

**Non-Relational (NoSQL) — MongoDB, Redis, DynamoDB:**
- Data stored as documents, key-value pairs, or graphs
- Flexible schema — fields can vary per record
- Often horizontally scalable
- Use when: data is unstructured, you need extreme write speed, or schema changes often

**For most student projects: use PostgreSQL (or Supabase which wraps it).** It is
the most widely used database in production and the most valuable to learn.

---

## SQL Fundamentals

**SELECT:**
```sql
SELECT name, email FROM users WHERE active = true ORDER BY created_at DESC LIMIT 10;
```

**JOIN — combine rows from two tables:**
```sql
-- INNER JOIN — only rows that match in both tables
SELECT orders.id, users.name
FROM orders
INNER JOIN users ON orders.user_id = users.id;

-- LEFT JOIN — all rows from left table, matched rows from right (NULL if no match)
SELECT users.name, orders.id
FROM users
LEFT JOIN orders ON users.id = orders.user_id;
```

**Aggregates:**
```sql
SELECT user_id, COUNT(*) as order_count, SUM(total) as revenue
FROM orders
GROUP BY user_id
HAVING COUNT(*) > 5;
```

**INSERT / UPDATE / DELETE:**
```sql
INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');

UPDATE users SET last_login = NOW() WHERE id = 42;

DELETE FROM sessions WHERE expires_at < NOW();
```

---

## Common Database Mistakes Students Make

**1. No indexes on foreign keys and columns you query/sort by:**
```sql
-- After creating the table, add indexes:
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
```
Without indexes, every query does a full table scan. Fine at 100 rows; catastrophic at 1 million.

**2. N+1 query problem:**
```js
// WRONG — 1 query to get orders, then 1 per order to get user = N+1 queries
const orders = await db.query("SELECT * FROM orders");
for (const order of orders) {
  order.user = await db.query("SELECT * FROM users WHERE id = $1", [order.user_id]);
}

// RIGHT — 1 JOIN query
const orders = await db.query(`
  SELECT orders.*, users.name as user_name
  FROM orders JOIN users ON orders.user_id = users.id
`);
```

**3. Storing passwords in plain text** — always hash with bcrypt or argon2.

**4. SQL Injection — never concatenate user input into a query:**
```js
// WRONG — SQL injection vulnerability
db.query(`SELECT * FROM users WHERE email = '${userInput}'`);

// RIGHT — parameterised query
db.query("SELECT * FROM users WHERE email = $1", [userInput]);
```

**5. Not using transactions for multi-step operations:**
```sql
-- If step 2 fails, step 1 should be rolled back
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
-- If anything throws, run ROLLBACK instead
```

---

## Supabase-Specific (the database used in this project)

**Supabase is PostgreSQL** with a REST API, realtime subscriptions, and
authentication built on top.

**Row Level Security (RLS):**
When RLS is enabled, no data is returned unless a matching policy exists.
If your queries return empty results unexpectedly, check:
1. Is RLS enabled? (`alter table X enable row level security`)
2. Is there a policy that allows the current role to read?

**Common Supabase query pattern:**
```js
const { data, error } = await supabase
  .from("messages")
  .select("*, sessions(project_name)")
  .eq("session_id", sessionId)
  .order("created_at", { ascending: true });

if (error) throw error;
```

**The service role key bypasses RLS** — only use it server-side (API routes),
never expose it to the browser.

**pgvector — vector similarity search:**
Used for RAG (Retrieval-Augmented Generation). Each document chunk is
converted to an embedding (an array of numbers representing its meaning) and
stored. At query time, the question is also embedded and the most similar
chunks are retrieved.
```sql
-- cosine similarity search
SELECT content, 1 - (embedding <=> query_embedding) as similarity
FROM documents
ORDER BY embedding <=> query_embedding
LIMIT 4;
```

---

## Database Design Principles

**Normalisation — don't repeat data:**
- 1NF: Each column holds a single value, each row is unique
- 2NF: Non-key columns depend on the whole primary key
- 3NF: Non-key columns don't depend on other non-key columns

**Denormalisation — sometimes repeat data for performance:**
If you always join the same two tables and the data is read-heavy, store the
redundant column to avoid the join. Add it back when the query becomes a bottleneck.

**UUID vs auto-increment IDs:**
- UUID: globally unique, safe to generate client-side, harder to guess
- Auto-increment: shorter, simpler, sequential (can leak row counts)
- Supabase default: `gen_random_uuid()` — use this.

**Soft deletes:**
Instead of `DELETE`, add `deleted_at TIMESTAMPTZ` and filter with
`WHERE deleted_at IS NULL`. Preserves audit trails and allows undo.
