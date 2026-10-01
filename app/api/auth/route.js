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
      } else if (fullName || body.name || businessName) {
        resolvedAction = 'signup';
      } else if (cleanEmail && password) {
        resolvedAction = 'login';
      }
    }

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
      const name = String(fullName || body.name || '').trim();
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

      // ----------------------------------------------------
      // CHECK EXISTING USER
      // ----------------------------------------------------

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
            error: 'An account with this email already exists.',
          },
          { status: 400 }
        );
      }

      // ----------------------------------------------------
      // GENERATE IDs
      // ----------------------------------------------------

      const userId = generateId('usr');
      const workspaceId = generateId('ws');
      const botId = generateId('bot');

      // ----------------------------------------------------
      // PASSWORD
      // ----------------------------------------------------

      const hashedPassword = await hashPassword(password);

      // ----------------------------------------------------
      // EMAIL VERIFICATION
      // ----------------------------------------------------

      const verificationToken =
        generateVerificationToken();

      const verificationTokenHash =
        hashVerificationToken(verificationToken);

      const verificationExpiresAt =
        getVerificationExpiry();

      // ----------------------------------------------------
      // WORKSPACE SLUG
      // ----------------------------------------------------

      const baseSlug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const slug = `${baseSlug}-${Math.floor(
        100 + Math.random() * 900
      )}`;

      // ----------------------------------------------------
      // CREATE USER
      // ----------------------------------------------------

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

      // ----------------------------------------------------
      // CREATE WORKSPACE
      // ----------------------------------------------------

      await db.insert(workspaces).values({
        id: workspaceId,
        name: companyName,
        slug,
        ownerId: userId,
        planId: 'free',
        aiCreditsBalance: 500,
        monthlyCreditsLimit: 500,
      });

      // ----------------------------------------------------
      // CREATE WORKSPACE MEMBER
      // ----------------------------------------------------

      await db.insert(workspaceMembers).values({
        id: generateId('member'),
        workspaceId,
        userId,
        role: 'owner',
      });

      // ----------------------------------------------------
      // CREATE DEFAULT BOT
      // ----------------------------------------------------

      const defaultSystemPrompt = buildSystemPrompt({
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
        systemPromptOverride: defaultSystemPrompt,
      });

      // ----------------------------------------------------
      // SEND VERIFICATION EMAIL
      // ----------------------------------------------------

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

      // ----------------------------------------------------
      // IMPORTANT:
      // NO SESSION IS CREATED HERE.
      // EMAIL VERIFICATION IS REQUIRED.
      // ----------------------------------------------------

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        message:
          'Account created. Please verify your email before signing in.',
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

      const isPasswordValid = await comparePassword(
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

      // ----------------------------------------------------
      // EMAIL VERIFICATION REQUIRED
      // ----------------------------------------------------

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

      // ----------------------------------------------------
      // ACCOUNT STATUS
      // ----------------------------------------------------

      if (!user.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: 'Your account has been disabled.',
          },
          { status: 403 }
        );
      }

      // ----------------------------------------------------
      // GET WORKSPACE
      // ----------------------------------------------------

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

      const workspaceId = userWorkspace.id;
      const companyName = userWorkspace.name;

      // ----------------------------------------------------
      // CREATE SESSION
      // ----------------------------------------------------

      const token = signJwtToken(
        {
          userId: user.id,
          workspaceId,
          email: user.email,
          role: user.role,
        },
        user.passwordHash
      );

      // ----------------------------------------------------
      // UPDATE LAST LOGIN
      // ----------------------------------------------------

      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      const response = NextResponse.json({
        success: true,
        message: 'Signed in successfully!',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          workspaceId,
          workspaceName: companyName,
        },
        workspace: {
          id: workspaceId,
          name: companyName,
        },
      });

      response.cookies.set('kivo_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    // ====================================================
    // 3. CHANGE PASSWORD
    // ====================================================

    if (resolvedAction === 'change-password') {
      const oldPass =
        currentPassword || body.oldPassword;

      const newPass =
        newPassword || password;

      if (!cleanEmail || !oldPass || !newPass) {
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
        .where(eq(users.email, cleanEmail))
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
            error: 'User account not found.',
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
            error: 'Incorrect current password.',
          },
          { status: 400 }
        );
      }

      const newHashedPassword =
        await hashPassword(newPass);

      await db
        .update(users)
        .set({
          passwordHash: newHashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Get actual workspace
      const userWorkspace = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.ownerId, user.id))
        .then((rows) => rows[0])
        .catch(() => null);

      const workspaceId =
        userWorkspace?.id || null;

      const newToken = workspaceId
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

      const response = NextResponse.json({
        success: true,
        message: 'Password successfully updated.',
      });

      if (newToken) {
        response.cookies.set(
          'kivo_session',
          newToken,
          {
            httpOnly: true,
            secure:
              process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
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
    // 4. LOGOUT
    // ====================================================

    if (resolvedAction === 'logout') {
      const response = NextResponse.json({
        success: true,
        message: 'Logged out successfully.',
      });

      response.cookies.delete('kivo_session');

      return response;
    }

    // ====================================================
    // INVALID ACTION
    // ====================================================

    return NextResponse.json(
      {
        success: false,
        error: `Invalid auth action received: '${action}'.`,
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