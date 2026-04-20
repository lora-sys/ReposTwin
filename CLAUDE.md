# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

RepoTwin converts GitHub repos into interactive 3D "code galaxies" with an AI agent sidebar. See `prd.md` and `IMPLEMENTATION.md` for full plan before writing any code.

## Architecture

```
repotwin/
├── repostwin/          # Next.js 16 frontend (App Router)
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React components
│   └── lib/            # Utilities
├── backend/            # FastAPI (not yet created)
├── e2e/                # Playwright E2E specs (not yet created)
└── plans/              # Phase plans
```

**Note:** The actual Next.js project lives in `repostwin/`, NOT `frontend/`. The plan docs reference `frontend/` but the repo has no such directory — this was the original plan sketch.

## Dev Commands

```bash
cd repostwin
npm run dev      # start dev server (port 3000)
npm run build    # production build
npm run lint     # ESLint
```

## Key Constraints

- **Next.js 16.2.4** — significant breaking changes from prior versions. Read `repostwin/@AGENTS.md` before writing any Next.js code. The `@AGENTS.md` at the top of page.tsx triggers this rule file automatically.
- **No `frontend/` directory** — the plan docs write `frontend/` but the actual code is in `repostwin/`. When the plan says `frontend/`, read it as `repostwin/`.
- **Backend not created yet** — `backend/` does not exist. API routes in Next.js (`app/api/`) will proxy to FastAPI once it's built.