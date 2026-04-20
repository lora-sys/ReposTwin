# RepoTwin 实现方案

> 本文档是 `prd.md` 的技术落地指南。Agent 读取此文件即可开始实施。
> 每个模块标注了 [[MCP]] 和 [[SKILL]] 调用点，可直接加载对应能力。

---

## 一、项目结构

```
repotwin/
├── frontend/              # Next.js 15 (App Router)
│   ├── app/
│   │   ├── page.tsx       # 首页：Hero Section（落地页，Phase 1 核心交付物）
│   │   ├── loading.tsx   # Next.js 全局 Loading 过渡页
│   │   ├── galaxy/        # 3D 星系视图页
│   │   └── api/           # 调后端 FastAPI
│   ├── components/
│   │   ├── ui/           # Aceternity 组件（安装后存放）
│   │   │   └── loader/   # Multi-Step Loading 组件
│   │   ├── galaxy/       # R3F 3D 渲染组件
│   │   ├── chat/         # Agent 交互侧边栏
│   │   └── detail/       # 代码详情卡片
│   └── lib/
│       └── api.ts        # fetch 封装
├── backend/              # FastAPI
│   ├── main.py           # 入口
│   ├── parser.py         # AST 解析（tree-sitter）
│   ├── graph.py          # nodes/edges 生成
│   └── llm.py            # LLM 调用封装
└── e2e/                  # [[NEW]] agent-browser E2E 测试
    ├── phase1-hero.spec.ts
    ├── phase2-galaxy.spec.ts
    └── phase3-chat.spec.ts
```

---

## 二、Phase 1 — 骨架搭建（Week 1）

> [[SKILL: next-best-practices]] — Next.js App Router 文件约定、RSC 边界、metadata、路由处理
> [[SKILL: frontend-dev]] — Tailwind 动画最佳实践、Framer Motion 实现细节
> [[SKILL: vercel-react-best-practices]] — React/Next.js 性能优化指南

### 2.1 前端初始化

**步骤：**
1. `npx create-next-app@latest frontend --typescript --tailwind --app`
2. 安装基础依赖：`npm install motion clsx tailwind-merge framer-motion`
3. 安装 R3F：`npm install @react-three/fiber @react-three/drei three`
4. 安装 force-graph：`npm install react-force-graph-3d`
5. 安装 Monaco：`npm install @monaco-editor/react`

> **[[MCP: aceternityui-mcp]]** 启动后第一步：用 `search_components` 查每个组件的安装命令

### 2.2 后端初始化

> [[SKILL: fullstack-dev]] — FastAPI 项目初始化、路由设计、错误处理

**步骤：**
1. `mkdir backend && cd backend`
2. `uv init --python 3.11`
3. `uv add fastapi uvicorn tree-sitter tree-sitter-python tree-sitter-javascript langchain langchain-deepseek`

### 2.3 Hero 落地页（Phase 1 核心交付物）

> [[SKILL: ui-ux-pro-max]] — 设计风格指南（玻璃拟态 / 科技感）
> [[MCP: aceternityui-mcp]] — `search_components("hero")` 获取 Hero 组件安装命令

**文件：** `frontend/app/page.tsx`

用户访问网站首先看到的全屏落地页，包含：
- 全屏动态背景（星系/粒子/渐变）
- 大标题 + 副标题
- 仓库 URL 输入框（核心 CTA）
- Aceternity Hero 组件参考：`search_components("hero")`

输入仓库 URL → 点击分析 → 跳转到 `/galaxy` 页面

> 对应 PRD 描述："用户输入 GitHub 仓库 URL → Multi-Step Loader → 进入 3D 星系视图"

**设计参考：** [[SKILL: ui-ux-pro-max]] → 搜索 "glassmorphism" / "科技感" 风格指南

### 2.4 Loading 过渡页（Phase 1）

**文件：** `frontend/app/loading.tsx`

Next.js 全局 Loading 过渡页 — 路由切换时显示（不是 Hero 页面本身）。

### 2.5 AST 解析脚本

> [[SKILL: codebase-inspection]] — 查 code analysis、AST 遍历模式

**文件：** `backend/parser.py`

```python
from tree_sitter import Language, Parser
Language.build_library('build/my-languages.so',
    ['tree-sitter-python', 'tree-sitter-javascript'])
```

**输出格式：**
```json
{"nodes": [{"id": "auth.py", "group": "auth", "size": 3}],
 "links": [{"source": "main.py", "target": "auth.py", "type": "import"}]}
```

> **关键决策**：用 tree-sitter 而非 Python `ast`，因为要同时支持 JS/TS/Python 多语言。

### 2.5 Phase 1 E2E 测试

> [[SKILL: agent-browser]] — E2E 测试脚本编写参考
> [[MCP: playwright]] — 已全局安装，用于浏览器自动化测试

