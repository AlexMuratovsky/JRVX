CREATE TABLE `planner_plan_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_plan_categories_owner_name` ON `planner_plan_categories` (`owner_id`,`normalized_name`);--> statement-breakpoint
CREATE TABLE `planner_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`date` text,
	`category_id` text NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`search_text` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_plans_owner_updated` ON `planner_plans` (`owner_id`,`updated_at`);