import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// POST /api/ai
// Body: { messages: [{role, content}], context?: string }
// Returns a streaming text/plain response
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to your .env.local file." },
      { status: 500 }
    );
  }

  // Verify the user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // AI calls cost money — tighter budget than search (20/min per user)
  const rl = rateLimit(`ai:${user.id}`, 20);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests — try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const { messages, context } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "messages is required." }, { status: 400 });
  }

  const systemPrompt = `You are Merkato AI, the built-in assistant for the Merkato startup operations platform. You help teams with their daily work: CRM pipeline management, project tasks, team communication, knowledge management, and customer support.

Be concise and practical. When answering questions about the workspace, be specific and actionable. Format responses with Markdown when helpful (headings, bullets, code blocks).

${context ? `\n## Current Workspace Context\n${context}` : ""}`;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        stream: true,
        messages: messages.slice(-20), // limit context window
      }),
    });

    if (!anthropicRes.ok) {
      const errorText = await anthropicRes.text();
      return NextResponse.json(
        { error: `Anthropic API error: ${anthropicRes.status} — ${errorText}` },
        { status: 502 }
      );
    }

    // Forward the stream directly to the client
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = anthropicRes.body!.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  await writer.write(encoder.encode(parsed.delta.text));
                }
              } catch {
                // Skip malformed SSE lines
              }
            }
          }
        }
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
