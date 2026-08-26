import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, workspaces, bots, workspaceMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword, signJwtToken } from '@/lib/auth/session';
import { generateId } from '@/lib/utils/helpers';
import { buildSystemPrompt } from '@/lib/ai/prompts/builder';
import { logger } from '@/lib/utils/logger';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, email, password, fullName, businessName } = body;

    // ----------------------------------------------------
    // 1. SIGNUP & WORKSPACE PROVISIONING
    // ----------------------------------------------------
    if (action === 'signup') {
      if (!email || !password || !fullName) {
        return NextResponse.json({ success: false, error: 'Full Name, Email, and Password are required.' }, { status: 400 });
      }

      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).then((r) => r[0]);
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'An account with this email already exists.' }, { status: 400 });
      }

      const userId = generateId('usr');
      const workspaceId = generateId('ws');
      const botId = generateId('bot');
      const hashedPassword = await hashPassword(password);
      const companyName = businessName || `${fullName}'s Business`;
      const slug = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.floor(100 + Math.random() * 900)}`;

      // Insert User
      await db.insert(users).values({
        id: userId,
        email: email.toLowerCase().trim(),
        passwordHash: hashedPassword,
        fullName,
        role: 'user',
      });

      // Insert Isolated Workspace with 500 Free AI Credits
      await db.insert(workspaces).values({
        id: workspaceId,
        name: companyName,
        slug,
        ownerId: userId,
        planId: 'free',
        aiCreditsBalance: 500,
        monthlyCreditsLimit: 500,
      });

      // Insert Workspace Member Relation
      await db.insert(workspaceMembers).values({
        id: generateId('member'),
        workspaceId,
        userId,
        role: 'owner',
      });

      // Insert Default AI Bot
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
        welcomeMessage: `Welcome to *${companyName}*! 🚀 How can I assist you today?`,
        systemPromptOverride: defaultSystemPrompt,
      });

      logger.info(`New SaaS Signup & Workspace Provisioned: ${companyName} (${workspaceId})`);

      // Generate JWT Token
      const token = signJwtToken({
        userId,
        workspaceId,
        email,
        role: 'owner',
      });

      const response = NextResponse.json({
        success: true,
        message: 'Account created successfully!',
        user: { id: userId, email, fullName, workspaceId },
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

    // ----------------------------------------------------
    // 2. LOGIN
    // ----------------------------------------------------
    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ success: false, error: 'Email and password required.' }, { status: 400 });
      }

      const user = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).then((r) => r[0]);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
      }

      const isPasswordValid = await comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
      }

      // Fetch user's primary workspace
      const userWorkspace = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.ownerId, user.id))
        .then((r) => r[0]);

      const workspaceId = userWorkspace?.id || 'ws_fancy_1';

      const token = signJwtToken({
        userId: user.id,
        workspaceId,
        email: user.email,
        role: user.role,
      });

      const response = NextResponse.json({
        success: true,
        message: 'Signed in successfully!',
        user: { id: user.id, email: user.email, fullName: user.fullName, workspaceId },
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

    // ----------------------------------------------------
    // 3. LOGOUT
    // ----------------------------------------------------
    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
      response.cookies.delete('kivo_session');
      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid auth action' }, { status: 400 });
  } catch (error) {
    logger.error('Authentication Error', error);
    return NextResponse.json({ success: false, error: error.message || 'Authentication failed' }, { status: 500 });
  }
}