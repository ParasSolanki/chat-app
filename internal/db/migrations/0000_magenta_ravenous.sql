CREATE TABLE `user_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_key` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_passwords` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`hashed_password` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text(255) NOT NULL,
	`display_name` text(255),
	`avatar_url` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE INDEX `accounts_user_id_index` ON `user_accounts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_accounts_user_id_provider_key_unique` ON `user_accounts` (`user_id`,`provider_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_passwords_user_id_unique` ON `user_passwords` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_index` ON `user_sessions` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);