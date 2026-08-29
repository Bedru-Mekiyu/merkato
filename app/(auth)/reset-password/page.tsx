import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background selection:bg-primary/30">
      <div className="w-full max-w-[380px] animate-fade-in-up">
        <div className="rounded-xl border border-white/[0.08] bg-surface p-6 sm:p-7 shadow-xl">
          <div className="mb-5">
            <h1 className="text-lg font-semibold text-white tracking-tight">
              Choose a new password
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Pick a secure password of at least 8 characters.
            </p>
          </div>

          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
