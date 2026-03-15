import { headers } from "next/headers";
import type { ReactNode } from "react";

import { OAuthGateScreen } from "./oauth-gate-screen";
import type { ProviderStatus } from "./oauth-gate-screen";

// Pod-reachable URL for server-side status checks
const RESOURCE_API_URL =
  process.env.RESOURCE_API_URL || process.env.MAJOR_API_BASE_URL || "https://go-api.prod.major.build";

// Browser-reachable URL for OAuth redirects (falls back to RESOURCE_API_URL for prod/staging where they're the same)
const RESOURCE_API_BROWSER_URL =
  process.env.RESOURCE_API_BROWSER_URL || RESOURCE_API_URL;

interface StatusResponseProvider {
  status: string;
  access?: string;
  currentAccess?: string;
  requiredAccess?: string;
  resourceId?: string;
}

interface StatusResponse {
  providers: Record<string, StatusResponseProvider>;
}

function buildCurrentUrl(h: Headers): string {
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("host") || "localhost";
  const path = h.get("x-forwarded-uri") || h.get("x-invoke-path") || "/";

  return `${proto}://${host}${path}`;
}

export async function OAuthGate({ children }: { children: ReactNode }) {
  const h = await headers();
  const userJwt = h.get("x-major-user-jwt");

  if (!userJwt) {
    return <>{children}</>;
  }

  let statusData: StatusResponse | null = null;

  try {
    const res = await fetch(`${RESOURCE_API_URL}/internal/user-oauth/status`, {
      headers: { "x-major-user-jwt": userJwt },
      cache: "no-store",
    });

    if (res.ok) {
      statusData = (await res.json()) as StatusResponse;
    }
  } catch {
    // Fail open — platform outage should not block deployed apps
  }

  if (!statusData) {
    return <>{children}</>;
  }

  const providers = statusData.providers;

  if (!providers || Object.keys(providers).length === 0) {
    return <>{children}</>;
  }

  // Check if all providers are connected
  const needsConnection = Object.entries(providers).filter(
    ([, p]) => p.status === "missing" || p.status === "elevation_required"
  );

  if (needsConnection.length === 0) {
    return <>{children}</>;
  }

  // Build auth URLs for providers that need connection
  const currentUrl = buildCurrentUrl(h);
  const authUrls: Record<string, string> = {};
  const gateProviders: Record<string, ProviderStatus> = {};

  for (const [provider, status] of needsConnection) {
    if (status.resourceId) {
      const params = new URLSearchParams({
        resourceId: status.resourceId,
        returnUrl: currentUrl,
      });

      authUrls[provider] = `${RESOURCE_API_BROWSER_URL}/user-oauth/${provider}/auth-url?${params.toString()}`;
    }

    gateProviders[provider] = {
      status: status.status as "missing" | "elevation_required",
      access: status.access,
      currentAccess: status.currentAccess,
      requiredAccess: status.requiredAccess,
      resourceId: status.resourceId,
    };
  }

  return <OAuthGateScreen providers={gateProviders} authUrls={authUrls} />;
}