**测试目标：** `http://localhost:3000` 首页加载 + Loading 状态正常

**E2E 测试脚本：** `e2e/phase1-hero.spec.ts`

```bash
# 启动开发服务器（后台）
cd frontend && npm run dev &
sleep 5

# agent-browser E2E 验证
agent-browser open http://localhost:3000
agent-browser wait --load networkidle
agent-browser snapshot -i
# 验证 Hero 背景、标题、输入框存在
agent-browser screenshot phase1-hero-baseline.png

# 触发 loading（输入仓库 URL）
agent-browser fill @e1 "https://github.com/facebook/react"
agent-browser press Enter
agent-browser wait 2000
agent-browser screenshot phase1-loading.png
# 验证 Multi-Step Loader 出现
```

**验收标准：**
- [ ] Hero Section 渲染正常（背景 + 标题 + 输入框）
- [ ] Loading 页面显示加载步骤（至少 3 个阶段）
- [ ] Loading 完成后跳转到 /galaxy 页面

---

## 三、Phase 2 — 视觉注入（Week 2）

### 3.1 Module 1：Hero Section

> [[SKILL: ui-ux-pro-max]] — glassmorphism（毛玻璃）设计风格参考
> [[SKILL: frontend-dev]] — Tailwind + Framer Motion 动画实现细节
> [[MCP: aceternityui-mcp]] — `search_components` 查每个子组件

**Aceternity 组件速查：**

| 功能 | 组件 | MCP 查询 |
|------|------|---------|
| 背景 | Background Beams | `search_components("background beams")` |
| 标题动画 | Typewriter Effect | `search_components("typewriter")` |
| 输入框 | Placeholders And Vanish Input | `search_components("vanish input")` |

**文件：** `components/ui/hero/` — Hero Section 组件集

### 3.2 Module 2：3D 代码星系

> [[SKILL: shader-dev]] — WebGL/GLSL 着色器知识，R3F 自定义 shader 时需要
> [[SKILL: architecture-diagram]] — 生成系统架构图（可选，用于文档）

**技术实现（无 Aceternity，纯 R3F）：**
- `components/galaxy/ForceGraph3D.tsx` — react-force-graph-3d 封装
- `components/galaxy/NodeLabel.tsx` — 鼠标悬停显示文件名
- `app/galaxy/page.tsx` — 页面容器

> **[[MCP: github]]** — clone 后查仓库 metadata（star、language、README）

**数据流向：**
```
用户输入 repo URL
  → POST /api/parse { repo_url }
  → FastAPI clone + tree-sitter parse
  → 返回 { nodes, links }
  → ForceGraph3D 渲染
```

### 3.3 Module 3：Agent 交互侧边栏

> [[SKILL: ui-ux-pro-max]] — glassmorphism 毛玻璃面板设计指南

**文件：** `components/chat/ChatSidebar.tsx`

- 毛玻璃面板（`backdrop-filter: blur`）
- 聊天气泡 + Framer Motion 弹性动画
- `app/api/chat/route.ts` — 前端 → FastAPI `/chat`

### 3.4 Module 4：代码详情卡片

> [[MCP: aceternityui-mcp]] — `search_components("3d card")` 查 Glare Card
> [[SKILL: frontend-dev]] — 动画交互细节

**文件：** `components/detail/CodeCard.tsx`

- Aceternity 3D Card Effect / Glare Card
- Monaco Editor 内嵌代码显示
- LLM 生成的文件总结（`/api/summarize`）

### 3.5 Phase 2 E2E 测试

> [[SKILL: agent-browser]] — E2E 测试
> [[MCP: playwright]] — 已全局安装

**测试目标：** `/galaxy` 页面 3D 渲染 + 点击节点显示详情卡片

**E2E 测试脚本：** `e2e/phase2-galaxy.spec.ts`

```bash
# 进入 3D 星系页面
agent-browser open http://localhost:3000/galaxy?repo=facebook/react
agent-browser wait --load networkidle
agent-browser wait 3000  # 等 3D 渲染
agent-browser screenshot phase2-galaxy-3d.png

# 点击一个节点
agent-browser snapshot -i
agent-browser click @e<node>  # 某个 3D 节点
agent-browser wait 1000
agent-browser snapshot -i
# 验证详情卡片弹出（CodeCard 组件）
agent-browser screenshot phase2-detail-card.png
```

**验收标准：**
- [ ] 3D 星系图正常渲染（节点 + 连线）
- [ ] 鼠标悬停显示文件名
- [ ] 点击节点弹出详情卡片（包含代码 + 总结）

---

## 四、Phase 3 — 灵魂注入（Week 3）

### 4.1 LLM 接入

> [[SKILL: dspy]] — LangChain/LlamaIndex 的声明式 AI 系统构建方式参考
> [[SKILL: llama-cpp]] — Ollama 本地推理（后续从 DeepSeek API 迁移）

