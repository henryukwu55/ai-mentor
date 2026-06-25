# Deployment Guide — Getting Your App Live

## Pre-Deployment Checklist

Before deploying anything to a public URL:

- [ ] All API keys and secrets are in environment variables, not in code
- [ ] `.env.local` is in `.gitignore` and has NOT been committed
- [ ] Error messages shown to users don't leak internal details (stack traces, SQL errors)
- [ ] Database has proper indexes on columns you query by
- [ ] RLS (Row Level Security) policies are tightened — no `using (true)` in production
- [ ] `npm run build` succeeds locally
- [ ] `npm run lint` passes with no errors
- [ ] You have tested the happy path AND the error paths

---

## Deploying a Next.js App

### Option 1: Vercel (Easiest — free tier available)

Vercel is made by the same team that makes Next.js. Zero config.

```bash
npm install -g vercel
vercel login
vercel          # follow prompts — auto-detects Next.js
```

Or connect your GitHub repo at vercel.com. Every push to `main` auto-deploys.

**Setting environment variables on Vercel:**
Dashboard → Your project → Settings → Environment Variables
Add each variable from your `.env.local`.
Never commit `.env.local` — set variables in the Vercel dashboard.

### Option 2: Railway (Simple, generous free tier)

1. Push your project to GitHub
2. Go to railway.app → New Project → Deploy from GitHub repo
3. Railway detects Next.js and builds automatically
4. Add environment variables in the Variables tab

### Option 3: VPS (DigitalOcean, Linode, Hetzner)

For full control and self-hosting Ollama alongside the app.

```bash
# On the server
git clone your-repo
cd your-repo
npm install
npm run build

# Use PM2 to keep the process running
npm install -g pm2
pm2 start npm --name "ai-mentor" -- start
pm2 save
pm2 startup
```

Add Nginx as a reverse proxy so port 80/443 → port 3000:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Use Certbot to add HTTPS: `sudo certbot --nginx -d yourdomain.com`

---

## Deploying Ollama (for AI features)

Ollama must run on a server with enough RAM for your model:
- llama3.1 8B (default) → 8 GB RAM minimum, 16 GB recommended
- Use a GPU instance if available — 5–10x faster inference

```bash
# Install Ollama on Linux server
curl -fsSL https://ollama.com/install.sh | sh

# Pull the models
ollama pull llama3.1
ollama pull nomic-embed-text

# Run as a service (systemd)
sudo systemctl enable ollama
sudo systemctl start ollama
```

Set `OLLAMA_BASE_URL` in your environment to point to your Ollama server.
If they're on the same machine: `http://localhost:11434`
If they're on separate machines: `http://your-ollama-server-ip:11434`

**Security:** Do not expose Ollama's port 11434 publicly. Keep it internal
or behind an authenticated proxy.

---

## Common Deployment Failures

**"Module not found" error on Vercel:**
A dependency is in `devDependencies` but is used at runtime. Move it to `dependencies`.

**Environment variables undefined on the server:**
- Did you add them to the hosting platform's dashboard?
- `NEXT_PUBLIC_` variables are baked in at build time — a rebuild is needed after changing them
- Non-`NEXT_PUBLIC_` variables are read at runtime — restart the server after changing them

**Build succeeds locally but fails on CI/Vercel:**
- Check if you have uncommitted files that the build depends on
- Check the Node version — specify it in `package.json`: `"engines": { "node": ">=18" }`
- Check for case sensitivity issues — macOS is case-insensitive, Linux is not
  (`import Button from './button'` fails on Linux if the file is `Button.tsx`)

**Database connection refused:**
- Is the database running?
- Is the connection string correct?
- Does the server's IP need to be whitelisted in the database firewall?
- Supabase: check Project Settings → Database → Connection pooling

**App crashes immediately after deploy ("Application error"):**
Check the hosting platform's logs. Common causes:
- Missing environment variable
- Attempting to connect to a resource that isn't reachable
- A `require`/`import` of a native module that isn't installed on the target OS

---

## Monitoring Basics

**Health check endpoint:** Add `GET /api/health` that returns `{ status: "ok" }`.
Hosting platforms can ping this to detect when your app goes down.

**Error tracking:** Integrate Sentry (free tier) to get alerted when uncaught
errors occur in production and see the full stack trace with context.

**Logging:** Use structured logs (JSON format) so they're searchable:
```js
console.log(JSON.stringify({ level: "error", message: "Payment failed", userId, orderId }));
```

Never log passwords, tokens, card numbers, or other sensitive data.
