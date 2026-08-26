import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import { logger } from '@/lib/utils/logger';

export async function GET(request) {
  try {
    const { workspaceId } = await getAuthContext(request);
    const list = await db.select().from(leads).where(eq(leads.workspaceId, workspaceId));
    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    logger.error('Failed to fetch leads from database', error);
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
}