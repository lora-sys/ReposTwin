"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const TITLE = "探索你的代码星系";
const SUBTITLE = "将 GitHub 仓库转化为交互式 3D 星系，配合 AI Agent 智能问答";

// Animated starfield background
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.8 + 0.2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw nebula-like gradient
      const grad = ctx.createRadialGradient(
        canvas.width * 0.3, canvas.height * 0.4, 0,
        canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.6
      );
      grad.addColorStop(0, "rgba(34, 197, 94, 0.08)");
      grad.addColorStop(0.5, "rgba(56, 189, 248, 0.04)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const grad2 = ctx.createRadialGradient(
        canvas.width * 0.7, canvas.height * 0.6, 0,
        canvas.width * 0.7, canvas.height * 0.6, canvas.width * 0.4
      );
      grad2.addColorStop(0, "rgba(139, 92, 246, 0.06)");
      grad2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      stars.forEach((star) => {
        star.y -= star.speed;
        if (star.y < -5) {
          star.y = canvas.height + 5;
          star.x = Math.random() * canvas.width;
        }
        star.opacity += (Math.random() - 0.5) * 0.05;
        star.opacity = Math.max(0.1, Math.min(1, star.opacity));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(248, 250, 252, ${star.opacity})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: "#0F172A" }}
    />
  );
}

// Typewriter effect for title
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, 80);
    return () => clearInterval(timer);
  }, [started, text]);

  return (
    <span>
      {displayed}
      <span className="animate-blink text-[var(--primary)]">|</span>
    </span>
  );
}

// Floating orbit particles
function OrbitParticles() {
  return (
    <div className="fixed inset-0 -z-5 pointer-events-none overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 3}px`,
            height: `${i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 3}px`,
            background: i % 3 === 0 ? "#22C55E" : i % 3 === 1 ? "#38BDF8" : "#A78BFA",
            left: "50%",
            top: "50%",
            animation: `orbit ${8 + i * 1.5}s linear infinite`,
            ["--orbit-r" as string]: `${120 + i * 30}px`,
          }}
        />
      ))}
    </div>
  );
}

// GitHub icon SVG
function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

// Arrow right icon
function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      router.push(`/galaxy?repo=${encodeURIComponent(url.trim())}`);
    }, 800);
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <Starfield />
      <OrbitParticles />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">
        {/* Logo mark */}
        <div
          className="mb-8 flex items-center gap-3 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]"
          style={{ animationDelay: "0.1s" }}
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

        {/* Main title */}
        <h1
          className="font-mono text-5xl md:text-7xl font-bold tracking-tight mb-4 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]"
          style={{ animationDelay: "0.3s", color: "var(--foreground)" }}
        >
          <TypewriterText text={TITLE} delay={500} />
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg md:text-xl text-[var(--muted)] max-w-xl mb-12 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]"
          style={{ animationDelay: "0.7s" }}
        >
          {SUBTITLE}
        </p>

        {/* Input form */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]"
          style={{ animationDelay: "1s" }}
        >
          <div className="relative group">
            {/* Glow ring on focus */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--primary)]/0 via-[var(--primary)]/40 to-[var(--accent)]/0 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500" />

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
          className="flex flex-wrap justify-center gap-2 mt-10 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]"
          style={{ animationDelay: "1.3s" }}
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
