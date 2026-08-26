import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import { PLANS } from '@/lib/billing/plans';
import { generateId } from '@/lib/utils/helpers';
import { logger } from '@/lib/utils/logger';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('plan');
    const topup = searchParams.get('topup');

    const bankDetails = {
      bankName: 'Opay',
      accountNumber: '9045547761',
      accountName: 'Bashir Ismail',
    };

    if (planId && PLANS[planId]) {
      const selectedPlan = PLANS[planId];
      return NextResponse.json({
        success: true,
        summary: {
          type: 'plan_upgrade',
          title: `Upgrade to ${selectedPlan.name}`,
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          credits: selectedPlan.credits,
          amountNgn: selectedPlan.priceNgn,
          reference: generateId('pay'),
          bankDetails,
        },
      });
    }

    // Default top-up package
    const creditsToBuy = Number(topup) || 5000;
    const amountNgn = creditsToBuy === 5000 ? 10000 : Math.round((creditsToBuy / 5000) * 10000);

    return NextResponse.json({
      success: true,
      summary: {
        type: 'topup',
        title: `AI Credit Top-Up (+${creditsToBuy.toLocaleString()} Credits)`,
        credits: creditsToBuy,
        amountNgn,
        reference: generateId('pay'),
        bankDetails,
      },
    });
  } catch (error) {
    logger.error('Error fetching checkout summary', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}