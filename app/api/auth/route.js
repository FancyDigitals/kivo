import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  users,
  workspaces,
  bots,
  workspaceMembers,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

import {
  hashPassword,
  comparePassword,
  signJwtToken,
} from '@/lib/auth/session';

import { generateId } from '@/lib/utils/helpers';
import { buildSystemPrompt } from '@/lib/ai/prompts/builder';
import { logger } from '@/lib/utils/logger';

import {
  generateVerificationToken,
  hashVerificationToken,
  getVerificationExpiry,
} from '@/lib/auth/email-verification';

import { sendVerificationEmail } from '@/lib/auth/send-verification-email';

import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  getPasswordResetExpiry,
} from '@/lib/auth/password-reset';

import { sendPasswordResetEmail } from '@/lib/auth/send-password-reset-email';

export async function POST(request) {
  try {
    let body = {};

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON request body.',
        },
        { status: 400 }
      );
    }

    const {
      action,
      email,
      password,
      fullName,
      businessName,
      workspaceName,
      currentPassword,
      newPassword,
    } = body;

    const cleanEmail = email
      ? String(email).toLowerCase().trim()
      : '';

    // ====================================================
    // ACTION RESOLVER
    // ====================================================

    let resolvedAction = String(action || '')
      .toLowerCase()
      .trim();

    if (!resolvedAction) {
      if (currentPassword || body.oldPassword || newPassword) {
        resolvedAction = 'change-password';
      } else if (body.token && (body.newPassword || body.password)) {
        resolvedAction = 'reset-password';
      } else if (body.forgotPassword || body.resetPassword) {
        resolvedAction = 'forgot-password';
      } else if (fullName || body.name || businessName) {
        resolvedAction = 'signup';
      } else if (cleanEmail && password) {
        resolvedAction = 'login';
      }
    }

    // Normalize action names

    if (
      ['signup', 'sign-up', 'sign_up', 'register'].includes(
        resolvedAction
      )
    ) {
      resolvedAction = 'signup';
    }

    if (
      ['login', 'log-in', 'log_in', 'signin', 'sign-in'].includes(
        resolvedAction
      )
    ) {
      resolvedAction = 'login';
    }

    if (
      [
        'change-password',
        'changepassword',
        'change_password',
        'update-password',
      ].includes(resolvedAction)
    ) {
      resolvedAction = 'change-password';
    }

    if (
      [
        'forgot-password',
        'forgotpassword',
        'forgot_password',
        'password-reset-request',
      ].includes(resolvedAction)
    ) {
      resolvedAction = 'forgot-password';
    }

    if (
      [
        'reset-password',
        'resetpassword',
        'reset_password',
      ].includes(resolvedAction)
    ) {
      resolvedAction = 'reset-password';
    }

    if (
      ['logout', 'log-out', 'log_out', 'signout', 'sign-out'].includes(
        resolvedAction
      )
    ) {
      resolvedAction = 'logout';
    }

    // ====================================================
    // 1. SIGNUP
    // ====================================================

    if (resolvedAction === 'signup') {
      const name = String(
        fullName || body.name || ''
      ).trim();

      const companyName = String(
        businessName || workspaceName || ''
      ).trim();

      if (!cleanEmail || !password || !name || !companyName) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Full Name, Business Name, Email, and Password are required.',
          },
          { status: 400 }
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          {
            success: false,
            error: 'Password must be at least 8 characters.',
          },
          { status: 400 }
        );
      }

      // Check existing user

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, cleanEmail))
        .then((rows) => rows[0])
        .catch((error) => {
          logger.error(
            'DB error checking existing user',
            error
          );
          return null;
        });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error:
              'An account with this email already exists.',
          },
          { status: 400 }
        );
      }

      // Generate IDs

      const userId = generateId('usr');
      const workspaceId = generateId('ws');
      const botId = generateId('bot');

      // Hash password

      const hashedPassword =
        await hashPassword(password);

      // Email verification

      const verificationToken =
        generateVerificationToken();

      const verificationTokenHash =
        hashVerificationToken(
          verificationToken
        );

      const verificationExpiresAt =
        getVerificationExpiry();

      // Workspace slug

      const baseSlug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const slug = `${baseSlug}-${Math.floor(
        100 + Math.random() * 900
      )}`;

      // Create user

      await db.insert(users).values({
        id: userId,
        email: cleanEmail,
        passwordHash: hashedPassword,
        fullName: name,
        role: 'user',
        isActive: true,
        emailVerificationTokenHash:
          verificationTokenHash,
        emailVerificationExpiresAt:
          verificationExpiresAt,
      });

      // Create workspace

      await db.insert(workspaces).values({
        id: workspaceId,
        name: companyName,
        slug,
        ownerId: userId,
        planId: 'free',
        aiCreditsBalance: 500,
        monthlyCreditsLimit: 500,
      });

      // Create workspace member

      await db.insert(workspaceMembers).values({
        id: generateId('member'),
        workspaceId,
        userId,
        role: 'owner',
      });

      // Create default bot

      const defaultSystemPrompt =
        buildSystemPrompt({
          botName: `${companyName} Assistant`,
          businessName: companyName,
          industry: 'business',
          personality: 'professional',
          language: 'en',
        });

      await db.insert(bots).values({
        id: botId,
        workspaceId,
        name: `${companyName} Assistant`,
        businessName: companyName,
        industry: 'business',
        description: 'Autonomous AI Assistant',
        personality: 'professional',
        language: 'en',
        status: 'active',
        primaryProvider: 'groq',
        primaryModel: 'llama-3.1-8b-instant',
        welcomeMessage: `Welcome to *${companyName}*! How can I assist you today?`,
        systemPromptOverride:
          defaultSystemPrompt,
      });

      // Send verification email

      try {
        await sendVerificationEmail({
          email: cleanEmail,
          fullName: name,
          token: verificationToken,
        });
      } catch (error) {
        logger.error(
          'Failed to send verification email',
          error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              'Your account was created, but we could not send the verification email. Please try again.',
          },
          { status: 500 }
        );
      }

      logger.info(
        `New signup created: ${companyName} (${workspaceId})`
      );

      // IMPORTANT:
      // Account exists but no session is created.
      // User must verify their email first.

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        message:
          'Verification link sent. Please check your email to verify your account.',
        user: {
          id: userId,
          email: cleanEmail,
          fullName: name,
          workspaceId,
          workspaceName: companyName,
        },
        workspace: {
          id: workspaceId,
          name: companyName,
        },
      });
    }

    // ====================================================
    // 2. LOGIN
    // ====================================================

    if (resolvedAction === 'login') {
      if (!cleanEmail || !password) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email and password are required.',
          },
          { status: 400 }
        );
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, cleanEmail))
        .then((rows) => rows[0])
        .catch((error) => {
          logger.error(
            'DB error during login',
            error
          );
          return null;
        });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid email or password.',
          },
          { status: 401 }
        );
      }

      const isPasswordValid =
        await comparePassword(
          password,
          user.passwordHash
        );

      if (!isPasswordValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid email or password.',
          },
          { status: 401 }
        );
      }

      // Email verification required

      if (!user.emailVerified) {
        return NextResponse.json(
          {
            success: false,
            requiresVerification: true,
            error:
              'Please verify your email before signing in.',
          },
          { status: 403 }
        );
      }

      // Account status

      if (!user.isActive) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Your account has been disabled.',
          },
          { status: 403 }
        );
      }

      // Get workspace

      const userWorkspace = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.ownerId, user.id))
        .then((rows) => rows[0])
        .catch((error) => {
          logger.error(
            'DB error fetching user workspace',
            error
          );
          return null;
        });

      if (!userWorkspace) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Your workspace could not be found.',
          },
          { status: 500 }
        );
      }

      const workspaceId =
        userWorkspace.id;

      const companyName =
        userWorkspace.name;

      // Create session

      const token = signJwtToken(
        {
          userId: user.id,
          workspaceId,
          email: user.email,
          role: user.role,
        },
        user.passwordHash
      );

      // Update last login

      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      const response =
        NextResponse.json({
          success: true,
          message:
            'Signed in successfully!',
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            workspaceId,
            workspaceName:
              companyName,
          },
          workspace: {
            id: workspaceId,
            name: companyName,
          },
        });

      response.cookies.set(
        'kivo_session',
        token,
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV ===
            'production',
          sameSite: 'lax',
          maxAge:
            60 * 60 * 24 * 7,
          path: '/',
        }
      );

      return response;
    }

    // ====================================================
    // 3. FORGOT PASSWORD
    // ====================================================

    if (
      resolvedAction ===
      'forgot-password'
    ) {
      if (!cleanEmail) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Email address is required.',
          },
          { status: 400 }
        );
      }

      const user = await db
        .select()
        .from(users)
        .where(
          eq(users.email, cleanEmail)
        )
        .then((rows) => rows[0])
        .catch((error) => {
          logger.error(
            'DB error finding user for password reset',
            error
          );
          return null;
        });

      // Always return the same response
      // whether the account exists or not.

      if (!user) {
        return NextResponse.json({
          success: true,
          message:
            'If an account exists for this email, a password reset link has been sent.',
        });
      }

      const resetToken =
        generatePasswordResetToken();

      const resetTokenHash =
        hashPasswordResetToken(
          resetToken
        );

      const resetExpiresAt =
        getPasswordResetExpiry();

      await db
        .update(users)
        .set({
          passwordResetTokenHash:
            resetTokenHash,
          passwordResetExpiresAt:
            resetExpiresAt,
          updatedAt: new Date(),
        })
        .where(
          eq(users.id, user.id)
        );

      try {
        await sendPasswordResetEmail({
          email: user.email,
          fullName: user.fullName,
          token: resetToken,
        });
      } catch (error) {
        logger.error(
          'Failed to send password reset email',
          error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              'We could not send the password reset email. Please try again.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          'If an account exists for this email, a password reset link has been sent.',
      });
    }

    // ====================================================
    // 4. RESET PASSWORD
    // ====================================================

    if (
      resolvedAction ===
      'reset-password'
    ) {
      const resetToken =
        String(
          body.token || ''
        ).trim();

      const newPass =
        String(
          body.newPassword ||
            body.password ||
            ''
        );

      if (!resetToken || !newPass) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Reset token and new password are required.',
          },
          { status: 400 }
        );
      }

      if (newPass.length < 8) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Password must be at least 8 characters.',
          },
          { status: 400 }
        );
      }

      const resetTokenHash =
        hashPasswordResetToken(
          resetToken
        );

      const user = await db
        .select()
        .from(users)
        .where(
          eq(
            users.passwordResetTokenHash,
            resetTokenHash
          )
        )
        .then((rows) => rows[0])
        .catch((error) => {
          logger.error(
            'DB error finding user for password reset',
            error
          );
          return null;
        });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error:
              'This password reset link is invalid or has expired.',
          },
          { status: 400 }
        );
      }

      if (
        !user.passwordResetExpiresAt ||
        new Date(
          user.passwordResetExpiresAt
        ) < new Date()
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'This password reset link has expired. Please request a new one.',
          },
          { status: 400 }
        );
      }

      const newHashedPassword =
        await hashPassword(newPass);

      await db
        .update(users)
        .set({
          passwordHash:
            newHashedPassword,
          passwordResetTokenHash:
            null,
          passwordResetExpiresAt:
            null,
          updatedAt: new Date(),
        })
        .where(
          eq(users.id, user.id)
        );

      logger.info(
        `Password reset completed for user: ${user.email}`
      );

      return NextResponse.json({
        success: true,
        message:
          'Your password has been reset successfully. You can now sign in.',
      });
    }

    // ====================================================
    // 5. CHANGE PASSWORD
    // ====================================================

    if (
      resolvedAction ===
      'change-password'
    ) {
      const oldPass =
        currentPassword ||
        body.oldPassword;

      const newPass =
        newPassword ||
        password;

      if (
        !cleanEmail ||
        !oldPass ||
        !newPass
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Email, current password, and new password are required.',
          },
          { status: 400 }
        );
      }

      if (newPass.length < 8) {
        return NextResponse.json(
          {
            success: false,
            error:
              'New password must be at least 8 characters.',
          },
          { status: 400 }
        );
      }

      const user = await db
        .select()
        .from(users)
        .where(
          eq(users.email, cleanEmail)
        )
        .then((rows) => rows[0])
        .catch((error) => {
          logger.error(
            'DB error finding user for password change',
            error
          );
          return null;
        });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error:
              'User account not found.',
          },
          { status: 404 }
        );
      }

      const isPasswordValid =
        await comparePassword(
          oldPass,
          user.passwordHash
        );

      if (!isPasswordValid) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Incorrect current password.',
          },
          { status: 400 }
        );
      }

      const newHashedPassword =
        await hashPassword(newPass);

      await db
        .update(users)
        .set({
          passwordHash:
            newHashedPassword,
          updatedAt: new Date(),
        })
        .where(
          eq(users.id, user.id)
        );

      const userWorkspace =
        await db
          .select()
          .from(workspaces)
          .where(
            eq(
              workspaces.ownerId,
              user.id
            )
          )
          .then((rows) => rows[0])
          .catch(() => null);

      const workspaceId =
        userWorkspace?.id || null;

      const newToken =
        workspaceId
          ? signJwtToken(
              {
                userId: user.id,
                workspaceId,
                email: user.email,
                role: user.role,
              },
              newHashedPassword
            )
          : null;

      const response =
        NextResponse.json({
          success: true,
          message:
            'Password successfully updated.',
        });

      if (newToken) {
        response.cookies.set(
          'kivo_session',
          newToken,
          {
            httpOnly: true,
            secure:
              process.env.NODE_ENV ===
              'production',
            sameSite: 'lax',
            maxAge:
              60 * 60 * 24 * 7,
            path: '/',
          }
        );
      }

      logger.info(
        `Password updated for user: ${cleanEmail}`
      );

      return response;
    }

    // ====================================================
    // 6. LOGOUT
    // ====================================================

    if (
      resolvedAction === 'logout'
    ) {
      const response =
        NextResponse.json({
          success: true,
          message:
            'Logged out successfully.',
        });

      response.cookies.delete(
        'kivo_session'
      );

      return response;
    }

    // ====================================================
    // INVALID ACTION
    // ====================================================

    return NextResponse.json(
      {
        success: false,
        error:
          `Invalid auth action received: '${action}'.`,
      },
      { status: 400 }
    );
  } catch (error) {
    logger.error(
      'Authentication Error',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Authentication failed.',
      },
      { status: 500 }
    );
  }
}
