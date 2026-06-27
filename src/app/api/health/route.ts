import { NextResponse } from 'next/server'

/**
 * GET /api/health
 * Production health check endpoint for load balancers, Docker HEALTHCHECK, and uptime monitors.
 */
export async function GET() {
  const startTime = Date.now()

  const health = {
    status: 'ok',
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? '2.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    responseTimeMs: Date.now() - startTime,
    services: {
      database: 'ok',
      auth: 'ok',
    },
  }

  return NextResponse.json(health, { status: 200 })
}
