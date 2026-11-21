import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.server.js";
import { hardwareSpecs, rigBlueprints, blueprintSlots, auditLogs } from "../db/schema.js";
import { evaluateAudioRigSynergy } from "./synergyEngine.server.js";

export async function getDashboardData(shop) {
  const [specs, blueprints, logs] = await Promise.all([
    db.select().from(hardwareSpecs).where(eq(hardwareSpecs.shop, shop)),
    db
      .select()
      .from(rigBlueprints)
      .where(eq(rigBlueprints.shop, shop))
      .orderBy(desc(rigBlueprints.updatedAt)),
    db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.shop, shop))
      .orderBy(desc(auditLogs.createdAt))
      .limit(15),
  ]);

  return { specs, blueprints, logs };
}

export async function previewBlueprintSynergy(shop, { iemId, sourceId, cableId, useCaseProfile, discountPct }) {
  const allSpecs = await db.select().from(hardwareSpecs).where(eq(hardwareSpecs.shop, shop));
  const iem = allSpecs.find((s) => s.id === iemId);
  const source = allSpecs.find((s) => s.id === sourceId);
  const cable = cableId ? allSpecs.find((s) => s.id === cableId) : null;

  if (!iem || !source) {
    return { error: "Select both an IEM and a DAC/DAP source before running the check." };
  }

  const result = evaluateAudioRigSynergy(iem, source, cable, useCaseProfile, discountPct);
  return { preview: true, result };
}

export async function saveBlueprint(
  shop,
  { blueprintId, name, useCaseProfile, discountPct, iemId, sourceId, cableId }
) {
  const allSpecs = await db.select().from(hardwareSpecs).where(eq(hardwareSpecs.shop, shop));
  const iem = allSpecs.find((s) => s.id === iemId);
  const source = allSpecs.find((s) => s.id === sourceId);
  const cable = cableId ? allSpecs.find((s) => s.id === cableId) : null;

  if (!iem || !source) {
    return { error: "Both an IEM and a DAC/DAP source are required." };
  }

  const result = evaluateAudioRigSynergy(iem, source, cable, useCaseProfile, discountPct);
  let targetId = blueprintId;

  if (blueprintId) {
    await db
      .update(rigBlueprints)
      .set({
        name,
        useCaseProfile,
        bundleDiscountPct: discountPct.toFixed(2),
        synergyScore: result.synergyScore,
        netMarginPct: result.netMarginPct.toFixed(2),
        warningsJson: result.warnings,
        status: result.status,
      })
      .where(eq(rigBlueprints.id, blueprintId));

    await db.delete(blueprintSlots).where(eq(blueprintSlots.blueprintId, blueprintId));
  } else {
    const [inserted] = await db.insert(rigBlueprints).values({
      shop,
      name,
      useCaseProfile,
      bundleDiscountPct: discountPct.toFixed(2),
      synergyScore: result.synergyScore,
      netMarginPct: result.netMarginPct.toFixed(2),
      warningsJson: result.warnings,
      status: result.status,
    });
    targetId = inserted.insertId;
  }

  if (targetId) {
    const slotRows = [
      { blueprintId: targetId, hardwareSpecId: iem.id, slotRole: "iem" },
      { blueprintId: targetId, hardwareSpecId: source.id, slotRole: "source" },
    ];
    if (cable) slotRows.push({ blueprintId: targetId, hardwareSpecId: cable.id, slotRole: "cable" });
    await db.insert(blueprintSlots).values(slotRows);
  }

  await db.insert(auditLogs).values({
    shop,
    actionType: blueprintId ? "RIG_UPDATED" : "RIG_CREATED",
    entityName: name,
    scoreDelta: result.synergyScore,
    payloadSummary: `${iem.title} + ${source.title}${cable ? ` + ${cable.title}` : ""} → Score: ${result.synergyScore}/100, Margin: ${result.netMarginPct}% (${result.status}).`,
  });

  return { ok: true, result };
}

export async function deleteBlueprint(shop, id, name) {
  await db.delete(rigBlueprints).where(eq(rigBlueprints.id, id));
  await db.insert(auditLogs).values({
    shop,
    actionType: "RIG_DELETED",
    entityName: name || `Blueprint #${id}`,
    scoreDelta: 0,
    payloadSummary: `Deleted rig blueprint "${name || `#${id}`}".`,
  });
  return { ok: true };
}