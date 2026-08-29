"use client";

import { useState } from "react";
import { Sparkles, Send, Bot, User, CheckCircle2, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface QAItem {
  question: string;
  answer: string;
  category: "overview" | "security" | "features" | "stack";
}

const FAQ_KNOWLEDGE_BASE: QAItem[] = [
  {
    question: "What exactly is Merkato and what problem does it solve?",
    answer:
      "Merkato is a unified operating system for high-velocity startups. Instead of paying $20–$80/seat across 5–6 fragmented tools (HubSpot for CRM, Linear for sprints, Slack for chat, Zendesk for support, and Google Drive for docs), Merkato consolidates everything into **one codebase, one Postgres database, and one login** with sub-50ms real-time sync.",
    category: "overview",
  },
  {
    question: "How does Postgres Row-Level Security (RLS) protect customer and company data?",
    answer:
      "Every single table in Merkato is locked with PostgreSQL Row-Level Security (RLS) policies. Tenant and role isolation (`owner`, `admin`, `member`, `customer`) are enforced at the database engine level, not just in UI code. Even support ticket internal notes are cryptographically invisible to customer portal sessions.",
    category: "security",
  },
  {
    question: "What modules are included in the platform?",
    answer:
      "Merkato includes 8 full-featured modules:\n1. **CRM & Sales Pipeline** (6-stage Kanban board, companies & contacts directory)\n2. **Agile Sprint Boards** (milestones, priorities, subtask checklists, and task comments)\n3. **Real-Time Team Channels** (WebSocket chat and direct messages with presence)\n4. **Customer Support Portal** (internal staff queue + public customer portal at `/portal/[orgSlug]`)\n5. **Encrypted Document Drive** (private bucket storage with versioning & 1-hour signed URLs)\n6. **Knowledge Base** (XSS-safe Markdown docs, draft/publish workflow)\n7. **Hand-Rolled SVG Analytics** (zero-dependency live business metrics)\n8. **Live System Telemetry & AI Assistant** (live RAG workspace intelligence)",
    category: "features",
  },
  {
    question: "What is the tech stack and how is it deployed?",
    answer:
      "Frontend: **Next.js 14 App Router** with React Server Components, TypeScript, and Tailwind CSS.\nBackend & Database: **Supabase PostgreSQL 15+** with 25 tables, ~90 RLS policies, Auth (PKCE & TOTP MFA), and Realtime WebSockets.\nDeployment: Optimized for **Vercel** or containerized Docker hosting with zero external heavy dependencies.",
    category: "stack",
  },
  {
    question: "Can I use external LLMs like OpenAI, Claude, or Groq with the AI Assistant?",
    answer:
      "Yes! The AI Assistant natively connects to OpenAI (GPT-4o), Anthropic (Claude 3.5), OpenRouter, and Groq. You can provide your API key via environment variables or paste your key directly in the workspace chat settings for client-side encrypted inference.",
    category: "features",
  },
  {
    question: "Is there a public customer portal for support tickets?",
    answer:
      "Yes! Every organization gets a dedicated public support portal at `/portal/[orgSlug]` where external customers can log in, submit tickets, and track resolution progress without accessing internal CRM, task boards, or internal notes.",
    category: "features",
  },
];

function generateDynamicAnswer(query: string): string {
  const q = query.toLowerCase().trim();

  // Find direct match or keyword match
  const found = FAQ_KNOWLEDGE_BASE.find(
    (item) =>
      q.includes(item.question.toLowerCase()) ||
      item.question.toLowerCase().includes(q) ||
      (q.includes("rls") && item.category === "security") ||
      (q.includes("price") || q.includes("cost") || q.includes("pricing")) && item.category === "overview" ||
      (q.includes("stack") || q.includes("next.js") || q.includes("supabase")) && item.category === "stack"
  );

  if (found) return found.answer;

  if (q.includes("crm") || q.includes("sales") || q.includes("deal") || q.includes("lead")) {
    return "### 💼 Merkato CRM Pipeline\nMerkato provides an interactive 6-stage drag-and-drop sales pipeline (`New Lead` → `Contacted` → `Qualified` → `Proposal` → `Won` / `Lost`), company & contact directories, real-time revenue rollups, and activity logging directly linked to your workspace.";
  }

  if (q.includes("task") || q.includes("sprint") || q.includes("kanban") || q.includes("project") || q.includes("jira") || q.includes("linear")) {
    return "### ⚡ Sprint & Project Management\nMerkato features high-velocity sprint task boards with Kanban columns, subtask checklists, task assignment with email alerts, priority filtering (`Urgent`, `High`, `Medium`, `Low`), and threaded task comments.";
  }

  if (q.includes("chat") || q.includes("slack") || q.includes("channel") || q.includes("message") || q.includes("team")) {
    return "### 💬 Real-Time Team Channels\nPowered by Supabase Realtime WebSockets (`postgres_changes`), Merkato offers instant channel messaging, 1-on-1 direct messages, and real-time team presence with custom status tags (like *In Focus*, *In Meeting*, *Tea Break*).";
  }

  if (q.includes("support") || q.includes("ticket") || q.includes("helpdesk") || q.includes("zendesk") || q.includes("portal")) {
    return "### 🎫 Customer Support & Public Portal\nMerkato provides dual-surfaced ticketing: an internal staff triage queue alongside a public customer portal at `/portal/[orgSlug]`. Support staff can post internal notes (`is_internal_note`) that are physically blocked from customers by Postgres Row-Level Security.";
  }

  if (q.includes("document") || q.includes("storage") || q.includes("file") || q.includes("drive") || q.includes("s3")) {
    return "### 📁 Encrypted Document Drive\nMerkato includes nested folder hierarchies, drag-and-drop file uploads backed by Supabase Storage, version tracking (`document_versions`), and secure 1-hour signed download URLs.";
  }

  if (q.includes("ai") || q.includes("assistant") || q.includes("llm") || q.includes("gpt") || q.includes("claude")) {
    return "### 🤖 AI & Workspace Intelligence\nMerkato features a live RAG workspace intelligence engine that synthesizes real-time pipeline valuations, urgent sprint tasks, and open tickets directly from PostgreSQL, alongside support for streaming OpenAI GPT-4o, Anthropic Claude 3.5, and Groq.";
  }

  return `### 💡 Merkato Overview\n\nThank you for asking: **"${query}"**\n\nMerkato is an all-in-one operating platform engineered with **Next.js 14** and **Supabase PostgreSQL**. It unifies CRM pipelines, sprint tasks, team channels, customer support, and document management into one database-isolated workspace.\n\n- **Database**: 25 tables with Row-Level Security (RLS) tenant isolation.\n- **Velocity**: Sub-50ms real-time state synchronization.\n- **Modularity**: Zero-context switching across all core startup operations.`;
}

export function LandingQA() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content:
        "Hi! Ask me anything about Merkato — how the CRM pipeline works, sprint task boards, customer portal, database RLS security, tech stack, or how it replaces multiple SaaS subscriptions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sampleChips = [
    "What problem does Merkato solve?",
    "How does Postgres RLS secure our data?",
    "What modules are included in the platform?",
    "What is the tech stack?",
    "How does the customer support portal work?",
  ];

  function handleAsk(queryText: string) {
    if (!queryText.trim() || isTyping) return;
    const userQ = queryText.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userQ }]);
    setIsTyping(true);

    setTimeout(() => {
      const answer = generateDynamicAnswer(userQ);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
      setIsTyping(false);
    }, 200);
  }

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-white/[0.1] bg-surface/90 backdrop-blur-xl shadow-2xl overflow-hidden text-left">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_10px_var(--primary-glow)]">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-tight">
              Interactive Platform Q&amp;A
            </h3>
            <p className="text-[10px] text-white/50">Ask anything about Merkato features &amp; architecture</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Instant Answers
        </span>
      </div>

      {/* Chat Messages */}
      <div className="p-5 max-h-80 overflow-y-auto space-y-4 bg-background/40">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-start gap-3 text-xs leading-relaxed animate-fade-in-up",
              m.role === "user" && "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-white shadow-sm",
                m.role === "assistant"
                  ? "bg-gradient-to-br from-primary to-secondary border border-white/20 shadow-[0_0_10px_var(--primary-glow)]"
                  : "bg-white/10 border border-white/20"
              )}
            >
              {m.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            </div>

            <div
              className={cn(
                "rounded-xl px-4 py-3 max-w-[85%] whitespace-pre-line",
                m.role === "assistant"
                  ? "bg-surface border border-white/[0.08] text-white/90 shadow-md"
                  : "bg-primary text-white font-medium"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-white/50 animate-pulse pl-10">
            <Sparkles className="h-3 w-3 text-primary animate-spin" />
            Synthesizing answer...
          </div>
        )}
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-5 py-2.5 border-t border-white/[0.06] bg-white/[0.01] flex flex-wrap gap-1.5">
        {sampleChips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleAsk(chip)}
            className="text-[11px] font-medium text-white/70 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white border border-white/[0.08] hover:border-primary/40 rounded-lg px-2.5 py-1 transition-all flex items-center gap-1 active:scale-95"
          >
            <Zap className="h-2.5 w-2.5 text-primary shrink-0" />
            <span>{chip}</span>
          </button>
        ))}
      </div>

      {/* Question Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(input);
        }}
        className="p-3 sm:p-4 border-t border-white/[0.08] bg-surface/60 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about Merkato (e.g. 'How does customer support work?')..."
          className="flex-1 h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="h-10 px-4 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-hover disabled:opacity-40 flex items-center gap-1.5 transition-all shadow-[0_0_12px_var(--primary-glow)] active:scale-95 shrink-0"
        >
          <span>Ask</span>
          <Send className="h-3 w-3" />
        </button>
      </form>
    </div>
  );
}
