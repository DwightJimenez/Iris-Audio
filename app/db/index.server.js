import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq, inArray } from "drizzle-orm";
import { Session } from "@shopify/shopify-api";
import * as schema from "./schema.js";

const pool = mysql.createPool(
  process.env.DATABASE_URL || "mysql://root:@127.0.0.1:3306/soundstage_db"
);

export const db = drizzle(pool, { schema, mode: "default" });

function rowToSession(row) {
  return new Session({
    id: row.id,
    shop: row.shop,
    state: row.state,
    isOnline: row.isOnline,
    scope: row.scope ?? undefined,
    expires: row.expires ? new Date(row.expires) : undefined,
    accessToken: row.accessToken,
  });
}

export class DrizzleSessionStorage {
  async storeSession(session) {
    await db
      .insert(schema.shopifySessions)
      .values({
        id: session.id,
        shop: session.shop,
        state: session.state || "",
        isOnline: Boolean(session.isOnline),
        scope: session.scope || null,
        expires: session.expires ? new Date(session.expires) : null,
        accessToken: session.accessToken || "",
        userId: session.onlineAccessInfo?.associated_user?.id || null,
      })
      .onDuplicateKeyUpdate({
        set: {
          state: session.state || "",
          isOnline: Boolean(session.isOnline),
          scope: session.scope || null,
          expires: session.expires ? new Date(session.expires) : null,
          accessToken: session.accessToken || "",
        },
      });
    return true;
  }

  async loadSession(id) {
    const rows = await db
      .select()
      .from(schema.shopifySessions)
      .where(eq(schema.shopifySessions.id, id))
      .limit(1);
    return rows[0] ? rowToSession(rows[0]) : undefined;
  }

  async deleteSession(id) {
    await db.delete(schema.shopifySessions).where(eq(schema.shopifySessions.id, id));
    return true;
  }

  async deleteSessions(ids) {
    if (!ids.length) return true;
    await db.delete(schema.shopifySessions).where(inArray(schema.shopifySessions.id, ids));
    return true;
  }

  async findSessionsByShop(shop) {
    const rows = await db
      .select()
      .from(schema.shopifySessions)
      .where(eq(schema.shopifySessions.shop, shop));
    return rows.map(rowToSession);
  }
}