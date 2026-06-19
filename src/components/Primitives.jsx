import { ChevronRight } from "lucide-react";
import { C, STATUS, PRIORITY, body } from "../theme";

// Small coloured pill used for status and priority.
export function Badge({ label, color, bg }) {
  return (
    <span
      style={{
        fontSize: 12.5, fontWeight: 600, color, background: bg,
        padding: "4px 11px", borderRadius: 20, display: "inline-block",
      }}
    >
      {label}
    </span>
  );
}

// Labelled form field wrapper.
export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 7 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 11,
  border: `1.5px solid ${C.line}`, background: C.surface,
  fontSize: 14.5, color: C.ink, outline: "none",
  fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box",
  transition: "border-color .15s",
};

// Dashboard summary card.
export function StatCard({ icon: Icon, label, value, tint, bg }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 18px" }}>
      <div className="flex items-center justify-center"
           style={{ width: 36, height: 36, borderRadius: 10, background: bg, marginBottom: 12 }}>
        <Icon size={18} color={tint} />
      </div>
      <div style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: 26, fontWeight: 600, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 5 }}>{label}</div>
    </div>
  );
}

// A single ticket row. `t` is normalised in Dashboard before being passed in.
export function TicketRow({ t, last, onClick }) {
  const s = STATUS[t.statusKey] ?? STATUS.open;
  const p = PRIORITY[t.priorityKey] ?? PRIORITY.medium;
  return (
    <div
      onClick={onClick}
      className="lg:grid items-center"
      style={{
        gridTemplateColumns: "1fr 130px 110px 130px 120px 24px", gap: 12,
        padding: "14px 20px", borderBottom: last ? "none" : `1px solid ${C.lineSoft}`,
        cursor: "pointer", ...body,
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = C.bg)}
      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12, fontWeight: 600, color: C.inkFaint }}>{t.ref}</span>
          {t.breaching && (
            <span style={{ fontSize: 11, fontWeight: 600, color: C.danger, background: C.dangerSoft, padding: "1px 7px", borderRadius: 20 }}>
              SLA risk
            </span>
          )}
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 500, marginTop: 3, color: C.ink }}>{t.subject}</div>
        <div style={{ fontSize: 12.5, color: C.inkFaint, marginTop: 2 }}>{t.requester}</div>
      </div>
      <div><Badge {...s} /></div>
      <div><Badge {...p} /></div>
      <div style={{ fontSize: 13.5, color: t.assignee === "Unassigned" ? C.inkFaint : C.ink, fontWeight: 500 }}>
        {t.assignee}
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: t.breaching ? C.danger : C.inkSoft }}>
        {t.sla}
      </div>
      <div className="flex justify-end"><ChevronRight size={16} color={C.inkFaint} /></div>
    </div>
  );
}