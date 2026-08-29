import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function jsonToCsv<T extends Record<string, unknown>>(items: T[]): string {
  if (items.length === 0) return "";
  const headers = Object.keys(items[0]);
  const rows = items.map((row) =>
    headers
      .map((fieldName) => {
        const val = row[fieldName];
        const stringVal = val === null || val === undefined ? "" : String(val);
        return `"${stringVal.replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\r\n");
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organization_id, organizations(name, slug)")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin", "member"])
    .limit(1)
    .maybeSingle();

  if (!membership || !membership.organization_id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const orgId = membership.organization_id;
  const orgName = (membership.organizations as { name: string; slug: string })?.name ?? "workspace";
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json"; // "json" | "csv"
  const resource = searchParams.get("resource") || "all"; // "deals" | "contacts" | "tasks" | "tickets" | "all"

  const [
    { data: deals },
    { data: contacts },
    { data: companies },
    { data: tasks },
    { data: projects },
    { data: tickets },
    { data: articles },
  ] = await Promise.all([
    supabase.from("crm_deals").select("*").eq("organization_id", orgId),
    supabase.from("crm_contacts").select("*").eq("organization_id", orgId),
    supabase.from("crm_companies").select("*").eq("organization_id", orgId),
    supabase.from("project_tasks").select("*").eq("organization_id", orgId),
    supabase.from("projects").select("*").eq("organization_id", orgId),
    supabase.from("support_tickets").select("*").eq("organization_id", orgId),
    supabase.from("kb_articles").select("*").eq("organization_id", orgId),
  ]);

  if (format === "csv") {
    let csvData = "";
    let filename = `${orgName.toLowerCase().replace(/\s+/g, "_")}_export.csv`;

    if (resource === "deals") {
      csvData = jsonToCsv(deals ?? []);
      filename = `${orgName.toLowerCase().replace(/\s+/g, "_")}_deals.csv`;
    } else if (resource === "contacts") {
      csvData = jsonToCsv(contacts ?? []);
      filename = `${orgName.toLowerCase().replace(/\s+/g, "_")}_contacts.csv`;
    } else if (resource === "tasks") {
      csvData = jsonToCsv(tasks ?? []);
      filename = `${orgName.toLowerCase().replace(/\s+/g, "_")}_tasks.csv`;
    } else if (resource === "tickets") {
      csvData = jsonToCsv(tickets ?? []);
      filename = `${orgName.toLowerCase().replace(/\s+/g, "_")}_tickets.csv`;
    } else {
      csvData = jsonToCsv(deals ?? []);
    }

    return new Response(csvData, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // Full JSON export
  const exportPayload = {
    organization: orgName,
    exported_at: new Date().toISOString(),
    version: "2026.1",
    data: {
      deals: deals ?? [],
      contacts: contacts ?? [],
      companies: companies ?? [],
      tasks: tasks ?? [],
      projects: projects ?? [],
      tickets: tickets ?? [],
      articles: articles ?? [],
    },
  };

  const filename = `${orgName.toLowerCase().replace(/\s+/g, "_")}_complete_backup.json`;

  return new Response(JSON.stringify(exportPayload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
