"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, RotateCcw, User, Bot, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export function AiChat({
  userName,
  context,
  suggestedPrompts,
}: {
  userName: string;
  context: string;
  suggestedPrompts: string[];
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(userMessage: string) {
    if (!userMessage.trim() || loading) return;

    const userMsg: Message = { role: "user", content: userMessage };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError(null);

    // Add a streaming placeholder for the assistant response
    const assistantPlaceholder: Message = { role: "assistant", content: "", streaming: true };
    setMessages([...updatedMessages, assistantPlaceholder]);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          context,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;

        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: fullResponse,
            streaming: true,
          };
          return next;
        });
      }

      // Finalize (remove streaming flag)
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: fullResponse };
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      // Remove the streaming placeholder
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function clearChat() {
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  }

  function renderContent(text: string) {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("`")) {
        return (
          <div key={i} className="font-mono text-xs bg-black/40 border border-white/10 p-2.5 rounded-lg my-2 text-white/80 overflow-x-auto">
            {line.replace(/`[a-z]*/, "")}
          </div>
        );
      }
      if (line.startsWith("### ")) {
        return <h3 key={i} className="font-bold text-white text-sm sm:text-base mt-3.5 mb-1.5">{line.slice(4)}</h3>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={i} className="font-bold text-white text-base sm:text-lg mt-4 mb-2">{line.slice(3)}</h2>;
      }
      if (line.startsWith("# ")) {
        return <h1 key={i} className="font-bold text-white text-lg sm:text-xl mt-4 mb-2">{line.slice(2)}</h1>;
      }
      if (line.startsWith("- ") || line.startsWith("• ") || line.startsWith("* ")) {
        return (
          <div key={i} className="flex items-start gap-2 my-1">
            <span className="text-primary mt-1 text-xs shrink-0">●</span>
            <span className="text-white/90 text-sm leading-relaxed">{line.slice(2)}</span>
          </div>
        );
      }
      if (line === "") return <div key={i} className="h-2" />;

      const boldified = line.replace(/\*\*([^*]+)\*\*/g, "[[B]][[/B]]");
      const parts = boldified.split(/\[\[B\]\]|\[\[\/B\]\]/);
      return (
        <p key={i} className="leading-relaxed text-sm text-white/90 my-1">
          {parts.map((part, j) => (j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part))}
        </p>
      );
    });
  }

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Modern-Thin Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/[0.08] shrink-0 bg-surface/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_12px_var(--primary-glow)] shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">AI Assistant</h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                OpenCode Free AI
              </span>
            </div>
            <p className="text-[11px] text-white/50">Org-aware live intelligence session</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-xs text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>New chat</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center py-10 animate-fade-in-up">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary border border-white/20 flex items-center justify-center text-white mx-auto mb-4 shadow-[0_0_20px_var(--primary-glow)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mb-1.5">
              Hello, {userName}
            </h2>
            <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
              I have full real-time awareness of your workspace — deals, sprint tasks, support tickets, and team channels. Ask me anything.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto pt-6 text-left">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-xl p-3 text-xs font-medium text-white/80 border border-white/[0.08] bg-surface/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 active:scale-[0.98] flex items-center gap-2 group"
                >
                  <Zap className="h-3.5 w-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 items-start animate-fade-in-up",
              msg.role === "user" && "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-sm",
                msg.role === "assistant"
                  ? "bg-gradient-to-br from-primary to-secondary border border-white/20 text-white shadow-[0_0_12px_var(--primary-glow)]"
                  : "bg-white/10 border border-white/20 text-white"
              )}
            >
              {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4 text-white/80" />}
            </div>

            <div
              className={cn(
                "rounded-2xl px-4 sm:px-5 py-3.5 text-sm max-w-[88%] leading-relaxed",
                msg.role === "assistant"
                  ? "bg-surface/85 border border-white/[0.08] text-white shadow-xl backdrop-blur-md rounded-tl-sm"
                  : "bg-primary text-white shadow-md rounded-tr-sm"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="space-y-1">
                  {renderContent(msg.content)}
                  {msg.streaming && (
                    <span className="inline-block h-3.5 w-1 rounded bg-primary animate-pulse ml-1 align-middle" />
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {error && (
          <div className="rounded-xl px-4 py-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => sendMessage(messages[messages.length - 1]?.content ?? "retry")}
              className="text-xs font-semibold text-rose-300 underline ml-2"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-white/[0.08] px-4 sm:px-6 py-4 bg-surface/50 backdrop-blur-md">
        {messages.length > 0 && !loading && (
          <div className="flex flex-wrap gap-1.5 mb-3 max-w-3xl mx-auto">
            {suggestedPrompts.slice(0, 3).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-white/70 border border-white/[0.08] bg-white/[0.02] hover:border-primary/40 hover:bg-white/[0.05] transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about deals, tasks, tickets, or team activity..."
            disabled={loading}
            className="flex-1 h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder:text-white/35 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-11 px-4 sm:px-5 flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-40 transition-all duration-150 active:scale-95 shadow-[0_0_15px_var(--primary-glow)] shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span className="text-xs font-semibold hidden sm:inline">Ask AI</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
