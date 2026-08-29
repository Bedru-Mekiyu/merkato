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
      <div className="rounded-xl border border-white/10 bg-surface/90 backdrop-blur-sm p-6 text-center shadow-lg animate-scale-in">
        <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
          ✓
        </div>
        <p className="text-base font-semibold text-white mb-1">Password updated</p>
        <p className="text-sm text-white/70">Redirecting you to your dashboard…</p>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="rounded-xl border border-white/10 bg-surface/90 backdrop-blur-sm p-6 text-center shadow-lg">
        <p className="text-sm text-white/80">Verifying your security link…</p>
        <p className="text-xs text-white/40 mt-2">
          If nothing happens, your link may have expired.{" "}
          <a href="/forgot-password" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
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
        <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
          New Password
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
        <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
          Confirm New Password
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
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md px-3 py-2.5">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
        Update Password
      </Button>
    </form>
  );
}
