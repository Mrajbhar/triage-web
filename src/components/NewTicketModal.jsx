import { useState } from "react";
import { X } from "lucide-react";
import { createTicket } from "../api";
import { C, display, body } from "../theme";
import { Field, inputStyle } from "./Primitives";
import { useModalA11y } from "../lib/useModalA11y";

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

// Modal for creating a ticket. Calls onCreated() so the dashboard can refresh.
export default function NewTicketModal({ onClose, onCreated }) {
  const dialogRef = useModalA11y(onClose);
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (saving) return;
    if (!subject.trim()) { setError("Subject is required."); return; }
    setSaving(true);
    setError(null);
    try {
      await createTicket({ subject: subject.trim(), priority });
      onCreated?.();
      onClose();
    } catch {
      setError("Couldn't create the ticket. Try again.");
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="overlay-in"
      style={{
        position: "fixed", inset: 0, background: "rgba(15,17,23,.45)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-ticket-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()} className="scale-in"
        style={{ width: "100%", maxWidth: 440, background: C.surface, borderRadius: 16, padding: 24, ...body }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <h2 id="new-ticket-title" style={{ ...display, fontSize: 19, fontWeight: 600, color: C.ink }}>New ticket</h2>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", color: C.inkFaint }}>
            <X size={18} />
          </button>
        </div>

        <Field label="Subject">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Briefly describe the issue"
            style={inputStyle}
            autoFocus
          />
        </Field>

        <Field label="Priority">
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${priority === p ? C.brand : C.line}`,
                  background: priority === p ? C.brandSoft : C.surface,
                  color: priority === p ? C.brandDark : C.inkSoft, ...body,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>

        {error && (
          <div style={{ fontSize: 13.5, color: C.danger, background: C.dangerSoft, padding: "9px 12px", borderRadius: 9, marginBottom: 6 }}>
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2" style={{ marginTop: 18 }}>
          <button
            onClick={onClose}
            style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.surface, color: C.inkSoft, fontSize: 14, fontWeight: 600, cursor: "pointer", ...body }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: saving ? C.brandDark : C.brand, color: "#fff", fontSize: 14, fontWeight: 600, cursor: saving ? "default" : "pointer", ...body }}
          >
            {saving ? "Creating…" : "Create ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}