import { useState, useEffect } from "react";
import { useSubmit, useNavigation, useFetcher } from "react-router";

export function RigBuilderForm({ specs, editingBlueprint, onClearEdit }) {
  const submit = useSubmit();
  const nav = useNavigation();
  const previewFetcher = useFetcher();

  const iems = specs.filter((s) => s.category === "IEM");
  const sources = specs.filter((s) => s.category === "DAC" || s.category === "DAP");
  const cables = specs.filter((s) => s.category === "Cable");

  const [name, setName] = useState("Daily Carry 4.4mm Bundle");
  const [useCaseProfile, setUseCaseProfile] = useState("daily_commute");
  const [discountPct, setDiscountPct] = useState("8");
  const [iemId, setIemId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [cableId, setCableId] = useState("");
  const [previewResult, setPreviewResult] = useState(null);

  useEffect(() => {
    if (!iemId && iems[0]) setIemId(String(iems[0].id));
    if (!sourceId && sources[0]) setSourceId(String(sources[0].id));
  }, [specs]);

  useEffect(() => {
    if (editingBlueprint) {
      setName(editingBlueprint.name);
      setUseCaseProfile(editingBlueprint.useCaseProfile);
      setDiscountPct(String(editingBlueprint.bundleDiscountPct));
      setPreviewResult(null);
    }
  }, [editingBlueprint]);

  useEffect(() => {
    if (previewFetcher.data?.preview && previewFetcher.data?.result) {
      setPreviewResult(previewFetcher.data.result);
    }
  }, [previewFetcher.data]);

  const handleFieldChange = (setter) => (value) => {
    setter(value);
    setPreviewResult(null);
  };

  const runSynergyPreview = () => {
    previewFetcher.submit(
      { intent: "preview_synergy", useCaseProfile, discountPct, iemId, sourceId, cableId },
      { method: "post" }
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!previewResult) return;

    submit(
      {
        intent: "save_blueprint",
        ...(editingBlueprint ? { blueprintId: String(editingBlueprint.id) } : {}),
        name,
        useCaseProfile,
        discountPct,
        iemId,
        sourceId,
        cableId,
      },
      { method: "post" }
    );
    onClearEdit();
    setPreviewResult(null);
  };

  return (
    <section style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: 0 }}>
        {editingBlueprint ? `Edit Rig Blueprint #${editingBlueprint.id}` : "Test & Create Rig Bundle"}
      </h2>

      {specs.length === 0 ? (
        <p style={{ color: "#6B7280", fontSize: "14px" }}>
          No products synced yet. Click <strong>"Sync Live Products from Shopify"</strong> in the top right to import your store's IEMs, DACs, DAPs, and Cables into MySQL.
        </p>
      ) : (
        <form method="post" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <label>
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Bundle Name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Listening Profile</div>
              <select
                value={useCaseProfile}
                onChange={(e) => handleFieldChange(setUseCaseProfile)(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }}
              >
                <option value="daily_commute">Daily Commute</option>
                <option value="stage_monitoring">Stage Monitoring</option>
                <option value="desktop_reference">Desktop Reference</option>
              </select>
            </label>

            <label>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Bundle Discount (%)</div>
              <input
                type="number"
                min="0"
                max="60"
                value={discountPct}
                onChange={(e) => handleFieldChange(setDiscountPct)(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }}
              />
            </label>
          </div>

          <label>
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>In-Ear Monitor (IEM)</div>
            <select
              value={iemId}
              onChange={(e) => handleFieldChange(setIemId)(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }}
            >
              <option value="">-- Select IEM --</option>
              {iems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.connectorType}, {item.powerLevel} power) — ${item.retailPrice}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>DAC or DAP Source</div>
            <select
              value={sourceId}
              onChange={(e) => handleFieldChange(setSourceId)(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }}
            >
              <option value="">-- Select DAC / DAP --</option>
              {sources.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.outputPort}, {item.powerLevel} power) — ${item.retailPrice}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Upgrade Cable (Optional)</div>
            <select
              value={cableId}
              onChange={(e) => handleFieldChange(setCableId)(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }}
            >
              <option value="">-- None --</option>
              {cables.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.connectorType} → {item.outputPort}) — ${item.retailPrice}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={runSynergyPreview}
            disabled={!iemId || !sourceId || previewFetcher.state === "submitting"}
            style={{
              background: "#111827",
              color: "#fff",
              padding: "10px",
              borderRadius: "6px",
              border: "none",
              fontWeight: 600,
              cursor: !iemId || !sourceId ? "not-allowed" : "pointer",
              opacity: !iemId || !sourceId ? 0.5 : 1,
            }}
          >
            {previewFetcher.state === "submitting" ? "Evaluating Synergy..." : "1. Run Synergy Check (No Save)"}
          </button>

          {previewFetcher.data?.error && (
            <div style={{ padding: "12px", borderRadius: "6px", background: "#FEF2F2", color: "#991B1B", fontSize: "13px" }}>
              {previewFetcher.data.error}
            </div>
          )}

          {previewResult && (
            <div
              style={{
                padding: "14px",
                borderRadius: "6px",
                border: `1px solid ${previewResult.synergyScore >= 72 ? "#10B981" : "#EF4444"}`,
                background: previewResult.synergyScore >= 72 ? "#ECFDF5" : "#FEF2F2",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "14px" }}>
                  Preview Score: {previewResult.synergyScore}/100 ({previewResult.grade})
                </strong>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "99px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: previewResult.synergyScore >= 72 ? "#059669" : "#DC2626",
                    color: "#fff",
                  }}
                >
                  {previewResult.status}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#374151", marginTop: "6px" }}>
                Retail: ${previewResult.grossRetail} → Bundle: <strong>${previewResult.discountedPrice}</strong> • Net Margin:{" "}
                <strong>{previewResult.netMarginPct}%</strong>
              </div>
              {previewResult.warnings.length > 0 ? (
                <ul style={{ margin: "8px 0 0", paddingLeft: "18px", fontSize: "12px", color: "#991B1B" }}>
                  {previewResult.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: "12px", color: "#065F46", marginTop: "6px" }}>
                  ✓ All connector, output jack, power headroom, and margin checks passed.
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button
              type="submit"
              disabled={!previewResult || nav.state === "submitting"}
              style={{
                flex: 1,
                background: previewResult ? "#7A6348" : "#9CA3AF",
                color: "#fff",
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                fontWeight: 600,
                cursor: previewResult ? "pointer" : "not-allowed",
              }}
            >
              {editingBlueprint
                ? "2. Save Updated Blueprint"
                : previewResult
                ? `2. Save Blueprint to DB (${previewResult.status})`
                : "Run Synergy Check First to Unlock Save"}
            </button>
            {editingBlueprint && (
              <button
                type="button"
                onClick={() => {
                  onClearEdit();
                  setPreviewResult(null);
                }}
                style={{ padding: "10px 14px", borderRadius: "6px", border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}