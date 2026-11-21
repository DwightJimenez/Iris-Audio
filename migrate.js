import mysql from "mysql2/promise";

const connection = await mysql.createConnection(
  process.env.DATABASE_URL || "mysql://root:@127.0.0.1:3306/soundstage_db"
);

console.log("Verifying Drizzle MySQL tables in soundstage_db...");

// 1. Shopify OAuth Sessions
await connection.query(`
  CREATE TABLE IF NOT EXISTS shopify_sessions (
    id varchar(255) PRIMARY KEY NOT NULL,
    shop varchar(255) NOT NULL,
    state varchar(255) NOT NULL,
    is_online boolean DEFAULT false NOT NULL,
    scope text,
    expires timestamp NULL,
    access_token varchar(255) NOT NULL,
    user_id bigint
  );
`);

// 2. Audio Gear Catalog (IEMs, DAC/DAPs, and Cables)
await connection.query(`
  CREATE TABLE IF NOT EXISTS hardware_specs (
    id int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    shop varchar(255) NOT NULL,
    shopify_product_id varchar(128) NOT NULL UNIQUE,
    title varchar(255) NOT NULL,
    category varchar(64) NOT NULL,
    connector_type varchar(64) DEFAULT '2-Pin' NOT NULL,
    power_level varchar(64) DEFAULT 'standard' NOT NULL,
    retail_price decimal(10,2) NOT NULL,
    unit_cost decimal(10,2) NOT NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
`);

// 3. Curated Combo Bundles
await connection.query(`
  CREATE TABLE IF NOT EXISTS rig_blueprints (
    id int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    shop varchar(255) NOT NULL,
    name varchar(255) NOT NULL,
    vibe_profile varchar(64) NOT NULL,
    synergy_score int DEFAULT 0 NOT NULL,
    bundle_discount_pct decimal(5,2) DEFAULT 5.00 NOT NULL,
    status varchar(32) DEFAULT 'DRAFT' NOT NULL,
    warnings_json json,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
`);

// 4. Combo Items Join Table
await connection.query(`
  CREATE TABLE IF NOT EXISTS blueprint_slots (
    id int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    blueprint_id int NOT NULL,
    hardware_spec_id int NOT NULL,
    slot_role varchar(64) NOT NULL,
    CONSTRAINT fk_blueprint FOREIGN KEY (blueprint_id) REFERENCES rig_blueprints(id) ON DELETE CASCADE,
    CONSTRAINT fk_hardware FOREIGN KEY (hardware_spec_id) REFERENCES hardware_specs(id) ON DELETE CASCADE
  );
`);

// 5. Activity & Audit Log Table
await connection.query(`
  CREATE TABLE IF NOT EXISTS audit_logs (
    id int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    shop varchar(255) NOT NULL,
    action_type varchar(64) NOT NULL,
    entity_name varchar(255) NOT NULL,
    score_delta int DEFAULT 0,
    payload_summary text NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
  );
`);

console.log("✅ All 5 MySQL tables verified and ready!");
await connection.end();