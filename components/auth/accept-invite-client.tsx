"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acceptInvitation } from "@/app/(app)/settings/invites/actions";

export function AcceptInviteClient({
  token,
  orgSlug,
}: {
  token: string;
  orgSlug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    const result = await acceptInvitation(token);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    // Redirect into the workspace the invitation just joined.
    router.push(result.orgSlug ? `/dashboard?workspace=${result.orgSlug}` : "/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md px-3 py-2.5">
          {error}
        </div>
      )}

      <Button
        onClick={handleAccept}
        loading={loading}
        size="lg"
        className="w-full"
      >
        Join Workspace
      </Button>

      <Button
        variant="ghost"
        size="md"
        onClick={() => router.push("/dashboard")}
        className="w-full"
      >
        Decline
      </Button>
    </div>
  );
}
