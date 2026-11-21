import { eq } from "drizzle-orm";
import { db } from "../db/index.server.js";
import { hardwareSpecs, rigBlueprints, blueprintSlots, auditLogs } from "../db/schema.js";

function parseShopifyProduct(node, shop) {
  const tags = (node.tags || []).map((t) => t.toLowerCase());
  const titleLower = node.title.toLowerCase();
  const typeRaw = (node.productType || "").trim();

  let category = "IEM";
  if (/dac/i.test(typeRaw) || titleLower.includes("dac")) category = "DAC";
  else if (/dap/i.test(typeRaw) || titleLower.includes("dap")) category = "DAP";
  else if (/cable/i.test(typeRaw) || titleLower.includes("cable")) category = "Cable";
  else if (/iem/i.test(typeRaw)) category = "IEM";

  let connectorType = "2-Pin";
  if (category === "DAC" || category === "DAP") connectorType = "N/A";
  else if (tags.includes("mmcx") || titleLower.includes("mmcx")) connectorType = "MMCX";

  let outputPort = "3.5mm + 4.4mm";
  if (category === "Cable") {
    outputPort = tags.includes("3.5mm") || titleLower.includes("3.5mm") ? "3.5mm" : "4.4mm";
  } else if (tags.includes("3.5mm-only") || titleLower.includes("3.5mm only")) {
    outputPort = "3.5mm-Only";
  }

  let powerLevel = "standard";
  if (
    tags.includes("high-power") ||
    titleLower.includes("planar") ||
    (category === "DAP" && !tags.includes("standard-power"))
  ) {
    powerLevel = "high";
  }

  const firstVariant = node.variants?.nodes?.[0];
  const retailPrice = Number(firstVariant?.price || 99);
  const rawCost = firstVariant?.inventoryItem?.unitCost?.amount;
  const unitCost = rawCost ? Number(rawCost) : Number((retailPrice * 0.58).toFixed(2));

  return {
    shop,
    shopifyProductId: node.id,
    title: node.title,
    category,
    connectorType,
    outputPort,
    powerLevel,
    retailPrice: retailPrice.toFixed(2),
    unitCost: unitCost.toFixed(2),
  };
}

export async function syncShopifyCatalog(admin, shop) {
  const response = await admin.graphql(`
    #graphql
    query SyncAudioCatalog {
      products(first: 50) {
        nodes {
          id
          title
          productType
          tags
          variants(first: 1) {
            nodes {
              price
              inventoryItem {
                unitCost {
                  amount
                }
              }
            }
          }
        }
      }
    }
  `);

  const json = await response.json();
  const products = json?.data?.products?.nodes || [];

  for (const node of products) {
    const parsed = parseShopifyProduct(node, shop);
    await db
      .insert(hardwareSpecs)
      .values(parsed)
      .onDuplicateKeyUpdate({
        set: {
          title: parsed.title,
          category: parsed.category,
          connectorType: parsed.connectorType,
          outputPort: parsed.outputPort,
          powerLevel: parsed.powerLevel,
          retailPrice: parsed.retailPrice,
          unitCost: parsed.unitCost,
        },
      });
  }

  await db.insert(auditLogs).values({
    shop,
    actionType: "SHOPIFY_SYNC",
    entityName: "Live Catalog Sync",
    scoreDelta: 0,
    payloadSummary: `Synced ${products.length} live products from Shopify Admin into MySQL hardware_specs.`,
  });

  return { ok: true, syncedCount: products.length };
}

export async function publishSelectedBlueprints(admin, shop, ids) {
  if (!ids.length) {
    return { error: "Select at least one blueprint to publish." };
  }

  const publishedTitles = [];

  for (const id of ids) {
    const [bp] = await db
      .select()
      .from(rigBlueprints)
      .where(eq(rigBlueprints.id, id))
      .limit(1);

    if (!bp) continue;

    // Relational JOIN across blueprint_slots -> hardware_specs
    const slots = await db
      .select({
        title: hardwareSpecs.title,
        category: hardwareSpecs.category,
        connectorType: hardwareSpecs.connectorType,
        outputPort: hardwareSpecs.outputPort,
        retailPrice: hardwareSpecs.retailPrice,
      })
      .from(blueprintSlots)
      .innerJoin(hardwareSpecs, eq(blueprintSlots.hardwareSpecId, hardwareSpecs.id))
      .where(eq(blueprintSlots.blueprintId, id));

    const grossRetail = slots.reduce((sum, s) => sum + Number(s.retailPrice), 0);
    const bundlePrice = (grossRetail * (1 - Number(bp.bundleDiscountPct) / 100)).toFixed(2);

    const itemsHtml = slots
      .map(
        (s) =>
          `<li><strong>${s.category}:</strong> ${s.title} (${s.connectorType !== "N/A" ? `${s.connectorType}, ` : ""}${s.outputPort})</li>`
      )
      .join("");

    const descriptionHtml = `
      <p><strong>IRIS AUDIO Verified Rig Bundle</strong> — Synergy Score: ${bp.synergyScore}/100 (${bp.useCaseProfile.replace("_", " ")}).</p>
      <ul>${itemsHtml}</ul>
      <p>Includes a ${bp.bundleDiscountPct}% bundle discount off combined retail ($${grossRetail.toFixed(2)}).</p>
    `;

    const createRes = await admin.graphql(
      `#graphql
      mutation CreateVerifiedBundle($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            variants(first: 1) {
              nodes { id }
            }
          }
          userErrors { field message }
        }
      }`,
      {
        variables: {
          product: {
            title: `${bp.name} (Verified Rig Bundle)`,
            productType: "Bundle",
            status: "DRAFT",
            tags: ["verified-bundle", `synergy-${bp.synergyScore}`, bp.useCaseProfile],
            descriptionHtml,
          },
        },
      }
    );

    const createJson = await createRes.json();
    const createdProduct = createJson?.data?.productCreate?.product;
    const variantId = createdProduct?.variants?.nodes?.[0]?.id;

    if (createdProduct?.id && variantId) {
      await admin.graphql(
        `#graphql
        mutation SetBundlePrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            productVariants { id price }
            userErrors { field message }
          }
        }`,
        {
          variables: {
            productId: createdProduct.id,
            variants: [{ id: variantId, price: bundlePrice }],
          },
        }
      );

      publishedTitles.push(createdProduct.title);

      await db.insert(auditLogs).values({
        shop,
        actionType: "BUNDLE_PUBLISHED",
        entityName: bp.name,
        scoreDelta: bp.synergyScore,
        payloadSummary: `Published to Shopify Admin as Draft Bundle ($${bundlePrice}) with ${slots.length} matched components.`,
      });
    }
  }

  return { ok: true, publishedCount: publishedTitles.length, publishedTitles };
}