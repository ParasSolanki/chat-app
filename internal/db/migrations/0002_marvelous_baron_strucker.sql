CREATE TABLE `workspace_members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`username` text(255) NOT NULL,
	`slug` text(255) NOT NULL,
	`avatar_url` text,
	`is_active` integer NOT NULL,
	`user_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`workspace_role_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`workspace_role_id`) REFERENCES `workspace_roles`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workspace_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`description` text,
	`workspace_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_members_slug_unique` ON `workspace_members` (`slug`);--> statement-breakpoint
CREATE INDEX `members_user_id_index` ON `workspace_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `members_workspace_id_index` ON `workspace_members` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `members_workspace_role_id_index` ON `workspace_members` (`workspace_role_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_members_user_id_workspace_id_unique` ON `workspace_members` (`user_id`,`workspace_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_members_workspace_id_username_unique` ON `workspace_members` (`workspace_id`,`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_members_workspace_id_slug_unique` ON `workspace_members` (`workspace_id`,`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_members_user_id_workspace_id_workspace_role_id_unique` ON `workspace_members` (`user_id`,`workspace_id`,`workspace_role_id`);--> statement-breakpoint
CREATE INDEX `roles_workspace_id_index` ON `workspace_roles` (`workspace_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_roles_workspace_id_name_unique` ON `workspace_roles` (`workspace_id`,`name`);