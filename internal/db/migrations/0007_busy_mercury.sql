CREATE TABLE `workspace_message_files` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text(255) NOT NULL,
	`mimetype` text NOT NULL,
	`url` text NOT NULL,
	`original_w` integer,
	`original_h` integer,
	`message_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`message_id`) REFERENCES `workspace_messages`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_message_files_slug_unique` ON `workspace_message_files` (`slug`);--> statement-breakpoint
CREATE INDEX `files_message_id_index` ON `workspace_message_files` (`message_id`);