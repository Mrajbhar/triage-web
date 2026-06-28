import { useState } from "react";
import { X } from "lucide-react";
import { createUser } from "../api";
import { C, display, body } from "../theme";
import { Field, inputStyle } from "./Primitives";
import { useModalA11y } from "../lib/useModalA11y";

const ROLES = ["Agent", "Admin", "Requester"];

export default function InviteUserModal({ onClose, onCreated }) {
  const dialogRef = useModalA11y(onClose);
  const [form, setForm] = useState({ fullName: "", email: "", role: "Agent", password: "" });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (saving) return;
    if (!form.fullName.trim() || !form.email.trim() || form.password.length < 6) {
      setError("Fill every field; password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createUser(form);
      onCreated?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.status === 409
          ? "A user with this email already exists."
          : err.response?.status === 403
          ? "Only admins can add users."
          : "Couldn't create the user. Try again."
      );
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="overlay-in"
      style={{ position: "fixed", inset: 0, background: "rgba(15,17,23,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}
    >
      <div onClick={(e) => e.stopPropagation()} className="scale-in"
           ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="invite-title" tabIndex={-1}
           style={{ width: "100%", maxWidth: 440, background: C.surface, borderRadius: 16, padding: 24, ...body }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <h2 id="invite-title" style={{ ...display, fontSize: 19, fontWeight: 600, color: C.ink }}>Add a teammate</h2>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", color: C.inkFaint }}>
            <X size={18} />
          </button>
        </div>

        <Field label="Full name">
          <input value={form.fullName} onChange={set("fullName")} placeholder="Jordan Lee" style={inputStyle} autoFocus />
        </Field>

        <Field label="Work email">
          <input value={form.email} onChange={set("email")} placeholder="jordan@company.com" style={inputStyle} />
        </Field>

        <Field label="Role">
          <div className="flex gap-2">
            {ROLES.map((r) => (
              <button key={r} onClick={() => setForm((f) => ({ ...f, role: r }))}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${form.role === r ? C.brand : C.line}`,
                  background: form.role === r ? C.brandSoft : C.surface,
                  color: form.role === r ? C.brandDark : C.inkSoft, ...body,
                }}>
                {r}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Temporary password">
          <input type="password" value={form.password} onChange={set("password")} placeholder="At least 6 characters" style={inputStyle} />
        </Field>

        {error && (
          <div style={{ fontSize: 13.5, color: C.danger, background: C.dangerSoft, padding: "9px 12px", borderRadius: 9, marginBottom: 6 }}>
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2" style={{ marginTop: 18 }}>
          <button onClick={onClose}
            style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.surface, color: C.inkSoft, fontSize: 14, fontWeight: 600, cursor: "pointer", ...body }}>
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: saving ? C.brandDark : C.brand, color: "#fff", fontSize: 14, fontWeight: 600, cursor: saving ? "default" : "pointer", ...body }}>
            {saving ? "Adding…" : "Add teammate"}
          </button>
        </div>
      </div>
    </div>
  );
}