**后端 `backend/llm.py`：** 快速跑通用 DeepSeek API，后续切换 Ollama。

### 4.2 流式对话 + 3D 联动

> [[SKILL: fullstack-dev]] — SSE 流式响应实现，FastAPI + Next.js 联调

**3D 联动机制：**
```typescript
const mentionedFiles = extractFileNames(agentReply);
mentionedFiles.forEach(file => {
  forceGraph.emit('highlight', { nodeId: file, color: '#ff0000' });
});
```

### 4.3 Phase 3 E2E 测试

> [[SKILL: agent-browser]] — E2E 测试
> [[MCP: playwright]] — 已全局安装

**测试目标：** Agent 对话 + 3D 节点高亮联动

**E2E 测试脚本：** `e2e/phase3-chat.spec.ts`

```bash
# 打开 Chat 侧边栏
agent-browser open http://localhost:3000/galaxy
agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser fill @e<chat_input> "登录逻辑在哪里？"
agent-browser click @e<send_button>
agent-browser wait 5000  # 等 LLM 响应
agent-browser snapshot -i
# 验证 Agent 回复出现 + 3D 节点高亮
agent-browser screenshot phase3-chat-response.png
```

**验收标准：**
- [ ] Agent 回复正常显示
- [ ] 3D 视图中相关文件节点高亮（红色闪烁）
- [ ] Camera 平滑推进到高亮节点

### 4.4 向量数据库（Phase 3 之后扩展）

> [[SKILL: dspy]] — RAG 系统构建参考（后续接 ChromaDB 向量检索）

**当前方案**：暂时不做全文检索，先用 AST 结构问答。
**后续扩展**：`backend/vectorstore.py` — ChromaDB 存代码块向量，接 `RetrievalQA` 链。

---

## 五、MCP / SKILL 完整速查表

### PRD 技术栈 → 工具映射

| PRD 技术栈 | 对应工具 | 调用方式 | 用途 |
|-----------|---------|---------|------|
| Next.js App Router | [[SKILL: next-best-practices]] | `skill_view("next-best-practices")` | 文件约定、RSC 边界、metadata |
| Next.js / React 性能 | [[SKILL: vercel-react-best-practices]] | `skill_view("vercel-react-best-practices")` | React 性能优化 |
| Tailwind + Framer Motion | [[SKILL: frontend-dev]] | `skill_view("frontend-dev")` | 动画实现、设计质量 |
| Aceternity UI 组件 | [[MCP: aceternityui-mcp]] | 已在全局安装 ✅ | 查组件安装命令、使用示例 |
| FastAPI 后端 | [[SKILL: fullstack-dev]] | `skill_view("fullstack-dev")` | 项目初始化、API 设计、流式响应 |
| GitHub 仓库操作 | [[MCP: github]] | 已在全局安装 ✅ | 查仓库 metadata、star、language |
| WebGL / GLSL 着色器 | [[SKILL: shader-dev]] | `skill_view("shader-dev")` | R3F 自定义 shader |
| 代码分析 / AST | [[SKILL: codebase-inspection]] | `skill_view("codebase-inspection")` | tree-sitter 遍历模式 |
| LLM / RAG 系统 | [[SKILL: dspy]] | `skill_view("dspy")` | 声明式 AI 系统构建 |
| Ollama 本地推理 | [[SKILL: llama-cpp]] | `skill_view("llama-cpp")` | 模型推理、Ollama 部署 |
| UI 设计风格 | [[SKILL: ui-ux-pro-max]] | `skill_view("ui-ux-pro-max")` | glassmorphism、设计系统、科技感 |
| 系统架构图 | [[SKILL: architecture-diagram]] | `skill_view("architecture-diagram")` | 项目架构可视化 |
| E2E 浏览器测试 | [[SKILL: agent-browser]] | `skill_view("agent-browser")` | 自动化 E2E 测试脚本 |
| E2E Playwright | [[MCP: playwright]] | 已在全局安装 ✅ | Playwright MCP（测试执行） |

### 阶段 × 工具使用矩阵

