# AI Mentor (Open Source MVP)

A voice-first, multimodal AI mentor for students — implements all four phases
of the original roadmap. 100% open-source stack, no paid API keys required to
run locally.

This delivers **all four phases** from the original roadmap on a single open-source
stack:

- **Phase 1 — Voice-first mentor:** text + voice chat, RAG-grounded answers
- **Phase 2 — Seeing:** in-browser webcam facial-expression detection (`face-api.js`),
  fed into the LLM prompt as soft tone guidance (never sent to a server)
- **Phase 3 — Face-to-face:** a lightweight, dependency-free SVG "talking avatar"
  that animates its mouth while the mentor speaks and changes expression based on
  detected student sentiment and the active persona — no paid D-ID/HeyGen needed
- **Phase 4 — Expert system:** switchable personas (Coding Mentor, Product Manager,
  Senior Dev, Frustrated Client) for industry role-play, a 3-panelist **Oral Defense
  Mode** that rotates through Prof. Theory / Prof. Code / Prof. System Design, and
  an analytics dashboard (`/dashboard`) summarizing session-level frustration/
  engagement signal

## Stack

| Layer                   | Tech                                                                                      | Why                                                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend                | Next.js 14 (App Router) + Tailwind                                                        | React-based, fast, free                                                                                                                            |
| LLM ("the brain")       | [Ollama](https://ollama.com) running Llama 3.1                                            | Open source, runs locally, no API key                                                                                                              |
| Speech-to-text          | [Transformers.js](https://huggingface.co/docs/transformers.js) (Whisper-tiny, in-browser) | Open source, runs client-side, no server cost                                                                                                      |
| Text-to-speech          | Browser `SpeechSynthesis` API                                                             | Free, zero setup. Swap for [Piper](https://github.com/rhasspy/piper) or [Coqui TTS](https://github.com/coqui-ai/TTS) server-side for custom voices |
| Webcam sentiment        | [face-api.js](https://github.com/justadudewhohacks/face-api.js)                           | Open source (MIT), runs fully client-side, no frames leave the browser                                                                             |
| Avatar                  | Hand-rolled SVG, no model weights                                                         | Zero dependency, works everywhere, easy to restyle                                                                                                 |
| Database + vector store | [Supabase](https://supabase.com) Postgres + pgvector                                      | Open source (self-hostable) or free tier                                                                                                           |
| RAG embeddings          | Ollama `nomic-embed-text`                                                                 | Open source, local                                                                                                                                 |

## Prerequisites

1. **Node.js** 18+
2. **Ollama** installed locally ([install instructions](https://ollama.com/download))
   ```bash
   ollama pull llama3.1
   ollama pull nomic-embed-text
   ollama serve   # usually starts automatically
   ```
3. **Supabase project** — either:
   - Free hosted project at [supabase.com](https://supabase.com), or
   - Self-hosted via the official [Supabase Docker setup](https://github.com/supabase/supabase/tree/master/docker) (fully open source)

## Setup

```bash
git clone <your-repo-url> ai-mentor
cd ai-mentor
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY from your Supabase project settings
```

### 1. Create the database schema

In the Supabase SQL editor (or `psql`), run:

```bash
supabase/schema.sql
```

This enables `pgvector` and creates `students`, `sessions`, `messages`,
`documents`, and the `match_documents` similarity-search function.

> ⚠️ The schema ships with permissive RLS policies (`using (true)`) so the
> MVP works out of the box. Tighten these before any real deployment —
> e.g. restrict `students`/`sessions`/`messages` to the owning user via
> `auth.uid()`.

### 2. (Optional) Seed the knowledge base

Drop `.md`/`.txt` files into `scripts/knowledge-base/` (a sample Stripe
debugging brief is included), then:

```bash
npm run ingest
```

This embeds each file with Ollama and stores it in `documents` for RAG.

### 3. (Optional) Enable webcam sentiment (Phase 2)

Download the open-source `face-api.js` model weights into `public/models`
(small files, MIT licensed):

```bash
mkdir -p public/models
cd public/models
for f in tiny_face_detector_model-weights_manifest.json tiny_face_detector_model-shard1 \
         face_expression_model-weights_manifest.json face_expression_model-shard1; do
  curl -fSLO "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/$f"
done
cd ../..
```

Without this step, the app still works fine — the "Enable webcam sentiment"
button will just report itself unavailable and the mentor runs on
text/voice only.

### 4. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`, click **Start a Mentor Session**, then either
type or click 🎤 to talk to your mentor. Switch personas from the dropdown to
practice industry role-play (Product Manager, Senior Dev, Frustrated Client),
or click **Start Oral Defense Panel** to be questioned in turn by three
panelist personas. Visit `/dashboard` to see session-level analytics.

## Project structure

```
app/
  page.tsx                 landing page
  mentor/page.tsx          session start + chat UI
  dashboard/page.tsx        Phase 4 analytics dashboard
  api/chat/route.ts        LLM call + RAG + sentiment + message persistence
  api/rag/ingest/route.ts  embed & store a single doc
  api/rag/query/route.ts   ad-hoc RAG similarity search
  api/session/route.ts     create student + session records
  api/analytics/route.ts   aggregate sentiment/session data for the dashboard
components/
  VoiceChat.tsx             mic capture, in-browser Whisper STT, TTS, chat UI,
                             persona switching, oral defense mode
  Avatar.tsx                Phase 3: dependency-free animated SVG talking avatar
  WebcamSentiment.tsx       Phase 2: face-api.js webcam expression detection
lib/
  supabase.ts               browser + server Supabase clients
  ollama.ts                 chat + embeddings wrapper around Ollama
  rag.ts                    pgvector similarity search helper
  personas.ts               Phase 4: persona system prompts, voice tuning, colors
supabase/
  schema.sql                full DB schema incl. pgvector + RLS
scripts/
  ingest.ts                 bulk knowledge-base loader
  knowledge-base/           drop .md/.txt files here
public/models/               face-api.js model weights (you download these, see step 3)
```

## Roadmap status

- **Phase 1 — Voice-first mentor:** ✅ done
- **Phase 2 — Webcam sentiment:** ✅ done (`face-api.js`, fully client-side)
- **Phase 3 — Talking avatar:** ✅ done (lightweight SVG avatar; swap in
  SadTalker/Wav2Lip self-hosted if you want photorealism later)
- **Phase 4 — Multi-persona role-play + oral defense + analytics:** ✅ done

Ideas for further extension: persist defense-mode transcripts as a
downloadable PDF report; add a teacher/admin auth layer (Supabase Auth) so
`/dashboard` isn't publicly reachable; replace browser TTS with self-hosted
Piper for a more natural, persona-specific voice.

## Pushing to GitHub

```bash
cd ai-mentor
git init
git add .
git commit -m "Initial AI Mentor MVP: voice chat + RAG on open-source stack"
git branch -M main
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

`.env.local` is already gitignored — double check before pushing that no
real keys are committed.
