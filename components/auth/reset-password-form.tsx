"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase embeds the recovery token in the URL hash.
  // onAuthStateChange fires with event "PASSWORD_RECOVERY" when the page
  // loads and the hash is present — this establishes a temporary session.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  if (done) {
    return (
      <div className="rounded-md border border-border bg-surface p-5 text-center">
        <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-success text-lg">✓</span>
        </div>
        <p className="text-sm font-medium text-white mb-1">Password updated</p>
        <p className="text-sm text-muted">Redirecting you to your dashboard…</p>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="rounded-md border border-border bg-surface p-5 text-center">
        <p className="text-sm text-muted">Verifying your reset link…</p>
        <p className="text-xs text-faint mt-2">
          If nothing happens, your link may have expired.{" "}
          <a href="/forgot-password" className="text-accent hover:underline">
            Request a new one
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1.5">
          New password
        </label>
        <Input
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          minLength={8}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80 mb-1.5">
          Confirm new password
        </label>
        <Input
          type="password"
          placeholder="Same as above"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
        />
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Update password
      </Button>
    </form>
  );
}
