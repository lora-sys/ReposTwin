"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import { BackgroundBeams } from "@/components/ui/background-beams";

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

const TITLE_WORDS = [
  { text: "探索你的代码星系", className: "text-[var(--foreground)]" },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      router.push(`/loading?repo=${encodeURIComponent(url.trim())}`);
    }, 600);
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <BackgroundBeams className="opacity-30" />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 -z-5 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(34,197,94,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(56,189,248,0.04) 0%, transparent 50%)",
        }}
      />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">

        {/* Logo mark */}
        <div
          className="mb-8 flex items-center gap-3"
          style={{ animation: "fadeInUp 0.8s ease-out forwards" }}
        >
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/20 border border-[var(--primary)]/40 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3"/>
              <circle cx="12" cy="12" r="8" strokeDasharray="4 2"/>
              <circle cx="5" cy="6" r="1.5" fill="currentColor"/>
              <circle cx="19" cy="8" r="1" fill="currentColor"/>
              <circle cx="18" cy="17" r="1.5" fill="currentColor"/>
              <circle cx="6" cy="18" r="1" fill="currentColor"/>
              <path d="M5 6L12 12M19 8L12 12M18 17L12 12M6 18L12 12" strokeWidth="1"/>
            </svg>
          </div>
          <span className="font-mono text-sm text-[var(--muted)]">repotwin</span>
        </div>

        {/* Main title with TypewriterEffect */}
        <div className="mb-4" style={{ animation: "fadeInUp 0.8s ease-out 0.2s forwards", opacity: 0 }}>
          <TypewriterEffect words={TITLE_WORDS} className="font-mono text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight" />
        </div>

        {/* Subtitle */}
        <p
          className="text-base md:text-lg text-[var(--muted)] max-w-xl mb-10"
          style={{ animation: "fadeInUp 0.8s ease-out 0.5s forwards", opacity: 0 }}
        >
          将 GitHub 仓库转化为交互式 3D 星系，配合 AI Agent 智能问答
        </p>

        {/* Input form */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl"
          style={{ animation: "fadeInUp 0.8s ease-out 0.8s forwards", opacity: 0 }}
        >
          <div className="relative group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--primary)]/0 via-[var(--primary)]/30 to-[var(--accent)]/0 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500" />

            <div className="relative flex items-center rounded-2xl bg-[var(--secondary)]/40 border border-[var(--secondary)] backdrop-blur-sm overflow-hidden transition-all duration-300 group-focus-within:border-[var(--primary)]/50 group-focus-within:bg-[var(--secondary)]/60">
              <div className="pl-5 pr-3 text-[var(--muted)]">
                <GitHubIcon />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/facebook/react"
                className="flex-1 bg-transparent py-4 pr-4 text-[var(--foreground)] placeholder-[var(--muted)] font-mono text-sm outline-none"
                disabled={submitted}
                autoFocus
              />
              <button
                type="submit"
                disabled={submitted || !url.trim()}
                className="mr-2 flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitted ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    分析中
                  </span>
                ) : (
                  <>
                    <span>探索</span>
                    <ArrowRight />
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-[var(--muted)] text-center font-mono">
            输入 GitHub 仓库 URL，按 Enter 开始分析
          </p>
        </form>

        {/* Feature tags */}
        <div
          className="flex flex-wrap justify-center gap-2 mt-10"
          style={{ animation: "fadeInUp 0.8s ease-out 1.1s forwards", opacity: 0 }}
        >
          {["3D 可视化", "AI Agent", "AST 解析", "SSE 流式"].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-xs font-mono border border-[var(--secondary)] text-[var(--muted)] bg-[var(--secondary)]/20"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 font-mono text-xs text-[var(--secondary)] opacity-60">
        v0.1.0
      </div>
      <div className="absolute bottom-8 right-8 font-mono text-xs text-[var(--secondary)] opacity-60">
        next.js 16
      </div>
    </main>
  );
}
