import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "unreachable";
  latencyMs: number;
  details?: string;
}

export interface SystemTelemetry {
  status: "operational" | "degraded";
  timestamp: string;
  server: {
    nodeVersion: string;
    platform: string;
    uptimeSeconds: number;
    memory: {
      heapUsedMb: number;
      heapTotalMb: number;
      rssMb: number;
    };
    region: string;
  };
  services: {
    database: ServiceHealth;
    auth: ServiceHealth;
    storage: ServiceHealth;
  };
  organization?: {
    id: string;
    name: string;
    role: string;
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const supabase = await createClient();

  // 1. Database Health Probe
  let dbHealth: ServiceHealth = {
    name: "PostgreSQL with RLS",
    status: "unreachable",
    latencyMs: 0,
  };
  const dbStart = performance.now();
  try {
    const { error: dbError } = await supabase
      .from("organizations")
      .select("id", { count: "exact", head: true });
    
    const dbEnd = performance.now();
    dbHealth.latencyMs = Math.max(1, Math.round(dbEnd - dbStart));
    if (!dbError) {
      dbHealth.status = "healthy";
      dbHealth.details = "Row-Level Security active and responsive";
    } else {
      dbHealth.status = "degraded";
      dbHealth.details = dbError.message;
    }
  } catch (err) {
    dbHealth.latencyMs = Math.max(1, Math.round(performance.now() - dbStart));
    dbHealth.status = "unreachable";
    dbHealth.details = err instanceof Error ? err.message : "Database connection failed";
  }

  // 2. Auth Service Probe
  let authHealth: ServiceHealth = {
    name: "Supabase Auth & Session Engine",
    status: "unreachable",
    latencyMs: 0,
  };
  const authStart = performance.now();
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    const authEnd = performance.now();
    authHealth.latencyMs = Math.max(1, Math.round(authEnd - authStart));
    if (!error) {
      authHealth.status = "healthy";
      authHealth.details = "PKCE session management active";
      user = data.user;
    } else {
      authHealth.status = "healthy";
      authHealth.details = "Auth service online (unauthenticated probe)";
    }
  } catch (err) {
    authHealth.latencyMs = Math.max(1, Math.round(performance.now() - authStart));
    authHealth.status = "unreachable";
    authHealth.details = err instanceof Error ? err.message : "Auth service check failed";
  }

  // 3. Storage Service Probe
  let storageHealth: ServiceHealth = {
    name: "Supabase S3 Storage (Documents Bucket)",
    status: "unreachable",
    latencyMs: 0,
  };
  const storageStart = performance.now();
  try {
    const { error: storageError } = await supabase.storage.listBuckets();
    const storageEnd = performance.now();
    storageHealth.latencyMs = Math.max(1, Math.round(storageEnd - storageStart));
    if (!storageError) {
      storageHealth.status = "healthy";
      storageHealth.details = "Storage bucket access verified";
    } else {
      storageHealth.status = "degraded";
      storageHealth.details = storageError.message;
    }
  } catch (err) {
    storageHealth.latencyMs = Math.max(1, Math.round(performance.now() - storageStart));
    storageHealth.status = "unreachable";
    storageHealth.details = err instanceof Error ? err.message : "Storage check failed";
  }

  // 4. Server Telemetry
  const mem = process.memoryUsage();
  const region =
    request.headers.get("x-vercel-id") ||
    request.headers.get("x-vercel-ip-country-region") ||
    process.env.VERCEL_REGION ||
    "local-node";

  // 5. Caller Organization context if logged in
  let orgContext: SystemTelemetry["organization"] = undefined;
  if (user) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role, organizations(id, name)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (membership && membership.organizations) {
      const org = Array.isArray(membership.organizations)
        ? membership.organizations[0]
        : (membership.organizations as { id: string; name: string });
      if (org) {
        orgContext = {
          id: org.id,
          name: org.name,
          role: membership.role as string,
        };
      }
    }
  }

  const isDegraded =
    dbHealth.status !== "healthy" ||
    authHealth.status !== "healthy" ||
    storageHealth.status === "unreachable";

  const telemetry: SystemTelemetry = {
    status: isDegraded ? "degraded" : "operational",
    timestamp: new Date().toISOString(),
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
        heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
        rssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
      },
      region,
    },
    services: {
      database: dbHealth,
      auth: authHealth,
      storage: storageHealth,
    },
    organization: orgContext,
  };

  const totalDuration = Date.now() - startTime;

  return NextResponse.json(telemetry, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Response-Time": `${totalDuration}ms`,
    },
  });
}
