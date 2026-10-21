CREATE TABLE `planner_ai_permissions` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `planner_embeddings` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`entry_id` text NOT NULL,
	`version` text NOT NULL,
	`model` text NOT NULL,
	`vector` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_planner_embeddings_owner` ON `planner_embeddings` (`owner_id`,`entry_id`);--> statement-breakpoint
CREATE TABLE `planner_history` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`entry_id` text NOT NULL,
	`before_payload` text,
	`after_payload` text,
	`before_version` text,
	`after_version` text,
	`actor` text NOT NULL,
	`actor_id` text NOT NULL,
	`action_type` text NOT NULL,
	`entity_type` text NOT NULL,
	`source` text NOT NULL,
	`created_at` text NOT NULL,
	`undone_by` text
);
--> statement-breakpoint
CREATE INDEX `idx_planner_history_owner` ON `planner_history` (`owner_id`,`group_id`,`seq`);--> statement-breakpoint
CREATE TABLE `planner_mutation_context` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`actor` text NOT NULL,
	`source` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `planner_reminder_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `planner_reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_planner_reminders_owner` ON `planner_reminders` (`owner_id`);--> statement-breakpoint
ALTER TABLE `planner_request_keys` ADD `confirmation_id` text;