import { useState } from "react";
import { useSubmit, useNavigation } from "react-router";

export function SavedBlueprintsList({ blueprints, onEdit }) {
  const submit = useSubmit();
  const nav = useNavigation();
  const [selectedIds, setSelectedIds] = useState([]);

  const publishableIds = blueprints.filter((bp) => bp.status === "ACTIVE").map((bp) => bp.id);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === publishableIds.length && publishableIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(publishableIds);
    }
  };

  const publishSelected = () => {
    if (selectedIds.length === 0) return;
    submit({ intent: "publish_selected", blueprintIds: selectedIds.join(",") }, { method: "post" });
    setSelectedIds([]);
  };

  return (
    <section style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>Saved Rig Blueprints</h2>

        {blueprints.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#4B5563", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={publishableIds.length > 0 && selectedIds.length === publishableIds.length}
                disabled={publishableIds.length === 0}
                onChange={toggleSelectAll}
              />
              Select All Passing ({publishableIds.length})
            </label>

            <button
              type="button"
              onClick={publishSelected}
              disabled={selectedIds.length === 0 || nav.state === "submitting"}
              style={{
                fontSize: "12px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: selectedIds.length > 0 ? "#059669" : "#9CA3AF",
                color: "#fff",
                fontWeight: 600,
                cursor: selectedIds.length > 0 ? "pointer" : "not-allowed",
              }}
            >
              {nav.state === "submitting" ? "Publishing..." : `Publish Selected (${selectedIds.length})`}
            </button>
          </div>
        )}
      </div>

      {blueprints.length === 0 ? (
        <p style={{ color: "#6B7280", fontSize: "14px" }}>
          No bundles saved yet. Test combinations on the left first, then save the ones you want to keep.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {blueprints.map((bp) => {
            const canPublish = bp.status === "ACTIVE";
            const isChecked = selectedIds.includes(bp.id);

            return (
              <div
                key={bp.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "6px",
                  border: isChecked ? "1.5px solid #059669" : "1px solid #E5E7EB",
                  background: canPublish ? "#ECFDF5" : "#FEF2F2",
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={!canPublish}
                  onChange={() => toggleSelect(bp.id)}
                  title={
                    canPublish
                      ? "Select to publish to Shopify"
                      : "Resolve synergy or margin warnings before publishing"
                  }
                  style={{
                    marginTop: "4px",
                    width: "16px",
                    height: "16px",
                    cursor: canPublish ? "pointer" : "not-allowed",
                  }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <strong>{bp.name}</strong>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "99px",
                        fontSize: "12px",
                        fontWeight: 700,
                        background: canPublish ? "#059669" : "#DC2626",
                        color: "#fff",
                      }}
                    >
                      {bp.synergyScore}/100 ({bp.status})
                    </span>
                  </div>

                  <div style={{ fontSize: "12px", color: "#4B5563", marginTop: "4px" }}>
                    Profile: {bp.useCaseProfile} • Discount: {bp.bundleDiscountPct}% • Net Margin: {bp.netMarginPct}%
                  </div>

                  {Array.isArray(bp.warningsJson) && bp.warningsJson.length > 0 && (
                    <ul style={{ margin: "8px 0 0", paddingLeft: "18px", fontSize: "12px", color: "#991B1B" }}>
                      {bp.warningsJson.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  )}

                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    <button
                      type="button"
                      onClick={() => onEdit(bp)}
                      style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "4px", border: "1px solid #9CA3AF", background: "#fff", cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIds((prev) => prev.filter((id) => id !== bp.id));
                        submit({ intent: "delete_blueprint", blueprintId: String(bp.id), name: bp.name }, { method: "post" });
                      }}
                      style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "4px", border: "1px solid #FCA5A5", color: "#B91C1C", background: "#fff", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}