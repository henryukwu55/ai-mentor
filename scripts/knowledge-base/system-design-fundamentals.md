# System Design — Fundamentals for Students

## Why System Design Matters

In a job interview or oral defence, you will be asked to design a system from
scratch or justify the architecture of a system you built. The goal is to show
you can think about trade-offs, not just write code.

---

## The Design Process (Always Follow This Order)

1. **Clarify requirements** — ask questions before drawing anything
   - Who are the users? How many?
   - What are the core features? What's out of scope?
   - What are the performance and reliability requirements?
   - Read/write ratio? (mostly reads → optimise for reads)

2. **Estimate scale** — rough numbers guide every decision
   - 10K users vs 10M users require completely different architectures
   - Daily Active Users (DAU) → requests per second → database size per year

3. **Design the data model** — what do you store and how?
   - Tables, fields, relationships
   - What queries will be most common?

4. **Design the API** — what endpoints does the client need?

5. **Draw the high-level architecture** — components and how they connect

6. **Identify bottlenecks** — where will this break at scale?

7. **Propose solutions** — caching, sharding, CDN, async queues, etc.

---

## Core Components to Know

**Load Balancer** — distributes traffic across multiple servers
- Prevents any single server from being overwhelmed
- Enables horizontal scaling (add more servers)
- Provides failover if one server goes down

**Cache (Redis, Memcached)** — store frequently read data in memory
- Dramatically reduces database load
- Cache hit ratio should be > 80% for it to be worthwhile
- Cache invalidation is hard — when does cached data become stale?
- Strategies: TTL (time-to-live), cache-aside, write-through

**CDN (Content Delivery Network)** — serve static files from edge nodes near users
- Images, CSS, JS, fonts load faster
- Reduces load on your origin server
- Examples: Cloudflare, Vercel Edge Network

**Message Queue (Redis Pub/Sub, RabbitMQ, Kafka)** — decouple services asynchronously
- Use when: the work takes long (sending emails, processing images, ML inference)
- Producer adds a job to the queue; consumer processes it independently
- Prevents slow jobs from blocking the API response

**Database Replication** — one primary (writes), multiple replicas (reads)
- Read replicas reduce load on the primary
- Replication lag means replicas may be slightly behind — design for eventual consistency

---

## Scalability Patterns

**Horizontal scaling** — add more servers (preferred)
**Vertical scaling** — make one server bigger (simpler but has limits)

**Sharding** — split a database across multiple machines by a shard key
- Example: users A–M on shard 1, N–Z on shard 2
- Hard to do, hard to change later — only when truly needed

**Read/Write Separation** — route reads to replicas, writes to primary

**Stateless services** — store no user state on the server; put it in a shared
store (database, Redis). Stateless services can be scaled horizontally easily.

---

## CAP Theorem

In a distributed system, you can only guarantee two of three:
- **Consistency** — all nodes see the same data at the same time
- **Availability** — every request gets a response (might be stale)
- **Partition Tolerance** — system works even if nodes can't communicate

In practice, network partitions happen, so you choose between **CP** (banks,
financial systems — never show stale data) and **AP** (social feeds, caches —
availability over perfect consistency).

---

## Common Design Questions and How to Approach Them

**"Design a URL shortener (like bit.ly)"**
- Data model: `{ id, long_url, short_code, created_at, user_id }`
- Short code generation: base62 encode an auto-increment ID, or random + collision check
- Scale: mostly reads → cache popular short codes in Redis
- Bottleneck: redirect endpoint must be ultra-fast — cache everything

**"Design a chat application"**
- WebSocket for real-time messages (HTTP polling doesn't scale)
- Data model: `rooms`, `messages`, `participants`
- Message delivery: at-least-once with client deduplication
- Scale: shard by room ID; use Redis Pub/Sub across server instances

**"Design a notification system"**
- Push (WebSocket/SSE) for real-time, email/SMS for async
- Message queue for async delivery (never block API on sending email)
- Idempotency keys to avoid duplicate notifications

---

## Explaining Your Project's Architecture

When defending your own project, be ready to answer:
- "Why did you choose PostgreSQL over MongoDB?" — relate to your data structure
- "What happens when the database goes down?" — failover, retries, graceful degradation
- "How would you scale this to 10x the users?" — identify the bottleneck first
- "Where is the single point of failure?" — every system has one; acknowledge it
- "What would you do differently if you built it again?" — shows maturity

Always admit what you don't know and explain what you would investigate further.
Panelists respect intellectual honesty over false confidence.
