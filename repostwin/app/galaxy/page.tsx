"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { STATIC_GRAPH_DATA } from "@/lib/staticData";

// Dynamic import for 3D component (no SSR)
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

// Detail card for selected node
function NodeDetailCard({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  const fileName = node.id.split("/").pop() || node.id;
  const fileExt = fileName.split(".").pop() || "";
  const lineCount = node.size * 15;

  return (
    <div
      className="fixed bottom-6 right-6 w-80 rounded-2xl border border-[var(--secondary)] bg-[var(--background)]/90 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
      style={{ animation: "fadeInUp 0.3s ease-out" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--secondary)]/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--secondary)]/40 flex items-center justify-center">
            <span className="font-mono text-xs text-[var(--accent)]">{fileExt}</span>
          </div>
          <div>
            <p className="font-mono text-sm font-medium text-[var(--foreground)]">{fileName}</p>
            <p className="font-mono text-xs text-[var(--muted)]">{node.id}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/40 transition-colors cursor-pointer"
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
          <p className="font-mono text-lg font-bold text-[var(--accent)]">{(node.size * 3).toFixed(1)}</p>
          <p className="font-mono text-xs text-[var(--muted)]">依赖数</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-[#A78BFA]">group-{node.group}</p>
          <p className="font-mono text-xs text-[var(--muted)]">分组</p>
        </div>
      </div>

      {/* Mock code preview */}
      <div className="px-4 py-3">
        <p className="font-mono text-xs text-[var(--muted)] mb-2">{"// preview"}</p>
        <pre className="font-mono text-xs text-[var(--foreground)]/80 bg-[var(--secondary)]/20 rounded-lg p-3 overflow-x-auto">
          <code>{`// ${fileName}
export async function ${fileName.replace(`.${fileExt}`, "")}() {
  // ${lineCount} lines of code
  await fetch('/api/${fileName.split(".")[0]}')
  return { status: 'ok' }
}`}</code>
        </pre>
      </div>
    </div>
  );
}

// Node tooltip on hover
function Tooltip({ node, position }: { node: GraphNode | null; position: { x: number; y: number } | null }) {
  if (!node || !position) return null;
  return (
    <div
      className="fixed pointer-events-none z-50 px-3 py-2 rounded-xl bg-[var(--background)]/95 border border-[var(--secondary)] backdrop-blur-sm shadow-xl"
      style={{
        left: position.x + 15,
        top: position.y - 10,
        animation: "fadeInUp 0.15s ease-out",
      }}
    >
      <p className="font-mono text-xs text-[var(--foreground)] whitespace-nowrap">{node.id}</p>
      <p className="font-mono text-xs text-[var(--muted)] mt-0.5">
        {node.size * 15} 行 · group-{node.group}
      </p>
    </div>
  );
}

function GalaxyContent() {
  const searchParams = useSearchParams();
  const repo = searchParams.get("repo") || "demo";
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Use static data for Phase 0
  const data = STATIC_GRAPH_DATA;

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: "radial-gradient(ellipse at center, #1a1a2e 0%, #0F172A 70%)",
        }}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
        >
          <BackIcon />
          <span>返回</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--secondary)]/30 border border-[var(--secondary)]/50">
            <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            <span className="font-mono text-xs text-[var(--muted)] truncate max-w-[200px]">{repo}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[var(--muted)]">
          <InfoIcon />
          <span className="font-mono text-xs">{data.nodes.length} 节点 · {data.links.length} 连线</span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="absolute inset-0 pt-16">
        <ForceGraph3D
          data={data}
          onNodeClick={handleNodeClick}
          highlightedNode={null}
        />
      </div>

      {/* Hint text */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs text-[var(--muted)] opacity-60">
        拖拽旋转 · 滚轮缩放 · 点击节点查看详情
      </div>

      {/* Node detail card */}
      {selectedNode && (
        <NodeDetailCard node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}

      {/* Tooltip */}
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
