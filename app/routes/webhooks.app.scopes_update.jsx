import { authenticate } from "../shopify.server.js";
import { db } from "../db/index.server.js";
import { shopifySessions } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const action = async ({ request }) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const current = payload.current;
  if (session) {
    await db
      .update(shopifySessions)
      .set({ scope: current.toString() })
      .where(eq(shopifySessions.id, session.id));
  }

  return new Response();
};