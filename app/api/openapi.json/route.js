import { NextResponse } from 'next/server';
import { buildOpenApiSpec } from '@/lib/openapi/spec';

export const dynamic = 'force-dynamic';

export async function GET() {
  const spec = buildOpenApiSpec();
  return NextResponse.json(spec, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}
