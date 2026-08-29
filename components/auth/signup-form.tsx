"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { safeNextPath } from "@/lib/navigation";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const next = safeNextPath(searchParams.get("next"));
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (next) callbackUrl.searchParams.set("next", next);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // If email confirmation is required, Supabase returns a user with no
    // session yet. Otherwise we already have a session and can proceed.
    if (data.session) {
      router.push(next ?? "/onboarding");
      router.refresh();
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-white/10 bg-surface/90 backdrop-blur-sm p-6 text-center shadow-lg animate-scale-in">
        <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
          ✓
        </div>
        <p className="text-base text-white font-semibold mb-1">
          Check your email
        </p>
        <p className="text-sm text-white/70 leading-relaxed">
          We sent a verification link to <span className="text-white font-medium">{email}</span>. Click it to activate your workspace access.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
          Full Name
        </label>
        <Input
          type="text"
          placeholder="Abebe Bikila"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
          Work Email
        </label>
        <Input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
          Password
        </label>
        <Input
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
        />
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md px-3 py-2.5">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
        Create Your Workspace
      </Button>

      <p className="text-[11px] text-white/40 text-center leading-relaxed">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}
