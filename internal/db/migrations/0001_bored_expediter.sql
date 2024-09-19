CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`slug` text(255) NOT NULL,
	`description` text,
	`invite_code` text NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_slug_unique` ON `workspaces` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_invite_code_unique` ON `workspaces` (`invite_code`);--> statement-breakpoint
CREATE INDEX `workspaces_owner_id_index` ON `workspaces` (`owner_id`);