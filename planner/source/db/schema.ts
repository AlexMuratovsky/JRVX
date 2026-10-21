import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
export const plans=sqliteTable("planner_plans",{
  id:text("id").primaryKey(),ownerId:text("owner_id").notNull(),title:text("title").notNull(),description:text("description").notNull().default(""),date:text("date"),categoryId:text("category_id").notNull(),completed:integer("completed").notNull().default(0),searchText:text("search_text").notNull(),createdAt:text("created_at").notNull(),updatedAt:text("updated_at").notNull(),
},table=>[index("idx_plans_owner_updated").on(table.ownerId,table.updatedAt)]);
export const planCategories=sqliteTable("planner_plan_categories",{
  id:text("id").primaryKey(),ownerId:text("owner_id").notNull(),name:text("name").notNull(),normalizedName:text("normalized_name").notNull(),createdAt:text("created_at").notNull(),
},table=>[uniqueIndex("idx_plan_categories_owner_name").on(table.ownerId,table.normalizedName)]);
export const entries = sqliteTable("planner_entries", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  payload: text("payload").notNull(),
  updatedAt: text("updated_at").notNull(),
}, table => [index("idx_planner_entries_owner").on(table.ownerId)]);

// Preferences and confirmations refer to the same Sites user identity as entries.
// Events and tasks continue to live exclusively in planner_entries.
export const preferences = sqliteTable("planner_preferences", {
  ownerId: text("owner_id").primaryKey(),
  timeZone: text("time_zone").notNull(),
});
export const confirmations = sqliteTable("planner_confirmations", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  payload: text("payload").notNull(),
  status: text("status").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
}, table => [index("idx_planner_confirmations_owner").on(table.ownerId)]);
export const requestKeys = sqliteTable("planner_request_keys", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  requestHash: text("request_hash").notNull(),
  entryId: text("entry_id").notNull(),
  confirmationId:text("confirmation_id"),
}, table => [index("idx_planner_request_keys_owner").on(table.ownerId)]);
export const credentials=sqliteTable("planner_credentials",{
  username:text("username").primaryKey(),ownerId:text("owner_id").notNull(),passwordHash:text("password_hash").notNull(),createdAt:text("created_at").notNull(),
},table=>[uniqueIndex("idx_planner_credentials_owner").on(table.ownerId)]);
export const sessions=sqliteTable("planner_sessions",{
  tokenHash:text("token_hash").primaryKey(),ownerId:text("owner_id").notNull(),expiresAt:text("expires_at").notNull(),
},table=>[index("idx_planner_sessions_owner").on(table.ownerId)]);
export const authAttempts=sqliteTable("planner_auth_attempts",{
  key:text("key").primaryKey(),attempts:integer("attempts").notNull(),expiresAt:text("expires_at").notNull(),
});
export const identityLinks=sqliteTable("planner_identity_links",{
  nativeId:text("native_id").primaryKey(),ownerId:text("owner_id").notNull(),createdAt:text("created_at").notNull(),
},table=>[uniqueIndex("idx_planner_identity_owner").on(table.ownerId)]);
export const chatThreads=sqliteTable("chat_threads",{
  id:text("id").primaryKey(),ownerId:text("owner_id").notNull(),title:text("title").notNull(),createdAt:text("created_at").notNull(),updatedAt:text("updated_at").notNull(),tags:text("tags").notNull().default("[]"),lease:text("lease"),leaseUntil:text("lease_until"),
},table=>[index("idx_chat_threads_owner").on(table.ownerId,table.updatedAt)]);
export const chatMessages=sqliteTable("chat_messages",{
  seq:integer("seq").primaryKey({autoIncrement:true}),id:text("id").notNull(),ownerId:text("owner_id").notNull(),threadId:text("thread_id").notNull(),role:text("role").notNull(),payload:text("payload").notNull(),createdAt:text("created_at").notNull(),
},table=>[uniqueIndex("idx_chat_message_id").on(table.id),index("idx_chat_history").on(table.ownerId,table.threadId,table.seq)]);
export const chatAttachments=sqliteTable("chat_attachments",{
  id:text("id").primaryKey(),ownerId:text("owner_id").notNull(),threadId:text("thread_id").notNull(),objectKey:text("object_key").notNull(),name:text("name").notNull(),mime:text("mime").notNull(),size:integer("size").notNull(),createdAt:text("created_at").notNull(),messageId:text("message_id"),tags:text("tags").notNull().default("[]"),extractedText:text("extracted_text"),
},table=>[index("idx_chat_attachments_owner").on(table.ownerId,table.threadId)]);
export const chatRuns=sqliteTable("chat_runs",{
  id:text("id").primaryKey(),ownerId:text("owner_id").notNull(),threadId:text("thread_id").notNull(),requestHash:text("request_hash").notNull(),status:text("status").notNull(),createdAt:text("created_at").notNull(),
},table=>[index("idx_chat_runs_owner").on(table.ownerId,table.threadId)]);
export const aiPermissions=sqliteTable("planner_ai_permissions",{ownerId:text("owner_id").primaryKey(),payload:text("payload").notNull()});
export const mutationContext=sqliteTable("planner_mutation_context",{ownerId:text("owner_id").primaryKey(),groupId:text("group_id").notNull(),actor:text("actor").notNull(),source:text("source").notNull()});
export const history=sqliteTable("planner_history",{
  seq:integer("seq").primaryKey({autoIncrement:true}),groupId:text("group_id").notNull(),ownerId:text("owner_id").notNull(),entryId:text("entry_id").notNull(),beforePayload:text("before_payload"),afterPayload:text("after_payload"),beforeVersion:text("before_version"),afterVersion:text("after_version"),actor:text("actor").notNull(),actorId:text("actor_id").notNull(),actionType:text("action_type").notNull(),entityType:text("entity_type").notNull(),source:text("source").notNull(),createdAt:text("created_at").notNull(),undoneBy:text("undone_by"),
},table=>[index("idx_planner_history_owner").on(table.ownerId,table.groupId,table.seq)]);
export const embeddings=sqliteTable("planner_embeddings",{
  id:text("id").primaryKey(),ownerId:text("owner_id").notNull(),entryId:text("entry_id").notNull(),version:text("version").notNull(),model:text("model").notNull(),vector:text("vector").notNull(),
},table=>[index("idx_planner_embeddings_owner").on(table.ownerId,table.entryId)]);
export const reminderReceipts=sqliteTable("planner_reminder_receipts",{id:text("id").primaryKey(),ownerId:text("owner_id").notNull(),createdAt:text("created_at").notNull()});
export const reminders=sqliteTable("planner_reminders",{id:text("id").primaryKey(),ownerId:text("owner_id").notNull(),payload:text("payload").notNull(),updatedAt:text("updated_at").notNull()},table=>[index("idx_planner_reminders_owner").on(table.ownerId)]);
export const oauthFlows=sqliteTable("planner_oauth_flows",{id:text("id").primaryKey(),payload:text("payload").notNull(),csrfHash:text("csrf_hash").notNull(),expiresAt:text("expires_at").notNull()});
export const oauthCodes=sqliteTable("planner_oauth_codes",{tokenHash:text("token_hash").primaryKey(),ownerId:text("owner_id").notNull(),payload:text("payload").notNull(),expiresAt:text("expires_at").notNull(),usedAt:text("used_at")});
export const oauthGrants=sqliteTable("planner_oauth_grants",{id:text("id").primaryKey(),ownerId:text("owner_id").notNull(),clientId:text("client_id").notNull(),scope:text("scope").notNull(),resource:text("resource").notNull(),createdAt:text("created_at").notNull(),revokedAt:text("revoked_at")},table=>[index("idx_oauth_grants_owner").on(table.ownerId)]);
export const oauthAccess=sqliteTable("planner_oauth_access",{tokenHash:text("token_hash").primaryKey(),grantId:text("grant_id").notNull(),expiresAt:text("expires_at").notNull()});
export const oauthRefresh=sqliteTable("planner_oauth_refresh",{tokenHash:text("token_hash").primaryKey(),grantId:text("grant_id").notNull(),expiresAt:text("expires_at").notNull(),usedAt:text("used_at")});
