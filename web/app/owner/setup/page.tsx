import Link from "next/link";
import { isOwnerConfigurationComplete } from "@/lib/owner-auth";
import { isSupabaseConfigured } from "@/lib/supabase-admin";

export default function OwnerSetupPage() {
  const authConfigured = isOwnerConfigurationComplete();
  const databaseConfigured = isSupabaseConfigured();
  const intro =
    authConfigured && !databaseConfigured
      ? "Auth0 is configured, but the recipe database is not configured yet."
      : !authConfigured
        ? "Owner editing needs Auth0 sign-in and a Supabase database before it can be used."
        : databaseConfigured
          ? "Auth0 and Supabase credentials are present. Confirm that the schema below has been applied before opening the owner tools."
          : "Owner editing needs a Supabase database before it can be used.";

  return (
    <main className="page-frame owner-page">
      <p className="eyebrow">Owner setup</p>
      <h1>Connect the owner tools</h1>
      <p className="owner-page__intro">{intro}</p>

      <ol className="owner-setup-list">
        <li>
          Create an Auth0 Regular Web Application and disable public sign-up so only your
          pre-created owner can use Universal Login. Add <code>http://localhost:3000/auth/callback</code>
          and your deployed callback to Allowed Callback URLs. Add the local and production origins
          to Allowed Web Origins and Allowed Logout URLs.
        </li>
        <li>
          Create a Supabase project and run <code>web/supabase/schema.sql</code> from its SQL Editor.
          The script creates the recipe tables and the public <code>recipe-photos</code> bucket for
          JPEG, PNG, and WebP images up to 3 MiB. Recipes are public, so their photos are public too;
          the app uses its server-only key for photo changes.
        </li>
        <li>
          Copy <code>web/.env.example</code> to <code>web/.env.local</code>, fill in the credentials,
          and set <code>AUTH0_OWNER_ID</code> to your Auth0 user&apos;s <code>sub</code> value.
        </li>
      </ol>

      <p className="owner-setup-note">
        Never put Auth0 secrets or the Supabase secret key in a variable prefixed with
        <code> NEXT_PUBLIC_</code>. Use a Supabase Secret API key where available; an existing
        <code> service_role</code> key is also accepted. Add the same server-side values to Vercel
        before deploying.
      </p>
      <p className="owner-setup-note">
        Set <code>SUPABASE_URL</code> in the Vercel build environment too. Next.js uses it to allow
        recipe photos from that project when rendering public pages.
      </p>
      <Link className="back-link" href="/">
        <span aria-hidden="true">←</span> Back to recipes
      </Link>
    </main>
  );
}
