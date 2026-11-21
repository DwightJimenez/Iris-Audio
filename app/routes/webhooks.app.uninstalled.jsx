import { authenticate } from "../shopify.server.js";
import { db } from "../db/index.server.js";
import { shopifySessions } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  if (session) {
    await db.delete(shopifySessions).where(eq(shopifySessions.shop, shop));
  }

  return new Response();
};