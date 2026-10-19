ALTER TABLE "audit_logs" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "payment_claims" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "workspace_members" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_claims" DROP CONSTRAINT "payment_claims_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "workspace_members" DROP CONSTRAINT "workspace_members_userId_users_id_fk";
--> statement-breakpoint
DROP INDEX "workspace_user_unique_idx";--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_claims" ADD CONSTRAINT "payment_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_user_unique_idx" ON "workspace_members" USING btree ("workspace_id","user_id");