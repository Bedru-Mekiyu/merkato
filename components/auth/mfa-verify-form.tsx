"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function MfaVerifyForm() {
  const router = useRouter();
  const supabase = createClient();

  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Find the enrolled TOTP factor for the current user
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const totp = data?.totp?.find((f) => f.status === "verified");
      if (totp) setFactorId(totp.id);
      else router.replace("/dashboard"); // No MFA enrolled, skip
    });
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || code.length !== 6) return;
    setLoading(true);
    setError(null);

    const { data: challenge, error: challengeErr } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeErr || !challenge) {
      setError(challengeErr?.message ?? "Could not create challenge.");
      setLoading(false);
      return;
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    setLoading(false);

    if (verifyErr) {
      setError("Incorrect code — please try again.");
      setCode("");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
          6-Digit Security Code
        </label>
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          autoFocus
          className="tracking-[0.3em] text-center text-lg font-mono"
        />
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md px-3 py-2.5">
          {error}
        </div>
      )}

      <Button
        type="submit"
        loading={loading}
        size="lg"
        disabled={code.length !== 6}
        className="w-full mt-2"
      >
        Verify & Continue
      </Button>

      <p className="text-xs text-white/40 text-center">
        Lost access to your authenticator?{" "}
        <a href="mailto:support@merkato.app" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          Contact support
        </a>
      </p>
    </form>
  );
}
