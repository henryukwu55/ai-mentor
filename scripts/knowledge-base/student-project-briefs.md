# Student Project Briefs — Full Stack Applications

## Project 1: Task Management App (Trello-style)

**Overview:**
Build a Kanban board where users can create boards, add columns (To Do, In Progress, Done),
and drag cards between columns. Data persists to a database.

**Required features:**
- User authentication (sign up, login, logout)
- Create/rename/delete boards
- Create/move/delete cards with title and description
- Drag-and-drop between columns (client-side)
- All data persisted to PostgreSQL via Supabase

**Tech stack:** Next.js, Tailwind, Supabase, @dnd-kit/core (drag-and-drop)

**Data model:**
```sql
users     (id, email, full_name, created_at)
boards    (id, user_id, title, created_at)
columns   (id, board_id, title, position, created_at)
cards     (id, column_id, title, description, position, created_at)
```

**Common student errors on this project:**

1. Losing card order after drag-and-drop because positions aren't persisted.
   Fix: store a `position` float and use lexicographic ordering, or re-index
   all positions in the column after every drag.

2. Cards disappearing after refresh because state is only in memory.
   Fix: fetch from Supabase on mount and after every mutation.

3. SQL constraint error when deleting a board: foreign key violation.
   Fix: add `ON DELETE CASCADE` to foreign keys, or delete cards → columns → board in order.

4. Optimistic UI showing incorrect state when the server update fails.
   Fix: revert state in the catch block: `setCards(previousCards)`.

---

## Project 2: Real-Time Chat Application

**Overview:**
A group chat application where users can join named rooms and exchange
messages in real time. New messages appear instantly without refreshing.

**Required features:**
- User registration and login
- Create/join public chat rooms
- Send and receive messages in real time (Supabase Realtime or WebSockets)
- Show who is online in a room
- Message history loads on join

**Tech stack:** Next.js, Supabase (Realtime), Tailwind

**Data model:**
```sql
users     (id, email, username, avatar_url, created_at)
rooms     (id, name, description, created_by, created_at)
messages  (id, room_id, user_id, content, created_at)
presence  (id, room_id, user_id, last_seen_at)
```

**Supabase Realtime setup:**
```js
const channel = supabase
  .channel(`room:${roomId}`)
  .on("postgres_changes",
    { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
    (payload) => setMessages(prev => [...prev, payload.new])
  )
  .subscribe();

return () => supabase.removeChannel(channel); // always clean up on unmount
```

**Common student errors on this project:**

1. Messages duplicating — both the Realtime subscription AND the insert response
   add the message to state. Fix: only update state from Realtime, not from the insert return value.

2. Subscription not cleaned up on component unmount — causes memory leaks and
   receiving events on unmounted components. Fix: return cleanup from useEffect.

3. Old messages not loading — only subscribing to new events without fetching
   message history first. Fix: fetch existing messages on mount, then subscribe.

4. XSS vulnerability — rendering message content as `dangerouslySetInnerHTML`.
   Fix: render as plain text or use a sanitisation library like DOMPurify.

---

## Project 3: E-Commerce Store with Cart and Checkout

**Overview:**
A simple online store: product listing, product detail page, shopping cart,
and checkout using Stripe. Admin panel to manage products.

**Required features:**
- Browse products (with categories and search)
- Add to cart, update quantities, remove items
- Cart persists across page refreshes (localStorage or database)
- Checkout with Stripe (test mode)
- Order confirmation with summary
- Admin: add/edit/delete products with image upload

**Tech stack:** Next.js, Supabase, Stripe, Tailwind

**Data model:**
```sql
products  (id, name, description, price_pence, stock, image_url, category, created_at)
orders    (id, user_id, stripe_session_id, total_pence, status, created_at)
order_items (id, order_id, product_id, quantity, price_pence_at_time)
```

**Stripe integration checklist:**
1. Create a Checkout Session server-side (never client-side)
2. Use `STRIPE_SECRET_KEY` server-side only; `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` client-side
3. Handle `checkout.session.completed` webhook to confirm payment and update order status
4. Verify webhook signature with `stripe.webhooks.constructEvent` to prevent spoofing
5. Always use test mode keys (`sk_test_`, `pk_test_`) during development

**Common student errors on this project:**

1. "No such API key" error — `STRIPE_SECRET_KEY` is not set in `.env.local`,
   or the server restarted without reloading environment variables.

2. "Invalid API Key: pk_test_..." — publishable key used on the server instead of secret key.
   The secret key starts with `sk_`, publishable with `pk_`. Never use `pk_` server-side.

3. Cart emptied on refresh — stored in React state only, not in localStorage or database.
   Fix: `JSON.stringify` cart to localStorage on change, read back on mount.

4. Order status never updating — webhook not set up, or Stripe can't reach localhost.
   Fix: use Stripe CLI to forward webhooks locally: `stripe listen --forward-to localhost:3000/api/webhook`

5. Stock going negative — no transaction around "check stock → decrement" logic.
   Fix: use a PostgreSQL function with `FOR UPDATE` row locking inside a transaction.
