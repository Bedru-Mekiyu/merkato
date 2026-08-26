import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/navigation";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  // Legacy/implicit-style email links arrive with token_hash + type instead of code
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return redirectToDestination(supabase, origin, next);
    }
  } else if (tokenHash && (type === "signup" || type === "email")) {
    const { error } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });

    if (!error) {
      return redirectToDestination(supabase, origin, next);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

async function redirectToDestination(
  supabase: Awaited<ReturnType<typeof createClient>>,
  origin: string,
  next: string | null
) {
  const safeNext = safeNextPath(next);
  if (safeNext) {
    return NextResponse.redirect(`${origin}${safeNext}`);
  }

  // Figure out whether this user already has a workspace
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    // If they already belong to an org, go to dashboard; otherwise onboarding
    return NextResponse.redirect(
      `${origin}${membership ? "/dashboard" : "/onboarding"}`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
