import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

const RESOURCE_API_URL =
  process.env.RESOURCE_API_URL || process.env.MAJOR_API_BASE_URL || "https://go-api.prod.major.build";

interface StatusResponse {
  providers: Record<string, { status: string }>;
  connectToken?: string;
}

/**
 * OAuthGate — server component that checks whether the current user has
 * connected all required OAuth providers for this app. If any are missing,
 * it redirects to the platform-hosted connect page (served by go-api) where
 * the user can authenticate. After all providers are connected, the connect
 * page redirects back here and the app renders normally.
 */
export async function OAuthGate({ children }: { children: ReactNode }) {
  const h = await headers();
  const userJwt = h.get("x-major-user-jwt");

  if (!userJwt) {
    return <>{children}</>;
  }

  try {
    const res = await fetch(`${RESOURCE_API_URL}/user-oauth/status`, {
      headers: { "x-major-user-jwt": userJwt },
      cache: "no-store",
    });

    if (!res.ok) {
      // Fail open — platform outage should not block deployed apps
      return <>{children}</>;
    }

    const data = (await res.json()) as StatusResponse;

    if (data.connectToken) {
      const proto = h.get("x-forwarded-proto") || "https";
      const host = h.get("host");
      const currentUrl = `${proto}://${host}/`;
      const connectUrl = `${RESOURCE_API_URL}/user-oauth/connect?token=${encodeURIComponent(data.connectToken)}&returnUrl=${encodeURIComponent(currentUrl)}`;
      redirect(connectUrl);
    }
  } catch {
    // Fail open — network error should not block deployed apps
  }

  return <>{children}</>;
}
