import Link from "next/link";
import { MfaVerifyForm } from "@/components/auth/mfa-verify-form";

export default function VerifyMfaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <div className="h-8 w-8 rounded-sm bg-accent flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <span className="text-lg font-semibold text-white">Merkato</span>
        </Link>

        <h1 className="text-2xl font-bold text-white mb-1.5">
          Two-factor verification
        </h1>
        <p className="text-sm text-muted mb-8">
          Open your authenticator app and enter the 6-digit code for Merkato.
        </p>

        <MfaVerifyForm />
      </div>
    </div>
  );
}
