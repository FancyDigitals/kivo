import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentClaims, workspaces } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import { PLANS } from '@/lib/billing/plans';
import { generateId } from '@/lib/utils/helpers';
import { logger } from '@/lib/utils/logger';

// Pre-defined activation voucher codes you can share directly with customers
const VOUCHER_CODES = {
  'FANCY-PRO-2025': { type: 'plan_upgrade', planId: 'pro', credits: 15000 },
  'KIVO-BOOST-10K': { type: 'topup', credits: 10000 },
  'STARTUP-FREE-500': { type: 'topup', credits: 500 },
};

export async function POST(request) {
  try {
    const { workspaceId, userId } = await getAuthContext(request);
    const body = await request.json();
    const { claimType, planId, credits, amountNgn, senderNameOrRef, voucherCode } = body;

    // 1. INSTANT VOUCHER / ACTIVATION CODE CLAIM
    if (voucherCode) {
      const code = voucherCode.trim().toUpperCase();
      const voucher = VOUCHER_CODES[code];

      if (!voucher) {
        return NextResponse.json({ success: false, error: 'Invalid or expired activation voucher code.' }, { status: 400 });
      }

      if (voucher.type === 'plan_upgrade') {
        const selectedPlan = PLANS[voucher.planId] || PLANS.pro;
        await db
          .update(workspaces)
          .set({
            planId: selectedPlan.id,
            aiCreditsBalance: sql`${workspaces.aiCreditsBalance} + ${selectedPlan.credits}`,
            monthlyCreditsLimit: selectedPlan.credits,
            updatedAt: new Date(),
          })
          .where(eq(workspaces.id, workspaceId));

        logger.info(`Voucher ${code} applied to workspace ${workspaceId}: Plan Upgraded to ${selectedPlan.name}`);
        return NextResponse.json({
          success: true,
          message: `Voucher Applied! Workspace upgraded to ${selectedPlan.name} with ${selectedPlan.credits.toLocaleString()} Credits added!`,
        });
      }

      // Top-up voucher
      await db
        .update(workspaces)
        .set({
          aiCreditsBalance: sql`${workspaces.aiCreditsBalance} + ${voucher.credits}`,
          updatedAt: new Date(),
        })
        .where(eq(workspaces.id, workspaceId));

      return NextResponse.json({
        success: true,
        message: `Voucher Applied! +${voucher.credits.toLocaleString()} AI Credits added!`,
      });
    }

    // 2. BANK TRANSFER PROOF / SENDER REF SUBMISSION
    if (!senderNameOrRef) {
      return NextResponse.json({ success: false, error: 'Please enter Sender Name or Transfer Reference' }, { status: 400 });
    }

    const claimRecord = {
      id: generateId('claim'),
      workspaceId,
      userId,
      type: claimType || 'topup',
      planId: planId || null,
      credits: Number(credits || 5000),
      amountNgn: String(amountNgn || 10000),
      paymentMethod: 'bank_transfer',
      senderNameOrRef: senderNameOrRef.trim(),
      status: 'pending',
    };

    await db.insert(paymentClaims).values(claimRecord);

    logger.info(`Payment claim submitted for workspace ${workspaceId}: Ref "${senderNameOrRef}"`);

    return NextResponse.json({
      success: true,
      message: 'Payment proof submitted successfully! Your claim is under review and will be approved shortly.',
      claim: claimRecord,
    });
  } catch (error) {
    logger.error('Error submitting payment claim', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}