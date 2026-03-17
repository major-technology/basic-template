import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

const RESOURCE_API_URL = process.env.RESOURCE_API_URL;
const MAJOR_APP_URL = process.env.MAJOR_APP_URL;

interface StatusResponse {
  providers: Record<string, { status: string }>;
  connectToken?: string;
}

async function getConnectToken(userJwt: string): Promise<string | null> {
  if (!RESOURCE_API_URL) {
    return null;
  }

  try {
    const res = await fetch(`${RESOURCE_API_URL}/user-oauth/status`, {
      headers: { "x-major-user-jwt": userJwt },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as StatusResponse;
    return data.connectToken ?? null;
  } catch {
    // Fail open — platform/network issues should not block deployed apps
    return null;
  }
}

/**
 * OAuthGate — server component that checks whether the current user has
 * connected all required OAuth providers for this app. If any are missing,
 * it redirects to the platform-hosted connect page on the Major dashboard
 * where the user can authenticate. After all providers are connected, the
 * connect page redirects back here and the app renders normally.
 */
export async function OAuthGate({ children }: { children: ReactNode }) {
  if (!MAJOR_APP_URL) {
    return <>{children}</>;
  }

  const h = await headers();
  const userJwt = h.get("x-major-user-jwt");

  if (!userJwt) {
    return <>{children}</>;
  }

  const connectToken = await getConnectToken(userJwt);

  if (connectToken) {
    const proto = h.get("x-forwarded-proto") || "https";
    const host = h.get("host");
    const returnUrl = `${proto}://${host}/`;
    redirect(`${MAJOR_APP_URL}/oauth/connect?token=${encodeURIComponent(connectToken)}&returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  return <>{children}</>;
}
