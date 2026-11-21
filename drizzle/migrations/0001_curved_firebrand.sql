ALTER TABLE `rig_blueprints` RENAME COLUMN `vibe_profile` TO `use_case_profile`;--> statement-breakpoint
ALTER TABLE `hardware_specs` MODIFY COLUMN `power_level` varchar(32) NOT NULL DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE `hardware_specs` ADD `output_port` varchar(64) DEFAULT '3.5mm + 4.4mm' NOT NULL;--> statement-breakpoint
ALTER TABLE `rig_blueprints` ADD `net_margin_pct` decimal(5,2) DEFAULT '0.00' NOT NULL;