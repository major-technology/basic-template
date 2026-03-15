import { headers } from "next/headers";
import type { ReactNode } from "react";

import { OAuthGateScreen } from "./oauth-gate-screen";
import type { ProviderStatus } from "./oauth-gate-screen";

// Pod-reachable URL for server-side API calls
const RESOURCE_API_URL =
  process.env.RESOURCE_API_URL || process.env.MAJOR_API_BASE_URL || "https://go-api.prod.major.build";

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

  // Fetch actual OAuth authorization URLs server-side (the endpoint requires auth
  // which is only available via the JWT, not from the browser).
  // No returnUrl — the client always uses a popup flow so the callback uses
  // postMessage + window.close() instead of redirecting.
  const authUrls: Record<string, string> = {};
  const gateProviders: Record<string, ProviderStatus> = {};

  for (const [provider, status] of needsConnection) {
    if (status.resourceId) {
      const params = new URLSearchParams({
        resourceId: status.resourceId,
      });

      try {
        const authRes = await fetch(
          `${RESOURCE_API_URL}/internal/user-oauth/${provider}/auth-url?${params.toString()}`,
          {
            headers: { "x-major-user-jwt": userJwt },
            cache: "no-store",
          },
        );

        if (authRes.ok) {
          const authData = (await authRes.json()) as { authUrl: string };
          authUrls[provider] = authData.authUrl;
        }
      } catch {
        // Skip this provider if we can't get the auth URL
      }
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
