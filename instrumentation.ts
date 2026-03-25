export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initErrorReporter } = await import("@major-tech/error-reporter");
    initErrorReporter({
      endpoint:
        process.env.MAJOR_API_BASE_URL ||
        "https://go-api.prod.major.build",
      jwtToken: process.env.MAJOR_JWT_TOKEN || "",
    });
  }
}
