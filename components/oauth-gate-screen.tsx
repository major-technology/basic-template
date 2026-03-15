"use client";

import { useState } from "react";

export interface ProviderStatus {
  status: "missing" | "elevation_required";
  access?: string;
  currentAccess?: string;
  requiredAccess?: string;
  resourceId?: string;
}

interface OAuthGateScreenProps {
  providers: Record<string, ProviderStatus>;
  authUrls: Record<string, string>;
}

const PROVIDER_DISPLAY: Record<string, { name: string; logo: () => React.ReactNode }> = {
  google: { name: "Google", logo: GoogleLogo },
};

export function OAuthGateScreen({ providers, authUrls }: OAuthGateScreenProps) {
  const [oauthError] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    return params.get("oauth_error") === "declined"
      ? "Connection was declined. Please try again."
      : null;
  });

  const providerEntries = Object.entries(providers);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Connect Your Accounts
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This app needs access to the following services to work properly.
          </p>
        </div>

        {oauthError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {oauthError}
          </div>
        )}

        <div className="space-y-3">
          {providerEntries.map(([provider, status]) => {
            const authUrl = authUrls[provider];
            const isElevation = status.status === "elevation_required";
            const display = PROVIDER_DISPLAY[provider];
            const displayName = display?.name || provider.charAt(0).toUpperCase() + provider.slice(1);

            return (
              <div key={provider} className="space-y-2">
                {isElevation && (
                  <p className="text-xs text-muted-foreground">
                    This app needs{" "}
                    <span className="font-medium">{status.requiredAccess}</span>{" "}
                    access. You previously granted{" "}
                    <span className="font-medium">{status.currentAccess}</span>.
                  </p>
                )}

                <ProviderButton
                  provider={provider}
                  displayName={displayName}
                  isElevation={isElevation}
                  authUrl={authUrl}
                  logo={display?.logo}
                />
              </div>
            );
          })}
        </div>

        {providerEntries.length > 1 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Step 1 of {providerEntries.length}
          </p>
        )}
      </div>
    </div>
  );
}

function ProviderButton({
  provider,
  displayName,
  isElevation,
  authUrl,
  logo: Logo,
}: {
  provider: string;
  displayName: string;
  isElevation: boolean;
  authUrl?: string;
  logo?: () => React.ReactNode;
}) {
  const handleClick = () => {
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  if (provider === "google") {
    return (
      <button
        onClick={handleClick}
        disabled={!authUrl}
        className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-3 rounded-md border border-[#747775] bg-white px-6 text-sm font-medium text-[#1f1f1f] transition-colors hover:bg-[#f2f2f2] active:bg-[#e8e8e8] disabled:pointer-events-none disabled:opacity-50"
      >
        {Logo && <Logo />}
        <span>
          {isElevation ? "Update Google Permissions" : "Sign in with Google"}
        </span>
      </button>
    );
  }

  // Fallback for other providers
  return (
    <button
      onClick={handleClick}
      disabled={!authUrl}
      className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-3 rounded-md bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:pointer-events-none disabled:opacity-50"
    >
      <span>
        {isElevation
          ? `Update ${displayName} Permissions`
          : `Connect with ${displayName}`}
      </span>
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
