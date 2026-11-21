import { useState } from "react";
import { useLoaderData, useSubmit, useNavigation } from "react-router";
import { authenticate } from "../shopify.server.js";
import { syncShopifyCatalog, publishSelectedBlueprints } from "../services/shopifyCatalog.server.js";
import {
  getDashboardData,
  previewBlueprintSynergy,
  saveBlueprint,
  deleteBlueprint,
} from "../services/blueprint.server.js";
import { KpiCards } from "../components/KpiCards.jsx";
import { RigBuilderForm } from "../components/RigBuilderForm.jsx";
import { SavedBlueprintsList } from "../components/SavedBlueprintsList.jsx";
import { AuditLogPanel } from "../components/AuditLogPanel.jsx";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return getDashboardData(session.shop);
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = String(formData.get("intent"));

  if (intent === "sync_shopify") {
    return syncShopifyCatalog(admin, shop);
  }

  if (intent === "preview_synergy") {
    return previewBlueprintSynergy(shop, {
      useCaseProfile: String(formData.get("useCaseProfile")),
      discountPct: Number(formData.get("discountPct") || 5),
      iemId: Number(formData.get("iemId")),
      sourceId: Number(formData.get("sourceId")),
      cableId: formData.get("cableId") ? Number(formData.get("cableId")) : null,
    });
  }

  if (intent === "save_blueprint") {
    return saveBlueprint(shop, {
      blueprintId: formData.get("blueprintId") ? Number(formData.get("blueprintId")) : null,
      name: String(formData.get("name")),
      useCaseProfile: String(formData.get("useCaseProfile")),
      discountPct: Number(formData.get("discountPct") || 5),
      iemId: Number(formData.get("iemId")),
      sourceId: Number(formData.get("sourceId")),
      cableId: formData.get("cableId") ? Number(formData.get("cableId")) : null,
    });
  }

  if (intent === "publish_selected") {
    const ids = String(formData.get("blueprintIds") || "")
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    return publishSelectedBlueprints(admin, shop, ids);
  }

  if (intent === "delete_blueprint") {
    return deleteBlueprint(shop, Number(formData.get("blueprintId")), String(formData.get("name") || ""));
  }

  return { ok: false };
};

export default function IrisAudioSynergyDashboard() {
  const { specs, blueprints, logs } = useLoaderData();
  const submit = useSubmit();
  const nav = useNavigation();
  const [editingBlueprint, setEditingBlueprint] = useState(null);

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", color: "#111827", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
            IRIS AUDIO // Rig Synergy & Margin Studio
          </h1>
          <p style={{ color: "#4B5563", margin: "4px 0 0", fontSize: "14px" }}>
            Test 2-Pin/MMCX sockets, 4.4mm output jacks, planar power headroom & bundle profit margins before publishing.
          </p>
        </div>

        <button
          onClick={() => submit({ intent: "sync_shopify" }, { method: "post" })}
          disabled={nav.state === "submitting"}
          style={{
            background: "#111827",
            color: "#FFFFFF",
            padding: "10px 18px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {nav.state === "submitting" ? "Syncing..." : "Sync Live Products from Shopify"}
        </button>
      </header>

      <KpiCards specsCount={specs.length} blueprints={blueprints} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
        <RigBuilderForm
          specs={specs}
          editingBlueprint={editingBlueprint}
          onClearEdit={() => setEditingBlueprint(null)}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <SavedBlueprintsList
            blueprints={blueprints}
            onEdit={(bp) => setEditingBlueprint(bp)}
          />
          <AuditLogPanel logs={logs} />
        </div>
      </div>
    </div>
  );
}