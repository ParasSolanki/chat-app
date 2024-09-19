CREATE TABLE `workspace_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text(255) NOT NULL,
	`slug` text(255) NOT NULL,
	`body` text,
	`workspace_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`channel_id` text,
	`recipient_id` text,
	`parent_message_id` text,
	`reply_to_id` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `workspace_members`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`channel_id`) REFERENCES `workspace_channels`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`recipient_id`) REFERENCES `workspace_members`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`parent_message_id`) REFERENCES `workspace_messages`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`reply_to_id`) REFERENCES `workspace_messages`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_workspace_id_index` ON `workspace_messages` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `messages_channel_id_index` ON `workspace_messages` (`channel_id`);--> statement-breakpoint
CREATE INDEX `messages_sender_id_index` ON `workspace_messages` (`sender_id`);--> statement-breakpoint
CREATE INDEX `messages_recipient_id_index` ON `workspace_messages` (`recipient_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_messages_slug_workspace_id_unique` ON `workspace_messages` (`slug`,`workspace_id`);