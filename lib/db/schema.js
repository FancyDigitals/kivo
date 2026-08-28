import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  jsonb,
  numeric,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ----------------------------------------------------
// 1. USERS & AUTHENTICATION
// ----------------------------------------------------
export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------
// 2. WORKSPACES (With AI Credits & Tier Tracking)
// ----------------------------------------------------
export const workspaces = pgTable('workspaces', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  ownerId: varchar('owner_id', { length: 64 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: varchar('plan_id', { length: 50 }).notNull().default('free'), // free, starter, pro, enterprise
  aiCreditsBalance: integer('ai_credits_balance').notNull().default(500),
  monthlyCreditsLimit: integer('monthly_credits_limit').notNull().default(500),
  planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),
  settings: jsonb('settings').default({
    currency: 'NGN',
    timezone: 'WAT',
    locale: 'en',
    notificationEmail: 'admin@fancydigitals.com',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------
// 3. WORKSPACE MEMBERS
// ----------------------------------------------------
export const workspaceMembers = pgTable('workspace_members', {
  id: varchar('id', { length: 64 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 64 }).notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: varchar('userId', { length: 64 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull().default('agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  memberWorkspaceUserIdx: uniqueIndex('workspace_user_unique_idx').on(table.workspaceId, table.userId),
}));

// ----------------------------------------------------
// 4. BOTS & CONFIGURATIONS
// ----------------------------------------------------
export const bots = pgTable('bots', {
  id: varchar('id', { length: 64 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 64 }).notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  industry: varchar('industry', { length: 100 }).notNull().default('business'),
  description: text('description').notNull().default(''),
  personality: varchar('personality', { length: 100 }).notNull().default('professional'),
  language: varchar('language', { length: 50 }).notNull().default('en'),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  
  // WhatsApp persistent line state
  whatsappNumber: varchar('whatsapp_number', { length: 50 }),
  whatsappStatus: varchar('whatsapp_status', { length: 50 }).notNull().default('disconnected'),
  phoneNumberId: varchar('phone_number_id', { length: 100 }),

  primaryProvider: varchar('primary_provider', { length: 50 }).notNull().default('openrouter'),
  primaryModel: varchar('primary_model', { length: 100 }).notNull().default('anthropic/claude-3.5-sonnet'),
  fallbackProvider: varchar('fallback_provider', { length: 50 }).default('gemini'),
  fallbackModel: varchar('fallback_model', { length: 100 }).default('gemini-1.5-flash'),
  temperature: numeric('temperature').notNull().default('0.3'),
  maxTokens: integer('max_tokens').notNull().default(1000),

  welcomeMessage: text('welcome_message').notNull().default('Hello! How can I help your business today?'),
  fallbackMessage: text('fallback_message').notNull().default('Let me connect you with our human team to assist you further.'),
  systemPromptOverride: text('system_prompt_override'),
  objectives: jsonb('objectives').default([]),
  rules: jsonb('rules').default([]),
  restrictions: jsonb('restrictions').default([]),
  handoffKeywords: jsonb('handoff_keywords').default(['human', 'agent', 'support', 'manager', 'speak to someone']),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  botWorkspaceIdx: index('bot_workspace_idx').on(table.workspaceId),
}));

// ----------------------------------------------------
// 5. KNOWLEDGE BASE
// ----------------------------------------------------
export const knowledgeSources = pgTable('knowledge_sources', {
  id: varchar('id', { length: 64 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 64 }).notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  botId: varchar('bot_id', { length: 64 }).notNull().references(() => bots.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  sourceUrl: text('source_url'),
  rawContent: text('raw_content'),
  status: varchar('status', { length: 50 }).notNull().default('ready'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  knowledgeWorkspaceIdx: index('knowledge_workspace_idx').on(table.workspaceId),
  knowledgeBotIdx: index('knowledge_bot_idx').on(table.botId),
}));

export const knowledgeChunks = pgTable('knowledge_chunks', {
  id: varchar('id', { length: 64 }).primaryKey(),
  sourceId: varchar('source_id', { length: 64 }).notNull().references(() => knowledgeSources.id, { onDelete: 'cascade' }),
  botId: varchar('bot_id', { length: 64 }).notNull().references(() => bots.id, { onDelete: 'cascade' }),
  workspaceId: varchar('workspace_id', { length: 64 }).notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  chunkIndex: integer('chunk_index').notNull().default(0),
  tokenCount: integer('token_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  chunkBotIdx: index('chunk_bot_idx').on(table.botId),
  chunkWorkspaceIdx: index('chunk_workspace_idx').on(table.workspaceId),
}));

// ----------------------------------------------------
// 6. PRODUCT CATALOG
// ----------------------------------------------------
export const products = pgTable('products', {
  id: varchar('id', { length: 64 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 64 }).notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  botId: varchar('bot_id', { length: 64 }).references(() => bots.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  sku: varchar('sku', { length: 100 }),
  category: varchar('category', { length: 100 }).default('General'),
  price: numeric('price', { precision: 12, scale: 2 }).notNull().default('0.00'),
  currency: varchar('currency', { length: 10 }).notNull().default('NGN'),
  stockStatus: varchar('stock_status', { length: 50 }).notNull().default('in_stock'),
  variants: jsonb('variants').default([]),
  images: jsonb('images').default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  productWorkspaceIdx: index('product_workspace_idx').on(table.workspaceId),
}));

// ----------------------------------------------------
// 7. CUSTOMERS
// ----------------------------------------------------
export const customers = pgTable('customers', {
  id: varchar('id', { length: 64 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 64 }).notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  tags: jsonb('tags').default([]),
  customFields: jsonb('custom_fields').default({}),
  notes: text('notes').default(''),
  totalSpent: numeric('total_spent', { precision: 12, scale: 2 }).default('0.00'),
  lastInteractedAt: timestamp('last_interacted_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  customerWorkspacePhoneIdx: uniqueIndex('cust_workspace_phone_idx').on(table.workspaceId, table.phoneNumber),
  customerWorkspaceIdx: index('customer_workspace_idx').on(table.workspaceId),
}));

// ----------------------------------------------------
// 8. CONVERSATIONS & MESSAGES
// ----------------------------------------------------
export const conversations = pgTable('conversations', {
  id: varchar('id', { length: 64 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 64 }).notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  botId: varchar('bot_id', { length: 64 }).notNull().references(() => bots.id, { onDelete: 'cascade' }),
  customerId: varchar('customer_id', { length: 64 }).notNull().references(() => customers.id, { onDelete: 'cascade' }),
  channel: varchar('channel', { length: 50 }).notNull().default('whatsapp'),
  mode: varchar('mode', { length: 50 }).notNull().default('ai'),
  status: varchar('status', { length: 50 }).notNull().default('open'),
  assignedTo: varchar('assigned_to', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  lastMessageSnippet: text('last_message_snippet'),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).defaultNow(),
  unreadCount: integer('unread_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  convWorkspaceIdx: index('conv_workspace_idx').on(table.workspaceId),
  convBotIdx: index('conv_bot_idx').on(table.botId),
  convCustomerIdx: index('conv_customer_idx').on(table.customerId),
}));

export const messages = pgTable('messages', {
  id: varchar('id', { length: 64 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 64 }).notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  conversationId: varchar('conversation_id', { length: 64 }).notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderType: varchar('sender_type', { length: 50 }).notNull(),
  senderId: varchar('sender_id', { length: 64 }),
  content: text('content').notNull(),
  mediaUrl: text('media_url'),
  mediaType: varchar('media_type', { length: 50 }),
  externalMessageId: varchar('external_message_id', { length: 255 }),
  deliveryStatus: varchar('delivery_status', { length: 50 }).notNull().default('sent'),
  aiMetadata: jsonb('ai_metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  msgWorkspaceIdx: index('msg_workspace_idx').on(table.workspaceId),
  msgConversationIdx: index('msg_conversation_idx').on(table.conversationId),
  msgExternalIdIdx: index('msg_external_id_idx').on(table.externalMessageId),
}));

// ----------------------------------------------------
// 9. LEADS
// ----------------------------------------------------
export const leads = pgTable('leads', {
  id: varchar('id', { length: 64 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 64 }).notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  botId: varchar('bot_id', { length: 64 }).references(() => bots.id, { onDelete: 'set null' }),
  customerId: varchar('customer_id', { length: 64 }).notNull().references(() => customers.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('new'),
  estimatedValue: numeric('estimated_value', { precision: 12, scale: 2 }).default('0.00'),
  confidenceScore: integer('confidence_score').default(0),
  extractedData: jsonb('extracted_data').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  leadWorkspaceIdx: index('lead_workspace_idx').on(table.workspaceId),
  leadBotIdx: index('lead_bot_idx').on(table.botId),
}));

// ----------------------------------------------------
// 10. ORDERS
// ----------------------------------------------------
export const orders = pgTable('orders', {
  id: varchar('id', { length: 64 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 64 }).notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  botId: varchar('bot_id', { length: 64 }).references(() => bots.id, { onDelete: 'set null' }),
  customerId: varchar('customer_id', { length: 64 }).notNull().references(() => customers.id, { onDelete: 'cascade' }),
  orderNumber: varchar('order_number', { length: 50 }).notNull(),
  items: jsonb('items').notNull().default([]),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0.00'),
  deliveryFee: numeric('delivery_fee', { precision: 12, scale: 2 }).notNull().default('0.00'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0.00'),
  currency: varchar('currency', { length: 10 }).notNull().default('NGN'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('unpaid'),
  shippingAddress: jsonb('shipping_address').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orderWorkspaceIdx: index('order_workspace_idx').on(table.workspaceId),
}));

// ----------------------------------------------------
// 11. WHATSAPP ACCOUNTS
// ----------------------------------------------------
export const whatsappAccounts = pgTable('whatsapp_accounts', {
  id: varchar('id', { length: 64 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 64 }).notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  botId: varchar('bot_id', { length: 64 }).notNull().references(() => bots.id, { onDelete: 'cascade' }),
  phoneNumberId: varchar('phone_number_id', { length: 100 }).notNull(),
  businessAccountId: varchar('business_account_id', { length: 100 }).notNull(),
  displayPhoneNumber: varchar('display_phone_number', { length: 50 }).notNull(),
  verifiedName: varchar('verified_name', { length: 255 }),
  accessTokenEncrypted: text('access_token_encrypted').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('connected'),
  qualityRating: varchar('quality_rating', { length: 50 }).default('GREEN'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  waWorkspaceIdx: index('wa_workspace_idx').on(table.workspaceId),
  waBotIdx: uniqueIndex('wa_bot_unique_idx').on(table.botId),
}));

// ----------------------------------------------------
// 12. AI USAGE LOGS
// ----------------------------------------------------
export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 64 }).notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  botId: varchar('bot_id', { length: 64 }).notNull().references(() => bots.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  promptTokens: integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  estimatedCostUsd: numeric('estimated_cost_usd', { precision: 10, scale: 6 }).default('0.000000'),
  latencyMs: integer('latency_ms').notNull().default(0),
  success: boolean('success').notNull().default(true),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  usageWorkspaceIdx: index('usage_workspace_idx').on(table.workspaceId),
  usageBotIdx: index('usage_bot_idx').on(table.botId),
  usageCreatedAtIdx: index('usage_created_at_idx').on(table.createdAt),
}));

// ----------------------------------------------------
// 13. AUDIT LOGS
// ----------------------------------------------------
export const auditLogs = pgTable('audit_logs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 64 }).notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: varchar('userId', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }).notNull(),
  resourceId: varchar('resource_id', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 50 }),
  details: jsonb('details').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  auditWorkspaceIdx: index('audit_workspace_idx').on(table.workspaceId),
}));

// ----------------------------------------------------
// 14. MANUAL PAYMENT CLAIMS & VOUCHERS
// ----------------------------------------------------
export const paymentClaims = pgTable('payment_claims', {
  id: varchar('id', { length: 64 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 64 }).notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: varchar('userId', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 50 }).notNull().default('topup'), // topup, plan_upgrade
  planId: varchar('plan_id', { length: 50 }),
  credits: integer('credits').notNull().default(5000),
  amountNgn: numeric('amount_ngn', { precision: 12, scale: 2 }).notNull().default('0.00'),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('bank_transfer'), // bank_transfer, voucher
  senderNameOrRef: varchar('sender_name_ref', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, approved, rejected
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  claimWorkspaceIdx: index('claim_workspace_idx').on(table.workspaceId),
}));