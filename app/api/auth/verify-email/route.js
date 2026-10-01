import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashVerificationToken } from '@/lib/auth/email-verification';
import { logger } from '@/lib/utils/logger';

export async function POST(request) {
  try {
    const body = await request.json();

    const email = String(body.email || '')
      .toLowerCase()
      .trim();

    const token = String(body.token || '').trim();

    if (!email || !token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification link is invalid.',
        },
        { status: 400 }
      );
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .then((rows) => rows[0]);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account not found.',
        },
        { status: 404 }
      );
    }

    // Already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: 'Email is already verified.',
      });
    }

    // Missing verification data
    if (
      !user.emailVerificationTokenHash ||
      !user.emailVerificationExpiresAt
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'This verification link is invalid.',
        },
        { status: 400 }
      );
    }

    // Expired token
    if (
      new Date(user.emailVerificationExpiresAt).getTime() <
      Date.now()
    ) {
      return NextResponse.json(
        {
          success: false,
          expired: true,
          error:
            'This verification link has expired. Please request a new one.',
        },
        { status: 400 }
      );
    }

    // Verify token
    const tokenHash = hashVerificationToken(token);

    if (tokenHash !== user.emailVerificationTokenHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid verification link.',
        },
        { status: 400 }
      );
    }

    // Mark email as verified
    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    logger.info(
      `Email verified successfully: ${user.email}`
    );

    return NextResponse.json({
      success: true,
      alreadyVerified: false,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    logger.error('Email verification error', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to verify email.',
      },
      { status: 500 }
    );
  }
}