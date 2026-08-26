import { requireOrgContext } from "@/lib/org-context";
import { MfaSetupClient } from "@/components/auth/mfa-setup-client";

export default async function MfaSetupPage() {
  await requireOrgContext();
  return (
    <div className="px-6 sm:px-8 py-8 max-w-md mx-auto">
      <h1 className="text-lg font-semibold text-white mb-1.5">
        Two-Factor Authentication
      </h1>
      <p className="text-sm text-muted mb-8">
        Add an extra layer of security to your account using an authenticator
        app (Google Authenticator, Authy, 1Password, etc.).
      </p>
      <MfaSetupClient />
    </div>
  );
}
