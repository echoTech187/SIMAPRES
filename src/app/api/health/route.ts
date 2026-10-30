import { NextResponse } from 'next/server';
import { pingDatabaseHealth } from '@/infrastructure/db/prisma.client';

export const dynamic = 'force-dynamic';

/**
 * Health check & database latency telemetry endpoint (SIMAPRES 110 Enterprise)
 */
export async function GET() {
  const dbHealth = await pingDatabaseHealth();

  const responseBody = {
    status: dbHealth.ok ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      engine: 'TiDB Cloud Serverless (MySQL 8.0 Protocol)',
      connection: dbHealth.ok ? 'CONNECTED' : 'DISCONNECTED',
      latencyMs: dbHealth.latencyMs,
      error: dbHealth.error,
    },
    version: '1.1.0-enterprise.v4.0',
  };

  return NextResponse.json(responseBody, {
    status: dbHealth.ok ? 200 : 503,
  });
}
