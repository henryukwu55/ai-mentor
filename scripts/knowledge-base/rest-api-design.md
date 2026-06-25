# REST APIs — Design, HTTP, and Common Mistakes

## HTTP Methods — What Each One Means

| Method | Use for | Body? | Idempotent? |
|--------|---------|-------|-------------|
| GET    | Read data | No | Yes |
| POST   | Create a resource | Yes | No |
| PUT    | Replace a resource fully | Yes | Yes |
| PATCH  | Partially update a resource | Yes | Yes |
| DELETE | Remove a resource | Optional | Yes |

**Idempotent** means calling it multiple times has the same effect as calling it once.

---

## HTTP Status Codes — Use the Right Ones

**2xx Success:**
- `200 OK` — general success
- `201 Created` — resource was created (POST); include `Location` header
- `204 No Content` — success with no response body (DELETE)

**4xx Client errors (the caller did something wrong):**
- `400 Bad Request` — invalid request body, missing field, wrong format
- `401 Unauthorized` — not authenticated (no valid token)
- `403 Forbidden` — authenticated but not allowed (wrong role)
- `404 Not Found` — resource doesn't exist
- `409 Conflict` — duplicate resource (email already exists)
- `422 Unprocessable Entity` — body parsed fine but validation failed

**5xx Server errors (your code is broken):**
- `500 Internal Server Error` — unhandled exception
- `503 Service Unavailable` — database down, external API unreachable

**Common mistake:** returning `200` with `{ error: "Not found" }` in the body.
Use the correct HTTP status code — clients and monitoring tools depend on it.

---

## RESTful URL Design

**Good patterns:**
```
GET    /api/users           → list all users
POST   /api/users           → create a user
GET    /api/users/:id       → get one user
PATCH  /api/users/:id       → update a user
DELETE /api/users/:id       → delete a user

GET    /api/users/:id/orders → get orders belonging to a user
POST   /api/orders/:id/cancel → action on a resource (verb is OK here)
```

**Bad patterns:**
```
GET  /api/getUser          ← verb in URL (use GET method instead)
POST /api/deleteUser       ← wrong method
GET  /api/user_orders_get  ← inconsistent naming
```

**Use nouns, not verbs. Use plural nouns. Use kebab-case.**

---

## Request Validation

Always validate before touching the database:
```js
// Next.js API route example
export async function POST(req) {
  const body = await req.json();
  const { name, email } = body;

  if (!name?.trim())  return Response.json({ error: "name is required" }, { status: 400 });
  if (!email?.includes("@")) return Response.json({ error: "invalid email" }, { status: 400 });

  // safe to proceed
}
```

For complex validation, use a library like **Zod**:
```js
import { z } from "zod";
const schema = z.object({ name: z.string().min(1), email: z.string().email() });
const result = schema.safeParse(body);
if (!result.success) return Response.json({ error: result.error.flatten() }, { status: 400 });
```

---

## Authentication vs Authorisation

**Authentication** — proving who you are (login, JWT, session)
**Authorisation** — proving you're allowed to do something (roles, ownership)

**JWT (JSON Web Token):**
- Signed by the server, verified without a database lookup
- Contains: header.payload.signature (base64 encoded)
- Never put sensitive data in the payload — it's only encoded, not encrypted
- Set short expiry (15–60 min) and use refresh tokens for longer sessions

**Common mistake:** checking authentication but not authorisation:
```js
// WRONG — checks the user is logged in, but not that they OWN this record
const user = verifyToken(req.headers.authorization);
const record = await db.query("SELECT * FROM notes WHERE id = $1", [req.params.id]);

// RIGHT
const record = await db.query(
  "SELECT * FROM notes WHERE id = $1 AND user_id = $2",
  [req.params.id, user.id]
);
if (!record) return res.status(403).json({ error: "Forbidden" });
```

---

## CORS (Cross-Origin Resource Sharing)

CORS errors happen when a browser makes a request to a different origin than
the page. The server must include the right headers.

**The error "CORS policy: No 'Access-Control-Allow-Origin' header" means your
backend is not sending CORS headers** — it is a server-side fix, not a
client-side fix.

In Next.js API routes, CORS is not needed when the frontend and backend share
the same origin (`localhost:3000`). It's only needed when they're on different
domains.

---

## API Error Handling Pattern

```js
// Consistent error response shape
{ "error": "Human-readable message", "code": "MACHINE_READABLE_CODE" }

// Consistent success shape
{ "data": { ... }, "meta": { "total": 100, "page": 1 } }
```

Never send raw database errors to the client — they expose table names,
column names, and query structure. Log them server-side and return a generic message.

---

## Rate Limiting and Security Basics

- **Rate limit** all endpoints, especially auth endpoints
- **Sanitise** all user input before storing or rendering
- **Never log** passwords, tokens, or card numbers
- **Use HTTPS** everywhere — even in development (localhost is the exception)
- **Principle of least privilege** — API keys and DB users should only have
  the permissions they actually need
