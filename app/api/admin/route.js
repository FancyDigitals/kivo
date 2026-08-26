import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentClaims, workspaces, users, bots } from '@/lib/db/schema';
import { eq, sql, count } from 'drizzle-orm';
import { PLANS } from '@/lib/billing/plans';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  try {
    const claimsList = await db
      .select({
        id: paymentClaims.id,
        workspaceId: paymentClaims.workspaceId,
        workspaceName: workspaces.name,
        type: paymentClaims.type,
        planId: paymentClaims.planId,
        credits: paymentClaims.credits,
        amountNgn: paymentClaims.amountNgn,
        senderNameOrRef: paymentClaims.senderNameOrRef,
        status: paymentClaims.status,
        createdAt: paymentClaims.createdAt,
      })
      .from(paymentClaims)
      .innerJoin(workspaces, eq(paymentClaims.workspaceId, workspaces.id));

    const totalWorkspaces = await db.select({ value: count() }).from(workspaces).then((r) => r[0]?.value || 0);
    const activeBots = await db.select({ value: count() }).from(bots).then((r) => r[0]?.value || 0);

    return NextResponse.json({
      success: true,
      data: {
        totalWorkspaces,
        activeBots,
        pendingClaims: claimsList.filter((c) => c.status === 'pending'),
        allClaims: claimsList,
      },
    });
  } catch (error) {
    logger.error('Admin data fetch error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, claimId } = body;

    if (action === 'approve_claim' && claimId) {
      const claim = await db.select().from(paymentClaims).where(eq(paymentClaims.id, claimId)).then((r) => r[0]);

      if (!claim) {
        return NextResponse.json({ success: false, error: 'Claim record not found' }, { status: 404 });
      }

      if (claim.type === 'plan_upgrade' && claim.planId) {
        const selectedPlan = PLANS[claim.planId] || PLANS.pro;
        await db
          .update(workspaces)
          .set({
            planId: selectedPlan.id,
            aiCreditsBalance: sql`${workspaces.aiCreditsBalance} + ${selectedPlan.credits}`,
            monthlyCreditsLimit: selectedPlan.credits,
            updatedAt: new Date(),
          })
          .where(eq(workspaces.id, claim.workspaceId));
      } else {
        await db
          .update(workspaces)
          .set({
            aiCreditsBalance: sql`${workspaces.aiCreditsBalance} + ${claim.credits}`,
            updatedAt: new Date(),
          })
          .where(eq(workspaces.id, claim.workspaceId));
      }

      await db.update(paymentClaims).set({ status: 'approved', updatedAt: new Date() }).where(eq(paymentClaims.id, claimId));

      logger.info(`SuperAdmin approved payment claim ${claimId} for workspace ${claim.workspaceId}`);

      return NextResponse.json({ success: true, message: 'Payment claim approved & workspace credited!' });
    }

    return NextResponse.json({ success: false, error: 'Invalid admin action' }, { status: 400 });
  } catch (error) {
    logger.error('Admin claim approval error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}