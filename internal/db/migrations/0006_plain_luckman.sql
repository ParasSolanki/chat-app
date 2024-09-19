CREATE TABLE `workspace_message_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`reaction` text NOT NULL,
	`member_id` text NOT NULL,
	`message_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`member_id`) REFERENCES `workspace_members`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`message_id`) REFERENCES `workspace_messages`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reactions_member_id_index` ON `workspace_message_reactions` (`member_id`);--> statement-breakpoint
CREATE INDEX `reactions_message_id_index` ON `workspace_message_reactions` (`message_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_message_reactions_message_id_member_id_reaction_unique` ON `workspace_message_reactions` (`message_id`,`member_id`,`reaction`);