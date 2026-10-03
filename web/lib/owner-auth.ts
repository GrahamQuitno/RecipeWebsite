import "server-only";

import { redirect } from "next/navigation";
import { getAuth0Client, isAuth0Configured } from "@/lib/auth0-client";
import { isSupabaseConfigured } from "@/lib/supabase-admin";

export function isOwnerConfigurationComplete(): boolean {
  return isAuth0Configured() && Boolean(process.env.AUTH0_OWNER_ID);
}

export async function getCurrentOwnerSession() {
  if (!isOwnerConfigurationComplete()) return null;

  const auth0 = getAuth0Client();
  const session = await auth0?.getSession();

  if (!session || session.user.sub !== process.env.AUTH0_OWNER_ID) return null;
  return session;
}

export async function requireOwner(returnTo = "/") {
  if (!isOwnerConfigurationComplete()) {
    redirect("/owner/setup?service=auth0");
  }

  const auth0 = getAuth0Client();
  const session = await auth0?.getSession();

  if (!session) {
    redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (session.user.sub !== process.env.AUTH0_OWNER_ID) {
    redirect("/");
  }

  if (!isSupabaseConfigured()) {
    redirect("/owner/setup?service=supabase");
  }

  return session;
}
