import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authHub, authNode, getFarms, claimInvite } from "./admin/services/api";
import { useFarm } from "./user/store/FarmContext";

type State = "loading" | "form" | "submitting" | "success" | "error";

const INPUT: React.CSSProperties = {
  width: "100%", padding: "7px 10px", borderRadius: 5, boxSizing: "border-box",
  border: "1.5px solid #D1CDC7", fontSize: 13, fontFamily: "inherit", outline: "none",
  background: "#FAF9F7", color: "#1A1A1A",
};
const SELECT: React.CSSProperties = { ...INPUT };
const LABEL: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600, color: "#6B6762",
  marginBottom: 4, textAlign: "left",
};
const ROW: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };

export default function JoinPage() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const { join }  = useFarm();

  const [state, setState]     = useState<State>("loading");
  const [message, setMessage] = useState("");
  const [connectedAs, setConnectedAs] = useState("");

  // Invite form state
  const token = params.get("token") ?? "";
  const [form, setForm] = useState({
    name: "", lat: "43.6532", lng: "-79.3832",
    plot_size_sqft: "100", plot_type: "backyard",
    tools: "basic", budget: "low",
    pH: "6.5", moisture: "60", temperature: "20", humidity: "60",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const type = params.get("type");
    const id   = Number(params.get("id"));
    const key  = params.get("key") ?? "";

    if (type === "invite") {
      if (!token) { setState("error"); setMessage("Invalid invite link — missing token."); return; }
      setState("form");
      return;
    }

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
          setConnectedAs(res.hub_name);
          setState("success");
          setTimeout(() => navigate("/admin"), 1800);

        } else if (type === "node") {
          const res   = await authNode(key);
          const farms = await getFarms();
          const farm  = farms.find(f => f.id === res.farm_id);
          if (!farm) throw new Error("Farm not found after auth");
          join(farm.id, farm.lat, farm.lng, farm.name);
          setConnectedAs(farm.name);
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

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("submitting");
    try {
      const res = await claimInvite({
        token,
        name: form.name,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        plot_size_sqft: parseFloat(form.plot_size_sqft),
        plot_type: form.plot_type,
        tools: form.tools,
        budget: form.budget,
        pH: parseFloat(form.pH),
        moisture: parseFloat(form.moisture),
        temperature: parseFloat(form.temperature),
        humidity: parseFloat(form.humidity),
      });
      localStorage.setItem("node_key", res.key);
      localStorage.setItem("farm_id",  String(res.farm_id));
      join(res.farm_id, parseFloat(form.lat), parseFloat(form.lng), res.farm_name);
      setConnectedAs(res.farm_name);
      setState("success");
      setTimeout(() => navigate("/dashboard"), 1800);
    } catch (err: unknown) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Failed to join — token may be invalid or already used.");
    }
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff", borderRadius: 10,
    boxShadow: "0 8px 24px rgba(26,26,26,0.12)", width: "100%",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#E8E5E0", fontFamily: "'Inter', system-ui, sans-serif", padding: "24px 16px",
      boxSizing: "border-box",
    }}>
      <div style={{ ...cardStyle, maxWidth: state === "form" || state === "submitting" ? 480 : 380 }}>

        {/* Onboarding form */}
        {(state === "form" || state === "submitting") && (
          <form onSubmit={handleClaim} style={{ padding: "32px 36px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
              Join the Network
            </div>
            <div style={{ fontSize: 12, color: "#9E9A94", marginBottom: 24 }}>
              Tell us about your farm to get your crop assignment.
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={LABEL}>Farm name</label>
              <input style={INPUT} value={form.name} onChange={set("name")} required placeholder="e.g. My Rooftop Garden" />
            </div>

            <div style={{ ...ROW, marginBottom: 14 }}>
              <div>
                <label style={LABEL}>Latitude</label>
                <input style={INPUT} type="number" step="any" value={form.lat} onChange={set("lat")} required />
              </div>
              <div>
                <label style={LABEL}>Longitude</label>
                <input style={INPUT} type="number" step="any" value={form.lng} onChange={set("lng")} required />
              </div>
            </div>

            <div style={{ ...ROW, marginBottom: 14 }}>
              <div>
                <label style={LABEL}>Plot size (sqft)</label>
                <input style={INPUT} type="number" min="1" value={form.plot_size_sqft} onChange={set("plot_size_sqft")} required />
              </div>
              <div>
                <label style={LABEL}>Plot type</label>
                <select style={SELECT} value={form.plot_type} onChange={set("plot_type")}>
                  <option value="balcony">Balcony</option>
                  <option value="rooftop">Rooftop</option>
                  <option value="backyard">Backyard</option>
                  <option value="community">Community</option>
                </select>
              </div>
            </div>

            <div style={{ ...ROW, marginBottom: 14 }}>
              <div>
                <label style={LABEL}>Tools</label>
                <select style={SELECT} value={form.tools} onChange={set("tools")}>
                  <option value="basic">Basic</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label style={LABEL}>Budget</label>
                <select style={SELECT} value={form.budget} onChange={set("budget")}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "#9E9A94", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Soil Readings
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
              {(["pH", "moisture", "temperature", "humidity"] as const).map(k => (
                <div key={k}>
                  <label style={LABEL}>{k}</label>
                  <input style={INPUT} type="number" step="any" value={form[k]} onChange={set(k)} required />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={state === "submitting"}
              style={{
                width: "100%", padding: "11px", borderRadius: 6, border: "none",
                background: "#E8913A", color: "#fff", fontSize: 14, fontWeight: 700,
                fontFamily: "inherit", cursor: state === "submitting" ? "not-allowed" : "pointer",
                opacity: state === "submitting" ? 0.7 : 1,
              }}
            >
              {state === "submitting" ? "Joining…" : "Join Network"}
            </button>
          </form>
        )}

        {/* Loading */}
        {state === "loading" && (
          <div style={{ padding: "40px 48px", textAlign: "center" }}>
            <Spinner />
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 20, color: "#1A1A1A" }}>
              Connecting you to the network…
            </div>
            <div style={{ fontSize: 12, color: "#9E9A94", marginTop: 6 }}>
              Verifying your access key
            </div>
          </div>
        )}

        {/* Success */}
        {state === "success" && (
          <div style={{ padding: "40px 48px", textAlign: "center" }}>
            <div style={{ fontSize: 36 }}>🌱</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 16, color: "#1A1A1A" }}>
              You're in!
            </div>
            <div style={{ fontSize: 13, color: "#6B6762", marginTop: 8 }}>
              Connected as <strong>{connectedAs}</strong>
            </div>
            <div style={{ fontSize: 11, color: "#9E9A94", marginTop: 12 }}>
              Redirecting you now…
            </div>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div style={{ padding: "40px 48px", textAlign: "center" }}>
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
          </div>
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
