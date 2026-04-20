"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSidebarProps {
  repoUrl: string;
  onHighlightNode?: (nodeId: string | null) => void;
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

function RepoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18" />
    </svg>
  );
}

export default function ChatSidebar({ repoUrl, onHighlightNode }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `已加载仓库 ${repoUrl.split("/").pop() || repoUrl}。问我任何关于代码结构的问题！`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    setStreamingContent("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl, message: userMsg }),
      });

      if (!res.ok) throw new Error("Chat API error");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setStreamingContent(fullContent);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: fullContent }]);

      // Extract filename references and highlight
      const fileMatch = fullContent.match(/[`"]?([\w\-./]+\.(ts|tsx|js|jsx|py))[`"]?/);
      if (fileMatch && onHighlightNode) {
        onHighlightNode(fileMatch[1]);
        setTimeout(() => onHighlightNode(null), 4000);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "抱歉，API 暂不可用。请确保后端服务已启动。" },
      ]);
    } finally {
      setLoading(false);
      setStreamingContent("");
    }
  };

  return (
    <div className="fixed right-6 top-20 w-80 rounded-2xl border border-[var(--secondary)] bg-[var(--background)]/80 backdrop-blur-xl shadow-2xl z-40 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 10rem)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--secondary)]/50 flex items-center gap-2">
        <RepoIcon />
        <span className="font-mono text-sm font-medium text-[var(--foreground)]">AI 助手</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
          <span className="font-mono text-xs text-[var(--muted)]">DeepSeek</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 font-mono text-xs ${
                msg.role === "user"
                  ? "bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30"
                  : "bg-[var(--secondary)]/30 text-[var(--foreground)] border border-[var(--secondary)]/50"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-xl px-3 py-2 font-mono text-xs bg-[var(--secondary)]/30 text-[var(--foreground)] border border-[var(--secondary)]/50">
              {streamingContent}
              <span className="animate-pulse ml-1">▌</span>
            </div>
          </div>
        )}
        {loading && !streamingContent && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[var(--secondary)]/30 border border-[var(--secondary)]/50">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--secondary)]/50">
        <div className="flex items-center gap-2 bg-[var(--secondary)]/20 rounded-lg px-3 py-2 border border-[var(--secondary)]/30">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="问关于代码的问题..."
            className="flex-1 bg-transparent font-mono text-xs text-[var(--foreground)] placeholder-[var(--muted)] outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors disabled:opacity-30 cursor-pointer"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
}