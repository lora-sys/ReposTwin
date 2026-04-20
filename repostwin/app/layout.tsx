import type { Metadata } from "next";
import { JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RepoTwin — 探索你的代码星系",
  description: "将 GitHub 仓库转化为交互式 3D 代码星系，配合 AI Agent 智能问答",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn("dark", "font-sans", geist.variable)}>
      <body
        className={`${geist.variable} ${jetbrainsMono.variable} min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
