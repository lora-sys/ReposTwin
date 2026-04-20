# Plan: RepoTwin — GitHub 仓库 3D 数字孪生助手

> Source PRD: `prd.md` + `IMPLEMENTATION.md`

## Architectural Decisions

- **Routes**:
  - `/` — Hero landing page
  - `/loading` — route-transition loading screen
  - `/galaxy` — 3D code galaxy view (`?repo=<url>`)
  - `/api/parse` — POST — clone + AST → `{ nodes, links }`
  - `/api/summarize` — GET `?file=<path>` — LLM file summary
  - `/api/chat` — POST — streaming chat `{ messages: [] }`
  - `/api/repo-info` — GET `?url=<github-url>` — repo metadata
- **Schema**: nodes/links JSON from backend; chat messages array on frontend
- **Key models**: `Node { id, group, size }`, `Link { source, target, type }`, `Message { role, content }`
- **3D engine**: react-force-graph-3d (R3F wrapper), no Aceternity in canvas
- **AI**: DeepSeek API first → Ollama local later (SSE streaming)
- **Parser**: tree-sitter (Python/JS/TS), single `build/my-languages.so`

---

## Phase 0: Static Galaxy Demo

**User stories**: Hero → loading → 3D graph with placeholder data

### What to build

Pure frontend tracer bullet — no backend required.

- `frontend/app/page.tsx`: Hero section with animated background + URL input
- `frontend/app/loading.tsx`: Multi-step loading page
- `frontend/app/galaxy/page.tsx`: 3D force-graph page with **hardcoded static JSON** (react-force-graph-3d)
- `frontend/components/galaxy/ForceGraph3D.tsx`: R3F wrapper, static data input
- E2E: enter any URL → loading → 3D graph renders with demo nodes

### Acceptance criteria

- [ ] Hero full-screen background renders (Aceternity or CSS animation)
- [ ] Typewriter title + vanishing-input GitHub URL field visible
- [ ] Enter URL → route to `/galaxy` via loading transition
- [ ] 3D graph shows ≥10 nodes + edges (static data)
- [ ] Hover node → tooltip shows filename
- [ ] Click node → detail card placeholder appears

---

## Phase 1a: Frontend Scaffold (Hero + Aceternity)

**User stories**: Phase 1 hero section with real Aceternity components

### What to build

Replace Phase 0 placeholders with real Aceternity UI components.

- Install Aceternity UI via MCP (`search_components`)
- Replace background with `Background Beams` or `Sparkles Core`
- Replace input with `Placeholders And Vanish Input`
- Add `Typewriter Effect` for title
- Phase 1 E2E: hero component render validation

### Acceptance criteria

- [ ] Aceternity hero components install without errors
- [ ] Background beams / sparkles animate on `/`
- [ ] Input accepts text, clears on submit
- [ ] Vanish animation plays on enter

---

## Phase 1b: Backend Skeleton (FastAPI + Parser)

**User stories**: FastAPI backend serving static + live parseable data

### What to build

- `backend/main.py`: FastAPI entry, CORS, health endpoint
- `backend/parser.py`: tree-sitter setup + `parse_repo(url) → { nodes, links }`
- `backend/graph.py`: nodes/links transformation
- `/api/parse` POST endpoint: accepts `{ url }`, returns `{ nodes, links }`
- `frontend/lib/api.ts`: fetch wrapper for all backend calls
- Swap static JSON in galaxy page → live API call

### Acceptance criteria

- [ ] `uvicorn backend/main.py` starts without errors
- [ ] `POST /api/parse` returns valid `{ nodes, links }` JSON
- [ ] Frontend galaxy page renders real data from API
- [ ] Backend handles invalid URL with 400 error

---

## Phase 2: Interactive 3D Galaxy

**User stories**: Full 3D interactions + code detail cards

### What to build

- `frontend/components/galaxy/NodeLabel.tsx`: hover tooltip
- `frontend/components/detail/CodeCard.tsx`: Aceternity `Glare Card` / `3D Card Effect` + Monaco Editor
- Camera fly-to on node click (R3F camera controls)
- `GET /api/summarize?file=<path>`: LLM-generated one-line summary (mock or real)
- Phase 2 E2E: click node → detail card with code + summary

### Acceptance criteria

- [ ] 3D graph renders with real node/link data from Phase 1b
- [ ] Hover shows filename tooltip
- [ ] Click node → camera smoothly flies to node
- [ ] Detail card appears with Monaco code + LLM summary
- [ ] `backdrop-filter: blur` glassmorphism on card panel

---

## Phase 3: AI Chat + 3D Highlight

**User stories**: Agent sidebar + 3D node highlight联动

### What to build

- `frontend/components/chat/ChatSidebar.tsx`: glassmorphism panel + Framer Motion bubbles
- `backend/llm.py`: DeepSeek API wrapper (SSE streaming)
- `POST /api/chat`: streaming response endpoint
- 3D联动: extract filenames from agent reply → emit `highlight` event → node flashes red + camera fly-to
- Phase 3 E2E: ask "login logic where?" → response + red node highlight

### Acceptance criteria

- [ ] Chat input sends message → SSE stream renders token-by-token
- [ ] Agent reply contains at least one filename reference
- [ ] Referenced node turns red + flashes (CSS animation or R3F material)
- [ ] Camera smoothly transitions to highlighted node
- [ ] `/api/repo-info` returns GitHub metadata (stars, language, README)

---

## Phase 4: Ollama Local + Vector Store (Future)

**User stories**: Offline-capable, local LLM inference

### What to build

- Replace DeepSeek API → Ollama local inference (`llama-cpp` skill)
- Add ChromaDB vector store for code chunk retrieval (`backend/vectorstore.py`)
- `RetrievalQA` chain for context-grounded answers

### Acceptance criteria

- [ ] Ollama serves `/api/chat` without external API calls
- [ ] Code chunks stored in ChromaDB, retrieved by similarity
- [ ] Agent answers reference actual code with file paths
