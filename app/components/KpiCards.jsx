export function KpiCards({ specsCount, blueprints }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
      <div style={{ background: "#fff", padding: "18px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: "12px", textTransform: "uppercase", color: "#6B7280" }}>Synced Store Products</div>
        <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "4px" }}>{specsCount}</div>
      </div>
      <div style={{ background: "#fff", padding: "18px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: "12px", textTransform: "uppercase", color: "#6B7280" }}>Saved Rig Blueprints</div>
        <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "4px" }}>{blueprints.length}</div>
      </div>
    </div>
  );
}