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

## Completed Phases

- **Phase 0**: Static galaxy demo (hardcoded data, no backend)
- **Phase 1a**: Aceternity hero components (BackgroundBeams, TypewriterEffect)
- **Phase 1b**: FastAPI backend (parse, summarize, repo-info endpoints)
- **Phase 2**: Interactive 3D galaxy (Monaco editor, AI summary, node detail card)
- **Phase 3**: AI chat sidebar with 3D highlight联动
- **Phase 4**: Unified LLM config (cloud OpenAI-compatible + local Ollama via env vars)

## Backend Commands

```bash
cd backend
uv sync                    # install dependencies
cp .env.example .env        # configure LLM (optional)
uv run uvicorn main:app --reload --port 8000
```

## LLM Configuration (backend/.env.example)

| Variable | Default | Description |
|---|---|---|
| `LLM_PROVIDER` | `auto` | `auto` \| `openai` \| `ollama` \| `heuristic` |
| `OPENAI_API_KEY` | — | API key for OpenAI-compatible providers |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible endpoint |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model name |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server |
| `OLLAMA_MODEL` | `llama3.2` | Ollama model |

**Auto mode**: uses cloud if `OPENAI_API_KEY` set, else Ollama if running, else heuristic.