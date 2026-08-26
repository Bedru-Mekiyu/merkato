"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, ShieldCheck, ShieldOff, Loader2 } from "lucide-react";

type MfaStatus = "loading" | "disabled" | "enrolling" | "enabled";

export function MfaSetupClient() {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<MfaStatus>("loading");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingFactorId, setExistingFactorId] = useState<string | null>(null);

  useEffect(() => {
    checkMfaStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function checkMfaStatus() {
    const { data } = await supabase.auth.mfa.listFactors();
    const totpFactor = data?.totp?.find((f) => f.status === "verified");
    if (totpFactor) {
      setExistingFactorId(totpFactor.id);
      setStatus("enabled");
    } else {
      setStatus("disabled");
    }
  }

  async function handleEnroll() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setLoading(false);

    if (error || !data) {
      setError(error?.message ?? "Failed to start MFA setup.");
      return;
    }

    setFactorId(data.id);
    setQrUrl(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStatus("enrolling");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || code.length !== 6) return;
    setLoading(true);
    setError(null);

    // First create a challenge then verify it
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError || !challengeData) {
      setError(challengeError?.message ?? "Could not create MFA challenge.");
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    setLoading(false);

    if (verifyError) {
      setError("Incorrect code — please try again.");
      setCode("");
      return;
    }

    setStatus("enabled");
    setExistingFactorId(factorId);
    setQrUrl(null);
    setSecret(null);
    router.refresh();
  }

  async function handleUnenroll() {
    if (!existingFactorId) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.mfa.unenroll({ factorId: existingFactorId });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setStatus("disabled");
    setExistingFactorId(null);
    router.refresh();
  }

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 text-muted text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking MFA status…
      </div>
    );
  }

  if (status === "enabled") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-md border border-success/30 bg-success/10 px-4 py-3">
          <ShieldCheck className="h-5 w-5 text-success shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">
              Two-factor authentication is active
            </p>
            <p className="text-xs text-muted mt-0.5">
              Your account is protected with TOTP.
            </p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
            {error}
          </div>
        )}

        <Button
          variant="danger"
          size="sm"
          loading={loading}
          onClick={handleUnenroll}
        >
          <ShieldOff className="h-4 w-4" />
          Disable two-factor authentication
        </Button>
      </div>
    );
  }

  if (status === "enrolling" && qrUrl) {
    return (
      <div className="space-y-5">
        <div className="rounded-md border border-border bg-surface p-5">
          <p className="text-sm font-medium text-white mb-3">
            1. Scan this QR code with your authenticator app
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="MFA QR code"
            className="h-40 w-40 rounded-sm bg-white p-1"
          />
          {secret && (
            <div className="mt-3">
              <p className="text-xs text-muted mb-1">
                Or enter this key manually:
              </p>
              <code className="text-xs font-mono bg-background border border-border rounded px-2 py-1 text-white/80 break-all">
                {secret}
              </code>
            </div>
          )}
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              2. Enter the 6-digit code from your app
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
              className="tracking-widest text-center text-lg font-mono"
            />
          </div>

          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setStatus("disabled")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={loading}
              disabled={code.length !== 6}
            >
              Verify &amp; enable
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // status === "disabled"
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3">
        <Shield className="h-5 w-5 text-faint shrink-0" />
        <div>
          <p className="text-sm font-medium text-white">
            Two-factor authentication is off
          </p>
          <p className="text-xs text-muted mt-0.5">
            Enable it to protect your account with a second verification step.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
          {error}
        </div>
      )}

      <Button size="sm" loading={loading} onClick={handleEnroll}>
        <Shield className="h-4 w-4" />
        Set up authenticator app
      </Button>
    </div>
  );
}
