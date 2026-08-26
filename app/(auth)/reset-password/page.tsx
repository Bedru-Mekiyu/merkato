import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <div className="h-8 w-8 rounded-sm bg-accent flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <span className="text-lg font-semibold text-white">Merkato</span>
        </Link>

        <h1 className="text-2xl font-bold text-white mb-1.5">Choose a new password</h1>
        <p className="text-sm text-muted mb-8">
          Pick something strong — at least 8 characters.
        </p>

        <ResetPasswordForm />
      </div>
    </div>
  );
}
