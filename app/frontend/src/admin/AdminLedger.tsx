import { useState, useEffect } from "react";
import { getLedger } from "./services/api";
import type { LedgerEntry } from "./services/api";
import { T } from "./nodal-network/tokens";

export default function AdminLedger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLedger()
      .then(data => {
        setEntries(data);
        setLoading(false);
      })
      .catch(err => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  const containerStyle: React.CSSProperties = {
    padding: "16px 20px 24px",
    fontFamily: T.fb,
  };

  const panelStyle: React.CSSProperties = {
    background: T.bgElev,
    borderRadius: T.rMd,
    overflow: "hidden",
    boxShadow: T.shSm,
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderBottom: `1px solid ${T.borderLt}`,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: T.ink,
  };

  const th: React.CSSProperties = {
    textAlign: "left",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: T.ink3,
    padding: "10px 20px",
    background: T.bgCard,
    borderBottom: `1px solid ${T.borderLt}`,
  };

  const td: React.CSSProperties = {
    padding: "11px 20px",
    fontSize: 12,
    color: T.ink,
    borderBottom: `1px solid ${T.borderLt}`,
  };

  const emptyStyle: React.CSSProperties = {
    padding: "40px 20px",
    textAlign: "center",
    fontSize: 12,
    color: T.ink3,
  };

  if (loading) {
    return (
      <div style={{ ...containerStyle, ...emptyStyle }}>
        Loading ledger…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...containerStyle, ...emptyStyle, color: T.error }}>
        Failed to load ledger: {error}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={panelStyle}>
        <div style={headerStyle}>
          <div style={titleStyle}>Ledger</div>
          <span style={{
            display: "inline-flex", alignItems: "center",
            fontSize: 10, fontWeight: 600, padding: "2px 7px",
            borderRadius: T.rXs, letterSpacing: "0.02em",
            background: T.accentBg, color: T.accent,
          }}>
            {entries.length} entries
          </span>
        </div>
        {entries.length === 0 ? (
          <div style={emptyStyle}>No ledger entries found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Farm ID</th>
                <th style={th}>Type</th>
                <th style={th}>Amount</th>
                <th style={th}>Currency</th>
                <th style={th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td style={{ ...td, color: T.ink3 }}>{entry.id}</td>
                  <td style={td}>{entry.node_id}</td>
                  <td style={td}>{entry.type}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{entry.amount.toFixed(2)}</td>
                  <td style={td}>{entry.currency}</td>
                  <td style={{ ...td, color: T.ink3 }}>
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
