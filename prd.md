🚀 产品需求文档 (PRD)：RepoTwin - GitHub 仓库 3D 数字孪生助手
1. 产品概述
RepoTwin 是一款结合了 3D 可视化与大模型（LLM）的智能代码库浏览器。它将传统的、扁平的 GitHub 目录结构转化为立体的“代码星系”，并配备专属的 AI Agent。用户不仅能“看”到代码的全局架构，还能直接向 Agent 提问（例如“登录逻辑在哪里”、“这几个文件是怎么关联的”），Agent 会结合 3D 视图进行高亮联动解答。

核心价值（Why build this?）：
跳出传统“增删改查”项目的内卷泥潭。通过融合静态代码分析 (AST)、3D 图形学和 LLM Agent 编排，打造一个真正具备前沿技术深度的全栈作品。
## 二、技术栈选型

前端框架： Next.js (App Router) + React
> [[SKILL: next-best-practices]] — Next.js 文件约定、RSC 边界、metadata

3D 引擎： React Three Fiber (R3F) + Drei + 3d-force-graph
> [[SKILL: shader-dev]] — WebGL/GLSL 着色器知识（3D 自定义效果时需要）

UI/样式： Tailwind CSS + Aceternity UI + Framer Motion
> [[MCP: aceternityui-mcp]] — 已全局安装，用 `search_components` 查每个组件的安装命令

后端/数据处理： Python (FastAPI) + tree-sitter 库
> [[SKILL: fullstack-dev]] — FastAPI 初始化、路由设计、流式响应

AI 引擎： LangChain/LlamaIndex + 本地大模型 (Ollama) 或 云端 API (DeepSeek/GPT-4o)
> [[SKILL: dspy]] — 声明式 AI 系统构建参考
> [[SKILL: llama-cpp]] — Ollama 本地推理（Phase 3 后期切换）

3. 核心功能与 UI 映射 (结合 Aceternity)
模块一：首页与仓库输入 (The Hero Section)

功能描述： 用户进入主页，看到极具科技感的背景，并在输入框中粘贴目标 GitHub 仓库的 URL。

Aceternity 组件应用：

背景： 使用 Background Beams 或 Sparkles Core 营造代码在数字空间中流动的氛围。

标题： 使用 Typewriter Effect (打字机特效) 逐字打出：“探索你的代码星系”。

输入框： 使用 Placeholders And Vanish Input，输入 GitHub 链接后按回车，链接化作粒子消散，极具视觉冲击力。

加载状态： 点击解析后，弹出 Multi-Step Loader，显示装逼且真实的加载步骤："正在克隆仓库... -> 正在生成抽象语法树 (AST)... -> 注入向量数据库... -> 渲染 3D 拓扑..."。
> 设计风格参考：[[SKILL: ui-ux-pro-max]] — glassmorphism、科技感风格指南
> 组件安装：[[MCP: aceternityui-mcp]] `search_components("loader")` 获取 Multi-Step Loader

模块二：3D 代码星系视图 (The Core Feature)

功能描述： 占据屏幕 70% 空间的 3D 交互区。

节点 (Node)： 球体代表文件。体积越大，代码行数越多。

连线 (Edge)： 代表 import 或函数调用关系。

交互： 鼠标悬浮显示文件名，点击节点聚焦放大，并触发模块四。

技术实现： 纯 R3F 和 react-force-graph-3d 实现，Aceternity 不参与此 Canvas 内部渲染。

模块三：AI Agent 交互侧边栏 (The Chat Assistant)

功能描述： 屏幕右侧（或左侧）悬浮的对话框，用户可以在这里向 Agent 提问。

功能联动： 当 Agent 回答“核心鉴权逻辑在 auth.py”时，前端监听到关键词，3D 视图中的 auth.py 节点会自动变成红色并剧烈闪烁，镜头平滑推进 (Camera fly-to)。

Aceternity 组件应用：

整体侧边栏可以使用稍微定制的透明毛玻璃面板 (Glassmorphism)。

聊天气泡出来时，配合 Framer Motion 的弹性动画。

模块四：代码详情卡片 (Code Detail Panel)

功能描述： 当用户在 3D 空间点击某个节点时，弹出的详情浮层。显示该文件的代码预览和 Agent 自动生成的总结。

Aceternity 组件应用：

使用 3D Card Effect 或 Glare Card。用户鼠标在卡片上移动时，卡片会有真实的物理倾斜和反光效果，里面内嵌 Monaco Editor 显示高亮代码。

4. 实施路径 (MVP 阶段划分)
为了避免战线过长，建议分三步走：

Phase 1: 骨架搭建 (Week 1)

完成 Next.js + Aceternity UI 的壳子搭建。

写一个 Python 脚本，能把一个本地的简单项目解析成 {"nodes": [], "links": []} 格式的 JSON。

Phase 2: 视觉注入 (Week 2)

在 Next.js 中引入 R3F，读取假 JSON 数据，把 3D 拓扑图跑起来。

实现点击 3D 节点，弹出 Aceternity 详情卡片。

Phase 3: 灵魂注入 (Week 3)

接入大模型 API。

实现 Chat 侧边栏与 3D 视图的联动反馈机制。

## 5. E2E 测试计划

> [[SKILL: agent-browser]] — 浏览器自动化 E2E 测试
> [[MCP: playwright]] — 已全局安装，用于执行测试

每阶段完成后，使用 `agent-browser` 进行端到端验收测试。

### Phase 1 E2E

测试文件：`e2e/phase1-hero.spec.ts`

验证目标：
- [ ] Hero 全屏背景渲染正常
- [ ] 标题 + 副标题文字显示正确
- [ ] 输入框可聚焦、可输入
- [ ] 输入仓库 URL 后触发 Loading → 跳转 /galaxy

### Phase 2 E2E

测试文件：`e2e/phase2-galaxy.spec.ts`

验证目标：
- [ ] 3D 星系图正常渲染（节点 + 连线）
- [ ] 鼠标悬停显示文件名
- [ ] 点击节点弹出详情卡片（代码 + 总结）

### Phase 3 E2E

测试文件：`e2e/phase3-chat.spec.ts`

验证目标：
- [ ] Agent 回复正常显示
- [ ] 3D 视图中相关文件节点高亮（红色闪烁）
- [ ] Camera 平滑推进到高亮节点
