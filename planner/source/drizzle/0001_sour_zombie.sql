CREATE TABLE `planner_auth_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `planner_confirmations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_planner_confirmations_owner` ON `planner_confirmations` (`owner_id`);--> statement-breakpoint
CREATE TABLE `planner_credentials` (
	`username` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_planner_credentials_owner` ON `planner_credentials` (`owner_id`);--> statement-breakpoint
CREATE TABLE `planner_preferences` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`time_zone` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `planner_request_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`request_hash` text NOT NULL,
	`entry_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_planner_request_keys_owner` ON `planner_request_keys` (`owner_id`);--> statement-breakpoint
CREATE TABLE `planner_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_planner_sessions_owner` ON `planner_sessions` (`owner_id`);