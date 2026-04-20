"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const STEPS = [
  { label: "正在克隆仓库", sub: "git clone --depth 1 ..." },
  { label: "正在解析 AST", sub: "tree-sitter parsing ..." },
  { label: "正在注入向量数据库", sub: "chromaDB embedding ..." },
  { label: "正在渲染 3D 星系", sub: "r3f force-graph ..." },
];

function StepItem({ step, status }: { step: typeof STEPS[0]; status: "done" | "active" | "pending" }) {
  return (
    <div
      className="relative flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-500"
      style={{
        background:
          status === "active"
            ? "rgba(34, 197, 94, 0.08)"
            : status === "done"
            ? "rgba(34, 197, 94, 0.05)"
            : "rgba(51, 65, 85, 0.2)",
        border:
          status === "active"
            ? "1px solid rgba(34, 197, 94, 0.4)"
            : status === "done"
            ? "1px solid rgba(34, 197, 94, 0.2)"
            : "1px solid rgba(51, 65, 85, 0.4)",
        transform: status === "active" ? "scale(1.02)" : "scale(1)",
      }}
    >
      {/* Status icon */}
      <div className="flex-shrink-0 w-6 h-6">
        {status === "done" ? (
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : status === "active" ? (
          <div className="w-6 h-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-[var(--secondary)]" />
        )}
      </div>

      {/* Text */}
      <div>
        <p
          className="font-mono text-sm font-medium"
          style={{ color: status === "pending" ? "var(--muted)" : "var(--foreground)" }}
        >
          {step.label}
        </p>
        <p className="font-mono text-xs text-[var(--muted)] mt-0.5">{step.sub}</p>
      </div>
    </div>
  );
}

function LoadingContent() {
  const searchParams = useSearchParams();
  const repo = searchParams.get("repo") || "...";
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= STEPS.length - 1) {
          setDone(true);
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-lg">
      {/* Repo name */}
      <div className="text-center mb-10">
        <p className="font-mono text-sm text-[var(--muted)] mb-2">分析仓库</p>
        <p className="font-mono text-lg text-[var(--foreground)] truncate">{repo}</p>
      </div>

      {/* Progress steps */}
      <div className="space-y-1">
        {STEPS.map((step, i) => {
          const status = i < currentStep ? "done" : i === currentStep ? (done ? "done" : "active") : "pending";
          return <StepItem key={i} step={step} status={status} />;
        })}
      </div>

      {/* Overall progress bar */}
      <div className="mt-8 h-1 rounded-full bg-[var(--secondary)]/40 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-700 ease-out"
          style={{ width: done ? "100%" : `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {done && (
        <p className="text-center font-mono text-sm text-[var(--primary)] mt-4 animate-pulse">
          渲染完成，进入星系 →
        </p>
      )}
    </div>
  );
}

export default function Loading() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--background)" }}
    >
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
          <p className="font-mono text-sm text-[var(--muted)]">加载中...</p>
        </div>
      }>
        <LoadingContent />
      </Suspense>
    </main>
  );
}
