import Link from "next/link";
import { getCurrentOwnerSession, isOwnerConfigurationComplete } from "@/lib/owner-auth";
import { isSupabaseConfigured } from "@/lib/supabase-admin";

export async function SiteFooter() {
  const ownerSession = await getCurrentOwnerSession();
  const canEdit = Boolean(ownerSession && isSupabaseConfigured());

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <span className="site-footer__mark" aria-hidden="true">
          ✳
        </span>
        <p>A small collection for everyday cooking.</p>
        <div className="site-footer__actions">
          {ownerSession ? (
            <>
              {canEdit ? (
                <Link className="site-footer__owner-link" href="/owner/recipes/new">
                  Owner tools
                </Link>
              ) : (
                <Link className="site-footer__owner-link" href="/owner/setup?service=supabase">
                  Finish owner setup
                </Link>
              )}
              <a className="site-footer__owner-link" href="/auth/logout">
                Sign out
              </a>
            </>
          ) : isOwnerConfigurationComplete() ? (
            <a className="site-footer__owner-link" href="/auth/login?screen_hint=login">
              Owner sign in
            </a>
          ) : (
            <Link className="site-footer__owner-link" href="/owner/setup">
              Owner sign-in setup
            </Link>
          )}
          <span className="site-footer__note">Made to be cooked from</span>
        </div>
      </div>
    </footer>
  );
}
