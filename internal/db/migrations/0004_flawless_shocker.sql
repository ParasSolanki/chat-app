CREATE TABLE `workspace_channel_members` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`member_id` text NOT NULL,
	`is_external` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`channel_id`) REFERENCES `workspace_channels`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `workspace_members`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workspace_channels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`slug` text(255) NOT NULL,
	`description` text,
	`workspace_id` text NOT NULL,
	`created_by_id` text NOT NULL,
	`is_private` integer NOT NULL,
	`archived_at` integer,
	`archived_by_id` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`created_by_id`) REFERENCES `workspace_members`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`archived_by_id`) REFERENCES `workspace_members`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `channel_members_channel_id_index` ON `workspace_channel_members` (`member_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_channel_members_channel_id_member_id_unique` ON `workspace_channel_members` (`channel_id`,`member_id`);--> statement-breakpoint
CREATE INDEX `channels_workspace_id_index` ON `workspace_channels` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `channels_created_by_id_index` ON `workspace_channels` (`created_by_id`);--> statement-breakpoint
CREATE INDEX `channels_archived_by_id_index` ON `workspace_channels` (`archived_by_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_channels_workspace_id_slug_unique` ON `workspace_channels` (`workspace_id`,`slug`);