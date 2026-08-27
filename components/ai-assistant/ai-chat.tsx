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
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0 bg-header">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 bg-accent/10">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h1 className="text-sm font-semibold whitespace-nowrap text-white">AI Assistant</h1>
            <p className="text-xs text-muted-foreground opacity-60">Org-aware · Powered by ox-alpha</p>
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
          <div className="text-center py-10">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-accent/5">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Hello, {userName}
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
              I have live context from your workspace — deals, tasks, tickets,
              and recent activity. Ask me anything.
            </p>
            <div className="grid grid-cols-2 gap-2 justify-center max-w-sm mx-auto pt-4">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-white/80 border border-border/30 hover:border-white/20 hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 items-start",
              msg.role === "user" && "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 mt-0 flex-shrink-0",
                msg.role === "assistant"
                  ? "bg-accent text-accent"
                  : "bg-white/20 border border-white/10"
              )}
            >
              {msg.role === "assistant"
                ? <Sparkles className="h-4 w-4 lines text-accent" />
                : <User className="h-4 w-4 text-white/70" />
              }
            </div>
            <div
              className="flex-1 min-w[0%] rounded-xl px-4 py-3 text-sm msg msg-bubble"
              style={{ flex: "1 1 calc(85% - 2rem)" }}
            >
              {msg.role === "assistant" ? (
                <div className="space-y-1.5">
                  {renderContent(msg.content)}
                  {msg.streaming && (
                    <span className="h-0.5 w-1/2 rounded bg-accent animate-pulse" />
                  )}
                </div>
              ) : (
                <p className="leading-relaxed break-words">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm max-w-lg bg-danger/10 border border-danger/20 text-white">
            <svg className="h-4 w-4 flex-shrink-0 mr-2 opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path className="stroke-2" d="M10 14l2-2m0 2l2-2m-2-2l2 2m2 2l-2-2m2-2l2 2m7-4h.01M7 7l5 5m0 0l-5 5m5-5H9"/></svg>
            <strong className="inline-block mb-1.5 text-lg">AI Assistant unavailable.</strong>
            <p className="text-muted-foreground text-sm">{error.includes("OX_ALPHA_API_KEY")
              ? "This feature isn't configured yet — ask your workspace admin to enable it in Settings."
              : error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 px-6 py-4 bg-card">
        {messages.length > 0 && !loading && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {suggestedPrompts.slice(0, 3).map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white/80 border border-border/30 hover:border-white/20 hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
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
            className="flex-1 rounded-xl px-4 py-2.5 bg-surface border border-border text-sm text-white placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
