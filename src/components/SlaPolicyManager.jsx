import { useCallback, useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { getSlaPolicies, createSlaPolicy, deleteSlaPolicy } from "../api";
import { C, display, body } from "../theme";
import { Field, inputStyle } from "./Primitives";

// Render minutes as a friendly label (e.g. 90 -> "1h 30m", 1440 -> "1d").
function mins(m) {
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`;
  const d = Math.floor(m / 1440);
  const rem = m % 1440;
  return `${d}d${rem ? ` ${Math.floor(rem / 60)}h` : ""}`;
}

export default function SlaPolicyManager() {
  const [policies, setPolicies] = useState([]);
  const [state, setState] = useState("loading");
  const [form, setForm] = useState({ name: "", responseMins: "", resolveMins: "" });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    getSlaPolicies()
      .then((data) => { setPolicies(data); setState("ready"); })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const add = async () => {
    if (saving) return;
    const responseMins = parseInt(form.responseMins, 10);
    const resolveMins = parseInt(form.resolveMins, 10);
    if (!form.name.trim() || !responseMins || !resolveMins || responseMins <= 0 || resolveMins <= 0) {
      setError("Give a name and positive response/resolve minutes.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createSlaPolicy({ name: form.name.trim(), responseMins, resolveMins });
      setForm({ name: "", responseMins: "", resolveMins: "" });
      load();
    } catch {
      setError("Couldn't save the policy. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await deleteSlaPolicy(id);
    load();
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden", maxWidth: 620 }}>

      {state === "loading" && <div style={{ padding: "18px 20px", color: C.inkFaint, fontSize: 14 }}>Loading…</div>}
      {state === "error" && <div style={{ padding: "18px 20px", color: C.danger, fontSize: 14 }}>Couldn't load policies.</div>}

      {state === "ready" && policies.length === 0 && (
        <div style={{ padding: "16px 20px", color: C.inkFaint, fontSize: 13.5 }}>No policies yet — add one below.</div>
      )}

      {state === "ready" && policies.map((p) => (
        <div key={p.id} className="flex items-center" style={{ padding: "12px 20px", borderBottom: `1px solid ${C.lineSoft}`, gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{p.name}</div>
            <div style={{ fontSize: 12.5, color: C.inkFaint }}>
              Respond in {mins(p.responseMins)} · Resolve in {mins(p.resolveMins)}
            </div>
          </div>
          <button onClick={() => remove(p.id)} title="Delete"
                  style={{ border: "none", background: "transparent", cursor: "pointer", color: C.inkFaint }}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      {/* Add form */}
      <div style={{ padding: "16px 20px" }}>
        <div className="flex gap-2" style={{ marginBottom: 10 }}>
          <div style={{ flex: 2 }}>
            <input value={form.name} onChange={set("name")} placeholder="Policy name (e.g. Standard)" style={inputStyle} />
          </div>
        </div>
        <div className="flex gap-2" style={{ marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <input value={form.responseMins} onChange={set("responseMins")} placeholder="Response (min)" type="number" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <input value={form.resolveMins} onChange={set("resolveMins")} placeholder="Resolve (min)" type="number" style={inputStyle} />
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 13, color: C.danger, background: C.dangerSoft, padding: "8px 11px", borderRadius: 9, marginBottom: 10 }}>
            {error}
          </div>
        )}

        <button onClick={add} disabled={saving} className="flex items-center gap-2"
                style={{ padding: "9px 15px", borderRadius: 9, border: "none", background: saving ? C.brandDark : C.brand, color: "#fff", fontSize: 14, fontWeight: 600, cursor: saving ? "default" : "pointer", ...body }}>
          <Plus size={16} /> {saving ? "Adding…" : "Add policy"}
        </button>
      </div>
    </div>
  );
}