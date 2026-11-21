import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./app/db/schema.js",
  out: "./drizzle/migrations",
  dialect: "mysql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL || "mysql://root:@127.0.0.1:3306/soundstage_db",
  },
});
