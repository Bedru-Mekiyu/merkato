import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, appUrl } from "@/lib/email/client";
import { weeklyDigestEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/weekly-digest
 *
 * Sends every org's staff a summary of open deals / tasks / tickets.
 * Designed for Vercel Cron (see vercel.json — Mondays 09:00 UTC) but works
 * with any scheduler that can send an Authorization header.
 *
 * Configuration:
 *   CRON_SECRET                 required — requests must send
 *                               `Authorization: Bearer <CRON_SECRET>`
 *   SUPABASE_SERVICE_ROLE_KEY   required — the job enumerates all
 *                               organizations across tenants (bypasses RLS)
 *   RESEND_API_KEY + EMAIL_FROM optional — without them the job reports
 *                               what it *would* have sent instead of sending
 */

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured. Set it in the environment to protect this endpoint." },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return unauthorized();
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY is not configured. The digest needs cross-tenant read access.",
      },
      { status: 503 }
    );
  }

  // Sanity: also confirm the caller's session isn't required anywhere below.
  // (Kept separate from admin client so user-context code stays untouched.)
  await createClient();

  const { data: orgs, error: orgsError } = await admin
    .from("organizations")
    .select("id, name");

  if (orgsError) {
    return NextResponse.json(
      { error: `Failed to list organizations: ${orgsError.message}` },
      { status: 500 }
    );
  }

  let processed = 0;
  let emailsSent = 0;
  let emailsSkipped = 0;
  const errors: string[] = [];

  for (const org of orgs ?? []) {
    try {
      const [deals, tasks, tickets, staff] = await Promise.all([
        admin
          .from("crm_deals")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", org.id)
          .not("stage", "in", '("won","lost")'),
        admin
          .from("project_tasks")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", org.id)
          .neq("status", "done"),
        admin
          .from("support_tickets")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", org.id)
          .in("status", ["open", "pending"]),
        admin.rpc("get_org_staff_emails", { p_org_id: org.id }),
      ]);

      const openDeals = deals.count ?? 0;
      const openTasks = tasks.count ?? 0;
      const openTickets = tickets.count ?? 0;

      // Nothing interesting? Don't spam the team.
      if (openDeals + openTasks + openTickets === 0) continue;
      processed += 1;

      const recipients = (staff.data as string[] | null) ?? [];
      if (recipients.length === 0) continue;

      const template = weeklyDigestEmail({
        userName: "there",
        orgName: org.name,
        openDeals,
        openTasks,
        openTickets,
        appUrl: appUrl("/dashboard"),
      });

      const result = await sendEmail({
        to: recipients,
        subject: template.subject,
        html: template.html,
      });

      if (result) {
        emailsSent += recipients.length;
      } else {
        emailsSkipped += recipients.length;
      }
    } catch (err) {
      errors.push(`${org.name}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    organizationsScanned: (orgs ?? []).length,
    organizationsWithActivity: processed,
    emailsSent,
    emailsSkipped,
    ...(emailsSkipped > 0 && {
      note: "Emails skipped because RESEND_API_KEY is not configured.",
    }),
    ...(errors.length > 0 && { errors }),
  });
}
