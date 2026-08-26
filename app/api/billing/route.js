import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaces } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { PLANS } from '@/lib/billing/plans';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import { logger } from '@/lib/utils/logger';

export async function GET(request) {
  try {
    const { workspaceId } = await getAuthContext(request);

    let workspace = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).then((r) => r[0]);

    if (!workspace) {
      workspace = await db.select().from(workspaces).where(eq(workspaces.id, 'ws_fancy_1')).then((r) => r[0]);
    }

    const planId = workspace?.planId || 'free';
    const plan = PLANS[planId] || PLANS.free;

    return NextResponse.json({
      success: true,
      data: {
        plan,
        creditsBalance: workspace?.aiCreditsBalance ?? 500,
        monthlyCreditsLimit: workspace?.monthlyCreditsLimit ?? 500,
        allPlans: Object.values(PLANS),
      },
    });
  } catch (error) {
    logger.error('Billing query error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch billing status' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { workspaceId } = await getAuthContext(request);
    const body = await request.json();
    const { action, planId, topupCredits } = body;

    if (action === 'upgrade_plan' && planId) {
      const selectedPlan = PLANS[planId];
      if (!selectedPlan) {
        return NextResponse.json({ success: false, error: 'Invalid plan selected' }, { status: 400 });
      }

      await db
        .update(workspaces)
        .set({
          planId: selectedPlan.id,
          aiCreditsBalance: sql`${workspaces.aiCreditsBalance} + ${selectedPlan.credits}`,
          monthlyCreditsLimit: selectedPlan.credits,
          updatedAt: new Date(),
        })
        .where(eq(workspaces.id, workspaceId));

      return NextResponse.json({
        success: true,
        message: `Successfully upgraded to ${selectedPlan.name}! ${selectedPlan.credits} credits added.`,
      });
    }

    if (action === 'buy_topup' && topupCredits) {
      await db
        .update(workspaces)
        .set({
          aiCreditsBalance: sql`${workspaces.aiCreditsBalance} + ${Number(topupCredits)}`,
          updatedAt: new Date(),
        })
        .where(eq(workspaces.id, workspaceId));

      return NextResponse.json({
        success: true,
        message: `Successfully added ${topupCredits} AI credits!`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid billing action' }, { status: 400 });
  } catch (error) {
    logger.error('Billing transaction error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}