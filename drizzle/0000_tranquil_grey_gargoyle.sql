CREATE TABLE "ai_usage_logs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model" varchar(100) NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"estimated_cost_usd" numeric(10, 6) DEFAULT '0.000000',
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"userId" varchar(64),
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" varchar(255),
	"ip_address" varchar(50),
	"details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bots" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"industry" varchar(100) DEFAULT 'business' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"personality" varchar(100) DEFAULT 'professional' NOT NULL,
	"language" varchar(50) DEFAULT 'en' NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"whatsapp_number" varchar(50),
	"whatsapp_status" varchar(50) DEFAULT 'disconnected' NOT NULL,
	"phone_number_id" varchar(100),
	"primary_provider" varchar(50) DEFAULT 'openrouter' NOT NULL,
	"primary_model" varchar(100) DEFAULT 'anthropic/claude-3.5-sonnet' NOT NULL,
	"fallback_provider" varchar(50) DEFAULT 'gemini',
	"fallback_model" varchar(100) DEFAULT 'gemini-1.5-flash',
	"temperature" numeric DEFAULT '0.3' NOT NULL,
	"max_tokens" integer DEFAULT 1000 NOT NULL,
	"welcome_message" text DEFAULT 'Hello! How can I help your business today?' NOT NULL,
	"fallback_message" text DEFAULT 'Let me connect you with our human team to assist you further.' NOT NULL,
	"system_prompt_override" text,
	"objectives" jsonb DEFAULT '[]'::jsonb,
	"rules" jsonb DEFAULT '[]'::jsonb,
	"restrictions" jsonb DEFAULT '[]'::jsonb,
	"handoff_keywords" jsonb DEFAULT '["human","agent","support","manager","speak to someone"]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"channel" varchar(50) DEFAULT 'whatsapp' NOT NULL,
	"mode" varchar(50) DEFAULT 'ai' NOT NULL,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"assigned_to" varchar(64),
	"last_message_snippet" text,
	"last_message_at" timestamp with time zone DEFAULT now(),
	"unread_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"phone_number" varchar(50) NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"notes" text DEFAULT '',
	"total_spent" numeric(12, 2) DEFAULT '0.00',
	"last_interacted_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_chunks" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"source_id" varchar(64) NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"content" text NOT NULL,
	"chunk_index" integer DEFAULT 0 NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_sources" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"source_url" text,
	"raw_content" text,
	"status" varchar(50) DEFAULT 'ready' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"bot_id" varchar(64),
	"customer_id" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'new' NOT NULL,
	"estimated_value" numeric(12, 2) DEFAULT '0.00',
	"confidence_score" integer DEFAULT 0,
	"extracted_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"conversation_id" varchar(64) NOT NULL,
	"sender_type" varchar(50) NOT NULL,
	"sender_id" varchar(64),
	"content" text NOT NULL,
	"media_url" text,
	"media_type" varchar(50),
	"external_message_id" varchar(255),
	"delivery_status" varchar(50) DEFAULT 'sent' NOT NULL,
	"ai_metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"bot_id" varchar(64),
	"customer_id" varchar(64) NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"delivery_fee" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"currency" varchar(10) DEFAULT 'NGN' NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"payment_status" varchar(50) DEFAULT 'unpaid' NOT NULL,
	"shipping_address" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_claims" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"userId" varchar(64),
	"type" varchar(50) DEFAULT 'topup' NOT NULL,
	"plan_id" varchar(50),
	"credits" integer DEFAULT 5000 NOT NULL,
	"amount_ngn" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"payment_method" varchar(50) DEFAULT 'bank_transfer' NOT NULL,
	"sender_name_ref" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"bot_id" varchar(64),
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sku" varchar(100),
	"category" varchar(100) DEFAULT 'General',
	"price" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"currency" varchar(10) DEFAULT 'NGN' NOT NULL,
	"stock_status" varchar(50) DEFAULT 'in_stock' NOT NULL,
	"variants" jsonb DEFAULT '[]'::jsonb,
	"images" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"avatar_url" text,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_token_hash" text,
	"email_verification_expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_accounts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"phone_number_id" varchar(100) NOT NULL,
	"business_account_id" varchar(100) NOT NULL,
	"display_phone_number" varchar(50) NOT NULL,
	"verified_name" varchar(255),
	"access_token_encrypted" text NOT NULL,
	"status" varchar(50) DEFAULT 'connected' NOT NULL,
	"quality_rating" varchar(50) DEFAULT 'GREEN',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"userId" varchar(64) NOT NULL,
	"role" varchar(50) DEFAULT 'agent' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"owner_id" varchar(64) NOT NULL,
	"plan_id" varchar(50) DEFAULT 'free' NOT NULL,
	"ai_credits_balance" integer DEFAULT 500 NOT NULL,
	"monthly_credits_limit" integer DEFAULT 500 NOT NULL,
	"plan_expires_at" timestamp with time zone,
	"settings" jsonb DEFAULT '{"currency":"NGN","timezone":"WAT","locale":"en","notificationEmail":"admin@fancydigitals.com"}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bots" ADD CONSTRAINT "bots_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_claims" ADD CONSTRAINT "payment_claims_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_claims" ADD CONSTRAINT "payment_claims_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" ADD CONSTRAINT "whatsapp_accounts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" ADD CONSTRAINT "whatsapp_accounts_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "usage_workspace_idx" ON "ai_usage_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "usage_bot_idx" ON "ai_usage_logs" USING btree ("bot_id");--> statement-breakpoint
CREATE INDEX "usage_created_at_idx" ON "ai_usage_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_workspace_idx" ON "audit_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "bot_workspace_idx" ON "bots" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "conv_workspace_idx" ON "conversations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "conv_bot_idx" ON "conversations" USING btree ("bot_id");--> statement-breakpoint
CREATE INDEX "conv_customer_idx" ON "conversations" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cust_workspace_phone_idx" ON "customers" USING btree ("workspace_id","phone_number");--> statement-breakpoint
CREATE INDEX "customer_workspace_idx" ON "customers" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "chunk_bot_idx" ON "knowledge_chunks" USING btree ("bot_id");--> statement-breakpoint
CREATE INDEX "chunk_workspace_idx" ON "knowledge_chunks" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "knowledge_workspace_idx" ON "knowledge_sources" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "knowledge_bot_idx" ON "knowledge_sources" USING btree ("bot_id");--> statement-breakpoint
CREATE INDEX "lead_workspace_idx" ON "leads" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "lead_bot_idx" ON "leads" USING btree ("bot_id");--> statement-breakpoint
CREATE INDEX "msg_workspace_idx" ON "messages" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "msg_conversation_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "msg_external_id_idx" ON "messages" USING btree ("external_message_id");--> statement-breakpoint
CREATE INDEX "order_workspace_idx" ON "orders" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "claim_workspace_idx" ON "payment_claims" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "product_workspace_idx" ON "products" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "wa_workspace_idx" ON "whatsapp_accounts" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wa_bot_unique_idx" ON "whatsapp_accounts" USING btree ("bot_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_user_unique_idx" ON "workspace_members" USING btree ("workspace_id","userId");