# Botardo OS — Mission Control

> Pixel-art AI office (real [Star-Office-UI](https://github.com/ringhyacinth/Star-Office-UI) integrated) + Linear-style task dashboard.
> Next.js 16 App Router + Supabase + Tailwind v4 + shadcn/ui.

![Botardo OS](https://img.shields.io/badge/Botardo-OS-cyan) ![Next.js 16](https://img.shields.io/badge/Next.js-16-black) ![Supabase](https://img.shields.io/badge/Supabase-realtime-green) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## What this is

A single Next.js app that ships **two views** of the same operational truth (Supabase):

| Tab | What it shows | Source |
|-----|---------------|--------|
| **Star Office** | Pixel-art office where each AI agent appears as a character in its zone (desk / sofa / bug zone / meeting room), animated, with speech bubbles. Memo of yesterday on the wall. | The **real** [`ringhyacinth/Star-Office-UI`](https://github.com/ringhyacinth/Star-Office-UI) repo, cloned verbatim into `/public/star-office/` with a 4-line patch to redirect its fetches to our API routes. Phaser 3.80.1 + WebGL. |
| **Mission Control** | Linear/Vercel-style dashboard: backlog of tasks filtered by status/priority/department/agent, KPIs (done today, blocked, active agents, velocity), real-time activity feed, inline task editor with feedback. | Custom Next.js UI with shadcn/ui. |

Both views read/write the same Supabase schema (`agents`, `tasks`, `task_events`, `agent_presence`, `daily_memos`, `cron_jobs`, `departments`).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│  ┌──────────────────────┐  ┌─────────────────────────────┐  │
│  │ Tab: Star Office     │  │ Tab: Mission Control        │  │
│  │ (iframe)             │  │ (Next.js RSC + client)      │  │
│  │  └ Phaser 3.80.1     │  │  └ shadcn/ui components     │  │
│  │  └ pixel-art sprites │  │  └ polling 8-15s            │  │
│  │  └ polls every 1-3s  │  │                             │  │
│  └─────────┬────────────┘  └──────────┬──────────────────┘  │
│            │ fetch /api/star-office/* │ fetch /api/mission/* │
└────────────┼──────────────────────────┼─────────────────────┘
             │                          │
             ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js API routes (App Router)                            │
│  /api/star-office/{status,agents,yesterday-memo,set_state}  │
│  /api/mission/{tasks,agents,departments,events,cron-jobs}   │
│  /api/webhooks/cron  ← z.ai cron jobs POST here             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Data layer: src/lib/data.ts                                │
│  ├─ If NEXT_PUBLIC_SUPABASE_URL set → Supabase client       │
│  └─ Else → mock data (transparent fallback for demos)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              Supabase (Postgres + Realtime)
```

### The Star-Office-UI integration

**This is the key design decision**: instead of "being inspired by" the original repo, we **clone it verbatim** and patch only the data layer.

```bash
# Initial setup (already done, documented here for reproducibility)
git clone https://github.com/ringhyacinth/Star-Office-UI.git /tmp/Star-Office-UI
cp -r /tmp/Star-Office-UI/frontend/* public/star-office/

# Patch: redirect fetches + replace Flask placeholders
python3 scripts/patch-star-office-html.py
```

The patch (`scripts/patch-star-office-html.py`) is idempotent and only changes:
- 4 fetch URLs: `/yesterday-memo`, `/agents`, `/status`, `/set_state` → `/api/star-office/*`
- 35 `/static/` → `/star-office/` references
- 30 `{{VERSION_TIMESTAMP}}` Flask placeholders → real epoch

**Zero bytes of game logic touched.** Phaser, sprites, animations, speech bubbles, guest agent rendering — all original.

To update to a new version of Star-Office-UI:
```bash
cd /tmp/Star-Office-UI && git pull
cp -r /tmp/Star-Office-UI/frontend/* public/star-office/
python3 scripts/patch-star-office-html.py
```

---

## Database schema (Supabase)

Already created by the user. Tables:

| Table | Purpose |
|-------|---------|
| `departments` | Departments of the agent "company" |
| `agents` | Each agent with state, model, provider, dept |
| `tasks` | Tasks with status, priority, source, human feedback |
| `task_events` | Activity feed / audit trail per task |
| `agent_presence` | Live state of each agent for the Star Office UI |
| `daily_memos` | Daily summary ("yesterday memo") for the office |
| `cron_jobs` | Registry of scheduled z.ai jobs |

Enums (stored as text):
- `visual_state`: `idle` | `working` | `researching` | `writing` | `executing` | `syncing` | `error` | `offline`
- `zone`: `desk` | `rest` | `bug_zone` | `meeting` | `offline`
- `status` (tasks): `pending` | `in_progress` | `blocked` | `review` | `done` | `cancelled`
- `priority`: 1 (critical) | 2 (high) | 3 (normal) | 4 (low)

---

## API reference

### Star Office (consumed by the iframe)

| Endpoint | Method | Shape |
|----------|--------|-------|
| `/api/star-office/status` | GET | `{ state, detail, progress, updated_at, officeName }` |
| `/api/star-office/agents` | GET | `Array<{ agentId, name, isMain, state, detail, area, authStatus, updated_at }>` |
| `/api/star-office/yesterday-memo` | GET | `{ success, date, memo }` |
| `/api/star-office/set_state` | POST | `{ state, detail }` → `{ status: "ok" }` |

### Mission Control (consumed by the Next.js dashboard)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mission/tasks` | GET, POST | List with filters / create new |
| `/api/mission/tasks/[id]` | PATCH | Update status, priority, agent, feedback |
| `/api/mission/agents` | GET | List agents |
| `/api/mission/departments` | GET | List departments |
| `/api/mission/events` | GET | Activity feed (last N) |
| `/api/mission/cron-jobs` | GET | List registered cron jobs |

### Webhook (for z.ai cron jobs)

```http
POST /api/webhooks/cron
Content-Type: application/json

{
  "agent_slug": "botardo-prime",
  "event_type": "started" | "progress" | "completed" | "failed",
  "task_id": "uuid-optional",
  "message": "what the agent is doing",
  "payload": { ... }
}
```

The handler:
1. Resolves `agent_slug` → `agent_id`
2. Maps `event_type` → `visual_state` + `zone` (started/progress → working/desk, completed → idle/rest, failed → error/bug_zone)
3. Updates `agent_presence`
4. Appends to `task_events`
5. If `task_id` provided and event is `completed`/`failed`, mutates `tasks.status`

---

## Local development

### Prerequisites
- Node.js 20+ (or Bun)
- A Supabase project (or just run in demo mode with mock data)

### Install & run

```bash
bun install
bun run dev
# → http://localhost:3000
```

### Connect real Supabase

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Restart `bun run dev`. The header badge flips from `DEMO` to `LIVE`.

### Run the schema in Supabase

The user already has the schema. For reference, the expected tables are described above. A seed SQL with the 4 departments + Botardo Prime agent is what makes the office look alive on first load.

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Import it in Vercel
3. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

The `/star-office/` static assets are served from `public/` automatically.

---

## Project structure

```
.
├── public/
│   └── star-office/           ← REAL repo (45 files, 26MB)
│       ├── index.html         ← patched (4 fetch URLs only)
│       ├── *.webp, *.png      ← sprites verbatim
│       ├── fonts/*.woff2      ← ark-pixel verbatim
│       └── vendor/phaser-3.80.1.min.js
├── scripts/
│   └── patch-star-office-html.py  ← idempotent patcher
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── star-office/   ← 4 endpoints matching original repo contract
│   │   │   ├── mission/       ← 6 endpoints for the dashboard
│   │   │   └── webhooks/cron  ← z.ai webhook receiver
│   │   ├── office/            ← iframe wrapper
│   │   ├── mission/           ← standalone route (also reachable via /#mission)
│   │   ├── departments/[slug] ← detail page
│   │   ├── agents/[slug]      ← detail page
│   │   ├── tasks/[id]         ← detail page
│   │   ├── page.tsx           ← hub with tab switching
│   │   └── layout.tsx         ← dark mode forced, pixel font loaded
│   ├── components/
│   │   ├── mission/           ← KPI cards, task card, activity feed, drawers
│   │   └── shared/            ← top nav
│   ├── hooks/
│   │   ├── use-poll.ts        ← polling fetcher
│   │   └── use-hash-state.ts  ← URL hash sync for tabs
│   └── lib/
│       ├── types.ts           ← TypeScript types matching Supabase schema
│       ├── db-types.ts        ← Supabase Database type
│       ├── supabase/          ← client.ts + server.ts
│       ├── mock-data.ts       ← fallback dataset (8 agents, 12 tasks)
│       └── data.ts            ← unified data access layer
└── README.md
```

---

## Credits

- **Star-Office-UI** by [Ring Hyacinth](https://x.com/ring_hyacinth) & [Simon Lee](https://x.com/simonxxoo) — MIT code, non-commercial assets. The pixel office, sprites, and Phaser logic are 100% theirs.
- **Guest character animations** by [LimeZu](https://limezu.itch.io/) — free for non-commercial use.
- **Mission Control dashboard** — original code in this repo, MIT.

## License

- **Code**: MIT (see `LICENSE`)
- **Star-Office-UI assets** (`public/star-office/*.webp`, `*.png`, `fonts/*`): non-commercial only, per the original repo's license. Replace with your own assets for commercial use.

---

## Known limitations

- The asset drawer ("装修房间" button in the office) doesn't work — it depends on Flask endpoints (`/assets/*`, `/config/gemini`) we didn't migrate. The core office renders fine.
- No Supabase Realtime subscriptions yet — both views use HTTP polling (1-15s intervals). Realtime is the next planned upgrade.
- No authentication on the API routes — anyone with the URL can create/edit tasks. Add NextAuth middleware before production.
- The `progress` field in `/status` is always `0` — the original frontend doesn't read it.
