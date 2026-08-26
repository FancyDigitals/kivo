import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaces } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import { PLANS } from '@/lib/billing/plans';
import { logger } from '@/lib/utils/logger';

export async function GET(request) {
  try {
    const { workspaceId } = await getAuthContext(request);

    let workspace = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).then((r) => r[0]);

    if (!workspace) {
      workspace = await db.select().from(workspaces).where(eq(workspaces.id, 'ws_fancy_1')).then((r) => r[0]);
    }

    const planObj = PLANS[workspace?.planId || 'free'] || PLANS.free;

    return NextResponse.json({
      success: true,
      data: {
        ...workspace,
        planName: planObj.name,
      },
    });
  } catch (error) {
    logger.error('Error fetching workspace from database', error);
    return NextResponse.json({ success: false, error: 'Failed to load workspace' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { workspaceId } = await getAuthContext(request);
    const body = await request.json();
    const { name, notificationEmail, defaultCurrency, timezone } = body;

    await db
      .update(workspaces)
      .set({
        name: name,
        settings: {
          notificationEmail,
          currency: defaultCurrency,
          timezone,
        },
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspaceId));

    const updated = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).then((r) => r[0]);
    const planObj = PLANS[updated?.planId || 'free'] || PLANS.free;

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        planName: planObj.name,
      },
    });
  } catch (error) {
    logger.error('Error updating workspace settings', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}