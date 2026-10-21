CREATE TABLE `chat_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`thread_id` text NOT NULL,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL,
	`message_id` text
);
--> statement-breakpoint
CREATE INDEX `idx_chat_attachments_owner` ON `chat_attachments` (`owner_id`,`thread_id`);--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`owner_id` text NOT NULL,
	`thread_id` text NOT NULL,
	`role` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_chat_message_id` ON `chat_messages` (`id`);--> statement-breakpoint
CREATE INDEX `idx_chat_history` ON `chat_messages` (`owner_id`,`thread_id`,`seq`);--> statement-breakpoint
CREATE TABLE `chat_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`thread_id` text NOT NULL,
	`request_hash` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_chat_runs_owner` ON `chat_runs` (`owner_id`,`thread_id`);--> statement-breakpoint
CREATE TABLE `chat_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`lease` text,
	`lease_until` text
);
--> statement-breakpoint
CREATE INDEX `idx_chat_threads_owner` ON `chat_threads` (`owner_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `planner_identity_links` (
	`native_id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_planner_identity_owner` ON `planner_identity_links` (`owner_id`);