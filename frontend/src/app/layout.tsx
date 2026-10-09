import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Nunito_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

// Dashboard / app-wide UI — nav, cards, buttons, headings outside the workspace.
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-dashboard-raw",
  subsets: ["latin"],
});

// Coding / learning workspace — problem statements, examples, hints, tabs.
const nunitoSans = Nunito_Sans({
  variable: "--font-workspace-raw",
  subsets: ["latin"],
});

// Code / technical content — editor, inline code, test cases, console output.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-code-raw",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PatternForge AI — Coding Workspace",
  description: "A guided workspace for learning data structures and algorithms through coding practice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${nunitoSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF8F5] text-stone-900 font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
