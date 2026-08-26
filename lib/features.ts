/**
 * Feature flags read from public env vars. Lives outside any component
 * tree so both Server Components and Client Components can call it.
 */
export function oauthEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_GITHUB_OAUTH_ENABLED === "true"
  );
}
