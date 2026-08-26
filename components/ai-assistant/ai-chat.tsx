"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, RotateCcw, User } from "lucide-react";
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

  // Simple markdown -> plain render for AI responses (bold, bullets, code)
  function renderContent(text: string) {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      // Code block line
      if (line.startsWith("```")) return <div key={i} className="font-mono text-xs text-white/60">{line}</div>;
      // Heading
      if (line.startsWith("### ")) return <p key={i} className="font-semibold text-white mt-3 mb-1">{line.slice(4)}</p>;
      if (line.startsWith("## ")) return <p key={i} className="font-bold text-white mt-3 mb-1 text-base">{line.slice(3)}</p>;
      // List item
      if (line.startsWith("- ") || line.startsWith("• ")) {
        return <div key={i} className="flex gap-2 my-0.5"><span className="text-accent mt-0.5 shrink-0">·</span><span>{line.slice(2)}</span></div>;
      }
      if (line === "") return <div key={i} className="h-2" />;
      // Bold
      const boldified = line.replace(/\*\*([^*]+)\*\*/g, "[[B]]$1[[/B]]");
      const parts = boldified.split(/\[\[B\]\]|\[\[\/B\]\]/);
      return (
        <p key={i} className="leading-relaxed">
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
        </p>
      );
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-sm bg-accent/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">AI Assistant</h1>
            <p className="text-xs text-muted">Org-aware · Powered by Claude</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Hello, {userName}
            </h2>
            <p className="text-sm text-muted mb-8 max-w-xs mx-auto">
              I have live context from your workspace — deals, tasks, tickets,
              and recent activity. Ask me anything.
            </p>
            <div className="space-y-2 max-w-sm mx-auto">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left text-sm px-4 py-2.5 rounded-md border border-border bg-surface hover:border-white/20 hover:bg-white/[0.02] text-white/80 hover:text-white transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                msg.role === "assistant"
                  ? "bg-accent/10 border border-accent/30"
                  : "bg-white/10 border border-white/15"
              )}
            >
              {msg.role === "assistant"
                ? <Sparkles className="h-3.5 w-3.5 text-accent" />
                : <User className="h-3.5 w-3.5 text-white/70" />
              }
            </div>
            <div
              className={cn(
                "flex-1 max-w-[85%] rounded-md px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-accent/10 text-white ml-auto"
                  : "bg-surface border border-border text-white/90"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="space-y-0.5">
                  {renderContent(msg.content)}
                  {msg.streaming && (
                    <span className="inline-block h-3.5 w-0.5 bg-accent animate-pulse ml-0.5" />
                  )}
                </div>
              ) : (
                <p className="leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {error && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-4 py-3 max-w-lg">
            <strong>Error:</strong> {error}
            {error.includes("ANTHROPIC_API_KEY") && (
              <p className="mt-1 text-xs">
                Add <code className="font-mono">ANTHROPIC_API_KEY=sk-ant-...</code> to your{" "}
                <code className="font-mono">.env.local</code> file, then restart the dev server.
              </p>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-6 py-4 max-w-3xl mx-auto w-full">
        {messages.length > 0 && !loading && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {suggestedPrompts.slice(0, 3).map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-xs px-2.5 py-1.5 rounded-sm border border-border bg-surface text-muted hover:text-white hover:border-white/20 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your workspace..."
            disabled={loading}
            className="flex-1 h-11 px-4 rounded-sm bg-surface border border-border text-sm text-white placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-11 w-11 flex items-center justify-center rounded-sm bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors shrink-0"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </button>
        </form>
      </div>
    </div>
  );
}
