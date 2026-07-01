export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initErrorReporter } = await import("@major-tech/error-reporter");
    initErrorReporter({
      endpoint:
        process.env.MAJOR_API_BASE_URL ||
        "https://go-api.prod.major.build",
      jwtToken: process.env.MAJOR_JWT_TOKEN || "",
      applicationId:
        process.env.APPLICATION_ID || process.env.MAJOR_APPLICATION_ID,
    });
  }
}

export async function onRequestError(
  err: Error & { digest?: string },
  request: { path: string; method: string; headers: Record<string, string> },
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
    renderSource?: string;
  },
) {
  const { captureRequestError } = await import("@major-tech/error-reporter");
  await captureRequestError(err, request, context);
}
