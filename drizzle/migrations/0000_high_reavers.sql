CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shop` varchar(255) NOT NULL,
	`action_type` varchar(64) NOT NULL,
	`entity_name` varchar(255) NOT NULL,
	`score_delta` int DEFAULT 0,
	`payload_summary` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blueprint_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blueprint_id` int NOT NULL,
	`hardware_spec_id` int NOT NULL,
	`slot_role` varchar(64) NOT NULL,
	CONSTRAINT `blueprint_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hardware_specs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shop` varchar(255) NOT NULL,
	`shopify_product_id` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(64) NOT NULL,
	`connector_type` varchar(64) NOT NULL DEFAULT '2-Pin',
	`power_level` varchar(64) NOT NULL DEFAULT 'standard',
	`retail_price` decimal(10,2) NOT NULL,
	`unit_cost` decimal(10,2) NOT NULL,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hardware_specs_id` PRIMARY KEY(`id`),
	CONSTRAINT `hardware_specs_shopify_product_id_unique` UNIQUE(`shopify_product_id`)
);
--> statement-breakpoint
CREATE TABLE `rig_blueprints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shop` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`vibe_profile` varchar(64) NOT NULL,
	`synergy_score` int NOT NULL DEFAULT 0,
	`bundle_discount_pct` decimal(5,2) NOT NULL DEFAULT '5.00',
	`status` varchar(32) NOT NULL DEFAULT 'DRAFT',
	`warnings_json` json DEFAULT ('[]'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rig_blueprints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shopify_sessions` (
	`id` varchar(255) NOT NULL,
	`shop` varchar(255) NOT NULL,
	`state` varchar(255) NOT NULL,
	`is_online` boolean NOT NULL DEFAULT false,
	`scope` text,
	`expires` timestamp,
	`access_token` varchar(255) NOT NULL,
	`user_id` bigint,
	CONSTRAINT `shopify_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `blueprint_slots` ADD CONSTRAINT `blueprint_slots_blueprint_id_rig_blueprints_id_fk` FOREIGN KEY (`blueprint_id`) REFERENCES `rig_blueprints`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blueprint_slots` ADD CONSTRAINT `blueprint_slots_hardware_spec_id_hardware_specs_id_fk` FOREIGN KEY (`hardware_spec_id`) REFERENCES `hardware_specs`(`id`) ON DELETE cascade ON UPDATE no action;