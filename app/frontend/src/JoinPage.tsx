import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authHub, authNode, getFarms } from "./admin/services/api";
import { useFarm } from "./user/store/FarmContext";

type State = "loading" | "success" | "error";

export default function JoinPage() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const { join }  = useFarm();

  const [state, setState]   = useState<State>("loading");
  const [message, setMessage] = useState("");
  const [name, setName]     = useState("");

  useEffect(() => {
    const type = params.get("type");
    const id   = Number(params.get("id"));
    const key  = params.get("key") ?? "";

    if (!type || !id || !key) {
      setState("error");
      setMessage("Invalid invite link — missing type, id, or key.");
      return;
    }

    (async () => {
      try {
        if (type === "hub") {
          const res = await authHub(key);
          localStorage.setItem("hub_key",  key);
          localStorage.setItem("hub_id",   String(res.hub_id));
          localStorage.setItem("hub_name", res.hub_name);
          setName(res.hub_name);
          setState("success");
          setTimeout(() => navigate("/admin"), 1800);

        } else if (type === "node") {
          const res   = await authNode(key);
          const farms = await getFarms();
          const farm  = farms.find(f => f.id === res.farm_id);
          if (!farm) throw new Error("Farm not found after auth");
          join(farm.id, farm.lat, farm.lng, farm.name);
          setName(farm.name);
          setState("success");
          setTimeout(() => navigate("/dashboard"), 1800);

        } else {
          setState("error");
          setMessage(`Unknown type: "${type}"`);
        }
      } catch (err: unknown) {
        setState("error");
        setMessage(err instanceof Error ? err.message : "Authentication failed — key may be invalid.");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#E8E5E0", fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 10, padding: "40px 48px", textAlign: "center",
        boxShadow: "0 8px 24px rgba(26,26,26,0.12)", maxWidth: 380, width: "100%",
      }}>
        {state === "loading" && (
          <>
            <Spinner />
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 20, color: "#1A1A1A" }}>
              Connecting you to the network…
            </div>
            <div style={{ fontSize: 12, color: "#9E9A94", marginTop: 6 }}>
              Verifying your access key
            </div>
          </>
        )}

        {state === "success" && (
          <>
            <div style={{ fontSize: 36 }}>🌱</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 16, color: "#1A1A1A" }}>
              You're in!
            </div>
            <div style={{ fontSize: 13, color: "#6B6762", marginTop: 8 }}>
              Connected as <strong>{name}</strong>
            </div>
            <div style={{ fontSize: 11, color: "#9E9A94", marginTop: 12 }}>
              Redirecting you now…
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <div style={{ fontSize: 36 }}>❌</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 16, color: "#D94F4F" }}>
              Connection failed
            </div>
            <div style={{ fontSize: 12, color: "#6B6762", marginTop: 8, lineHeight: 1.6 }}>
              {message}
            </div>
            <button
              onClick={() => window.history.back()}
              style={{
                marginTop: 20, padding: "8px 20px", borderRadius: 4,
                border: "1.5px solid #D1CDC7", background: "transparent",
                fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation: "spin 0.9s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="20" cy="20" r="16" fill="none" stroke="#E2DFD9" strokeWidth="3" />
      <path d="M20 4 A16 16 0 0 1 36 20" fill="none" stroke="#E8913A" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
