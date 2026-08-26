/**
 * Thin wrapper around the Resend REST API.
 * We call the REST API directly (no npm package needed) so there's zero
 * additional dependency to install. Every function is fire-and-forget-safe —
 * if RESEND_API_KEY is not set the call logs a warning and returns null
 * rather than throwing, so missing config never crashes the app.
 */

const RESEND_API = "https://api.resend.com/emails";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

interface SendEmailResult {
  id: string;
}

export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult | null> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "noreply@merkato.app";

  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY is not set — email not sent:",
      params.subject
    );
    return null;
  }

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        reply_to: params.replyTo,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend API error:", res.status, body);
      return null;
    }

    return (await res.json()) as SendEmailResult;
  } catch (err) {
    console.error("[email] Failed to send email:", err);
    return null;
  }
}

/** Convenience: app base URL from env, falling back to localhost */
export function appUrl(path = ""): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${base}${path}`;
}
