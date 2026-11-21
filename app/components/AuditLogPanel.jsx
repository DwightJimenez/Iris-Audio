export function AuditLogPanel({ logs }) {
  return (
    <section style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: 0 }}>Activity & Audit Log</h2>
      <div style={{ maxHeight: "240px", overflowY: "auto", fontSize: "13px" }}>
        {logs.length === 0 ? (
          <p style={{ color: "#6B7280" }}>No activity recorded yet.</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid #F3F4F6",
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: "#7A6348" }}>[{log.actionType}]</span>{" "}
                <strong>{log.entityName}</strong>: {log.payloadSummary}
              </div>
              <span style={{ color: "#9CA3AF", whiteSpace: "nowrap" }}>
                {new Date(log.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}