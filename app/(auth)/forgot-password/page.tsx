import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <div className="h-8 w-8 rounded-sm bg-accent flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <span className="text-lg font-semibold text-white">Merkato</span>
        </Link>

        <h1 className="text-2xl font-bold text-white mb-1.5">Reset your password</h1>
        <p className="text-sm text-muted mb-8">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <ForgotPasswordForm />

        <p className="mt-6 text-sm text-muted text-center">
          Remembered it?{" "}
          <Link href="/login" className="text-accent hover:text-accent-hover font-medium">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
