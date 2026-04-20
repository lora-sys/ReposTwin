"use client";

import { useState, Suspense, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { STATIC_GRAPH_DATA } from "@/lib/staticData";
import { parseRepo, summarizeFile, type GraphData, type FileSummary } from "@/lib/api";

const ForceGraph3D = dynamic(() => import("@/components/galaxy/ForceGraph3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
        <p className="font-mono text-sm text-[var(--muted)]">初始化 3D 引擎...</p>
      </div>
    </div>
  ),
});

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="h-32 bg-[var(--secondary)]/20 rounded-lg animate-pulse" />,
});

interface GraphNode {
  id: string;
  group: number;
  size: number;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  );
}

function NodeDetailCard({
  node,
  repoUrl,
  onClose,
}: {
  node: GraphNode;
  repoUrl: string;
  onClose: () => void;
}) {
  const fileName = node.id.split("/").pop() || node.id;
  const fileExt = fileName.split(".").pop() || "";
  const lineCount = node.size * 15;
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const langMap: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    py: "python", mjs: "javascript", cjs: "javascript",
  };
  const monacoLang = langMap[fileExt] ?? "plaintext";

  // Mock code for preview (real code comes Phase 3)
  const mockCode = `// ${fileName}\nexport async function ${fileName.replace(`.${fileExt}`, "")}() {\n  // ${lineCount} lines of code\n  await fetch('/api/${fileName.split(".")[0]}')\n  return { status: 'ok' }\n}`;

  useEffect(() => {
    if (!repoUrl) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state before async fetch is intentional
    setSummaryLoading(true);
    summarizeFile(repoUrl, node.id)
      .then((data: FileSummary) => setSummary(data.summary))
      .catch(() => setSummary(`文件: ${node.id} · ${lineCount} 行`))
      .finally(() => setSummaryLoading(false));
  }, [repoUrl, node.id, lineCount]);

  return (
    <div
      className="fixed bottom-6 right-6 w-[22rem] rounded-2xl border border-[var(--secondary)] bg-[var(--background)]/90 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
      style={{ animation: "fadeInUp 0.3s ease-out" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--secondary)]/50">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--secondary)]/40 flex items-center justify-center flex-shrink-0">
            <span className="font-mono text-xs text-[var(--accent)]">{fileExt}</span>
          </div>
          <div className="min-w-0">
            <p className="font-mono text-sm font-medium text-[var(--foreground)] truncate">{fileName}</p>
            <p className="font-mono text-xs text-[var(--muted)] truncate">{node.id}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/40 transition-colors cursor-pointer flex-shrink-0"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-[var(--secondary)]/30 grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-[var(--primary)]">{lineCount}</p>
          <p className="font-mono text-xs text-[var(--muted)]">行数</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-[var(--accent)]">{node.size * 3}</p>
          <p className="font-mono text-xs text-[var(--muted)]">依赖数</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-[#A78BFA]">g{node.group}</p>
          <p className="font-mono text-xs text-[var(--muted)]">分组</p>
        </div>
      </div>

      {/* LLM Summary */}
      <div className="px-4 py-2 border-b border-[var(--secondary)]/20">
        <p className="font-mono text-xs text-[var(--muted)] mb-1">AI 总结</p>
        {summaryLoading ? (
          <div className="h-4 bg-[var(--secondary)]/20 rounded animate-pulse" />
        ) : (
          <p className="font-mono text-xs text-[var(--foreground)]">{summary ?? "..."}</p>
        )}
      </div>

      {/* Monaco Editor preview */}
      <div className="px-4 py-2">
        <p className="font-mono text-xs text-[var(--muted)] mb-1">代码预览</p>
        <div className="rounded-lg overflow-hidden border border-[var(--secondary)]/30 h-36">
          <MonacoEditor
            height="100%"
            language={monacoLang}
            value={mockCode}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 11,
              lineNumbers: "off",
              folding: false,
              wordWrap: "on",
              padding: { top: 8, bottom: 8 },
            }}
          />
        </div>
      </div>
    </div>
  );
}

function GalaxyContent() {
  const searchParams = useSearchParams();
  const repo = searchParams.get("repo") || "";
  const [graphData, setGraphData] = useState<GraphData | null>(() => {
    if (!searchParams.get("repo")) return STATIC_GRAPH_DATA;
    return null;
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightedNode, setHighlightedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    const repoUrl = searchParams.get("repo");
    if (!repoUrl) return;
    parseRepo(repoUrl)
      .then((data) => setGraphData(data))
      .catch(() => {
        setGraphData(STATIC_GRAPH_DATA);
        setError("API 不可用，显示示例数据");
      });
  }, [searchParams]);

  const data = graphData ?? STATIC_GRAPH_DATA;

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    setHighlightedNode(node);
  }, []);

  const handleHighlightNode = useCallback((nodeId: string | null) => {
    if (!nodeId) {
      setHighlightedNode(null);
      return;
    }
    const found = data.nodes.find((n: GraphNode) => n.id === nodeId);
    if (found) setHighlightedNode(found);
  }, [data.nodes]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="fixed inset-0 -z-10" style={{ background: "radial-gradient(ellipse at center, #1a1a2e 0%, #0F172A 70%)" }} />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 font-mono text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer">
          <BackIcon /><span>返回</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--secondary)]/30 border border-[var(--secondary)]/50">
            <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            <span className="font-mono text-xs text-[var(--muted)] truncate max-w-[200px]">{repo || "demo"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[var(--muted)]">
          <InfoIcon />
          <span className="font-mono text-xs">{data.nodes.length} 节点 · {data.links.length} 连线</span>
        </div>
      </div>

      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[var(--secondary)]/80 border border-[var(--secondary)] text-[var(--muted)] font-mono text-xs backdrop-blur-sm">
          {error}
        </div>
      )}

      <div className="absolute inset-0 pt-16">
        <ForceGraph3D data={data} onNodeClick={handleNodeClick} highlightedNode={highlightedNode?.id ?? null} />
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs text-[var(--muted)] opacity-60">
        拖拽旋转 · 滚轮缩放 · 点击节点查看详情
      </div>

      {selectedNode && (
        <NodeDetailCard node={selectedNode} repoUrl={repo} onClose={() => setSelectedNode(null)} />
      )}

      {repo && <ChatSidebar repoUrl={repo} onHighlightNode={handleHighlightNode} />}
    </div>
  );
}

export default function GalaxyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
          <p className="font-mono text-sm text-[var(--muted)]">加载中...</p>
        </div>
      </div>
    }>
      <GalaxyContent />
    </Suspense>
  );
}
