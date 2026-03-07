import NodalNetworkMap from "./nodal-network/NodalNetworkMap";

export default function App() {
  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <header style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        zIndex: 20,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, #4caf50, #2e7d32)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>
          🌿
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: -0.3 }}>
            MyCelium Network
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 0.5 }}>
            Urban Agriculture Distribution Network
          </p>
        </div>
      </header>

      <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <NodalNetworkMap />
      </main>
    </div>
  );
}
