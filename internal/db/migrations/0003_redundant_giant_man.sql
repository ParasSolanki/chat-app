CREATE TABLE `workspace_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`invitation_code` text NOT NULL,
	`inviter_id` text NOT NULL,
	`invitee_email` text NOT NULL,
	`invitee_user_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`accepted_at` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`inviter_id`) REFERENCES `workspace_members`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`invitee_user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `invitations_workspace_id_index` ON `workspace_invitations` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `invitations_inviter_id_index` ON `workspace_invitations` (`inviter_id`);--> statement-breakpoint
CREATE INDEX `invitations_invitee_email_index` ON `workspace_invitations` (`invitee_email`);--> statement-breakpoint
CREATE INDEX `invitations_invitee_user_id_index` ON `workspace_invitations` (`invitee_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_invitations_workspace_id_invitee_email_unique` ON `workspace_invitations` (`workspace_id`,`invitee_email`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_invitations_invitation_code_unique` ON `workspace_invitations` (`invitation_code`);