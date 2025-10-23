/**
 * Health Check Endpoint
 *
 * DO NOT REMOVE OR MODIFY THIS ENDPOINT
 *
 * This endpoint is used by the deployment infrastructure to monitor
 * container health and ensure the application is running properly.
 * It returns the current server time to confirm the app is responsive.
 */
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
}