| 阶段 | 任务 | 工具 |
|------|------|------|
| Phase 1 | 初始化 Next.js | [[SKILL: next-best-practices]] + [[SKILL: vercel-react-best-practices]] |
| Phase 1 | Loading 页面设计 | [[SKILL: ui-ux-pro-max]] + [[MCP: aceternityui-mcp]] |
| Phase 1 | 安装 Aceternity 组件 | [[MCP: aceternityui-mcp]] |
| Phase 1 | 初始化 FastAPI | [[SKILL: fullstack-dev]] |
| Phase 1 | tree-sitter AST 解析 | [[SKILL: codebase-inspection]] |
| Phase 1 | **E2E 测试** | [[SKILL: agent-browser]] + [[MCP: playwright]] |
| Phase 2 | Hero Section 动画 | [[SKILL: frontend-dev]] + [[MCP: aceternityui-mcp]] |
| Phase 2 | Chat 侧边栏设计 | [[SKILL: ui-ux-pro-max]] |
| Phase 2 | 3D 可视化 / shader | [[SKILL: shader-dev]] |
| Phase 2 | GitHub 仓库验证 | [[MCP: github]] |
| Phase 2 | **E2E 测试** | [[SKILL: agent-browser]] + [[MCP: playwright]] |
| Phase 3 | LLM 接入 | [[SKILL: dspy]] |
| Phase 3 | 流式 SSE 联调 | [[SKILL: fullstack-dev]] |
| Phase 3 | **E2E 测试** | [[SKILL: agent-browser]] + [[MCP: playwright]] |
| Phase 3+ | Ollama 本地化 | [[SKILL: llama-cpp]] |

---

## 六、API 设计

### 后端路由（FastAPI）

| 方法 | 路径 | 功能 |
|------|------|------|
| `POST` | `/api/parse` | 接收 repo_url，clone + AST 解析，返回 `{ nodes, links }` |
| `GET` | `/api/summarize?file=path` | 读取文件，LLM 生成一句话总结 |
| `POST` | `/api/chat` | 流式对话，`{"messages": []}` |
| `GET` | `/api/repo-info?url=xxx` | GitHub MCP 查仓库 metadata |

### 前端 API 层

```typescript
// frontend/lib/api.ts
export const api = {
  parseRepo: (url: string) => fetch('/api/parse', { method: 'POST', body: JSON.stringify({ url }) }),
  summarize: (file: string) => fetch(`/api/summarize?file=${file}`),
  chat: (messages: any[]) => fetch('/api/chat', { method: 'POST', body: JSON.stringify({ messages }), headers: { 'Content-Type': 'application/json' } }),
}
```

---

## 七、核心文件清单

| 文件 | Phase | 工具依赖 | 备注 |
|------|-------|---------|------|
| `frontend/app/page.tsx` | 1 | [[SKILL: ui-ux-pro-max]] + [[MCP: aceternityui-mcp]] | Hero 落地页（首页） |
| `frontend/app/loading.tsx` | 1 | Next.js | 路由切换过渡页 |
| `frontend/components/ui/hero/` | 1-2 | [[MCP: aceternityui-mcp]] + [[SKILL: frontend-dev]] | 背景 + 打字机 + 输入框 |
| `frontend/components/ui/loader/` | 1-2 | [[MCP: aceternityui-mcp]] + [[SKILL: frontend-dev]] | Multi-Step Loader |
| `frontend/components/galaxy/ForceGraph3D.tsx` | 2 | [[SKILL: shader-dev]] | 3D 可视化核心 |
| `frontend/components/chat/ChatSidebar.tsx` | 2 | [[SKILL: ui-ux-pro-max]] | 毛玻璃面板 |
| `frontend/components/detail/CodeCard.tsx` | 2 | [[MCP: aceternityui-mcp]] + [[SKILL: frontend-dev]] | 3D 卡片 + Monaco |
| `backend/main.py` | 1 | [[SKILL: fullstack-dev]] | FastAPI 入口 |
| `backend/parser.py` | 1 | [[SKILL: codebase-inspection]] | tree-sitter AST 解析 |
| `backend/llm.py` | 3 | [[SKILL: dspy]] + [[SKILL: llama-cpp]] | LLM 封装 |
| `e2e/phase1-hero.spec.ts` | 1 | [[SKILL: agent-browser]] + [[MCP: playwright]] | Hero + Loading E2E |
| `e2e/phase2-galaxy.spec.ts` | 2 | [[SKILL: agent-browser]] + [[MCP: playwright]] | 3D 视图 + 详情卡片 E2E |
| `e2e/phase3-chat.spec.ts` | 3 | [[SKILL: agent-browser]] + [[MCP: playwright]] | 对话 + 3D 联动 E2E |

---

## 八、已知风险与备选方案

| 风险 | 应对 |
|------|------|
| Aceternity UI 是付费 pro 组件 | 先用免费组件跑通，pro 组件用 placeholder 替代 |
| GitHub clone 需要权限/速度慢 | 先用本地仓库测试，[[MCP: github]] 查 metadata |
| LLM API 费用 | Phase 3 后期切换 [[SKILL: llama-cpp]] Ollama 本地推理 |
| 3D 渲染性能（万级节点） | `react-force-graph-3d` 支持 WebGL LOD，社区方案降级 |
| 多语言 AST 支持 | tree-sitter 支持 Python/JS/TS/Go/Rust 等，parser.py 按需添加 language |
| E2E 测试稳定性 | [[SKILL: agent-browser]] `wait --load networkidle` 代替固定 sleep |
