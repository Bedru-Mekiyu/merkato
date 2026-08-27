import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// POST /api/ai
// Body: { messages: [{role, content}], context?: string }
// Returns a streaming text/plain response
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const apiKey = process.env.OX_ALPHA_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OX_ALPHA_API_KEY is not set. Add it to your .env.local file." },
      { status: 500 }
    );
  }

  // Verify the user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin", "member"])
    .limit(1)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: "Staff access required" }, { status: 403 });
  }

  // AI calls cost money — tighter budget than search (20/min per user)
  const rl = rateLimit(`ai:${user.id}`, 20);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests — try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const payload = await req.json();
  const { messages, context } = payload;

  if (
    !Array.isArray(messages) ||
    messages.length > 50 ||
    messages.some(
      (message) =>
        !message ||
        !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" ||
        message.content.length > 8000
    )
  ) {
    return NextResponse.json({ error: "messages is required." }, { status: 400 });
  }

  if (context !== undefined && (typeof context !== "string" || context.length > 12000)) {
    return NextResponse.json({ error: "context is too large." }, { status: 400 });
  }

  const systemPrompt = `You are Merkato AI, the built-in assistant for the Merkato startup operations platform. You help teams with their daily work: CRM pipeline management, project tasks, team communication, knowledge management, and customer support.

Be concise and practical. When answering questions about the workspace, be specific and actionable. Format responses with Markdown when helpful (headings, bullets, code blocks).

${context ? `\n## Current Workspace Context\n${context}` : ""}`;

  try {
    const oxRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "ox-alpha",
        max_tokens: 1024,
        temperature: 0.7,
        system: systemPrompt,
        stream: true,
        messages: messages.slice(-20), // limit context window
      }),
    });

    // Forward the stream directly to the client
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = oxRes.body!.getReader();
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
                if (parsed.choices?.[0]?.delta?.content) {
                  await writer.write(encoder.encode(parsed.choices[0].delta.content));
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
