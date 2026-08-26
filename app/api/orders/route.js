import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import { logger } from '@/lib/utils/logger';

export async function GET(request) {
  try {
    const { workspaceId } = await getAuthContext(request);
    const list = await db.select().from(orders).where(eq(orders.workspaceId, workspaceId));
    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    logger.error('Failed to fetch orders from database', error);
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
}