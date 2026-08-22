CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`bako_id` text NOT NULL,
	`type` text NOT NULL,
	`actor_id` text NOT NULL,
	`asset_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bako_id`) REFERENCES `bakos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `activity_bako_created_idx` ON `activity` (`bako_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`bako_id` text NOT NULL,
	`uploader_id` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`content_hash` text NOT NULL,
	`thumb_key` text,
	`status` text NOT NULL,
	`taken_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bako_id`) REFERENCES `bakos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `assets_bako_created_idx` ON `assets` (`bako_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `bakos` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`user_id` text NOT NULL,
	`bako_id` text NOT NULL,
	`role` text NOT NULL,
	`last_read_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `bako_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bako_id`) REFERENCES `bakos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `upload_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`bako_id` text NOT NULL,
	`uploader_id` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`content_hash` text NOT NULL,
	`kind` text NOT NULL,
	`mode` text NOT NULL,
	`r2_upload_id` text,
	`thumb_hash` text,
	`status` text NOT NULL,
	`asset_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bako_id`) REFERENCES `bakos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`workos_user_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`plan` text NOT NULL,
	`storage_used_bytes` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_workos_user_id_unique` ON `users` (`workos_user_id`);