import { Building2, UserCircle, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { C, display, body } from "../theme";

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: "13px 18px", borderBottom: `1px solid ${C.lineSoft}` }}>
      <span style={{ fontSize: 13.5, color: C.inkSoft }}>{label}</span>
      <span style={{ fontSize: mono ? 12.5 : 14, fontWeight: mono ? 400 : 600, color: mono ? C.inkFaint : C.ink, fontFamily: mono ? "ui-monospace, monospace" : undefined }}>
        {value || "—"}
      </span>
    </div>
  );
}

function Card({ icon: Icon, title, children }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden" }}>
      <div className="flex items-center gap-2" style={{ padding: "14px 18px", borderBottom: `1px solid ${C.lineSoft}` }}>
        <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 8, background: C.brandSoft }}>
          <Icon size={15} color={C.brand} />
        </div>
        <h2 style={{ ...display, fontSize: 15.5, fontWeight: 600 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { user, signOut } = useAuth();

  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ ...display, fontSize: 28, fontWeight: 600, letterSpacing: -0.6, marginBottom: 4 }}>Settings</h1>
      <p style={{ color: C.inkSoft, fontSize: 14.5, marginBottom: 22 }}>Manage your workspace and account.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 18 }}>
        <Card icon={Building2} title="Workspace">
          <Row label="Company" value={user?.company} />
          <Row label="Workspace ID" value={user?.tenantId} mono />
        </Card>

        <Card icon={UserCircle} title="Your account">
          <Row label="Name" value={user?.name} />
          <Row label="Email" value={user?.email} />
          <div className="flex items-center justify-between" style={{ padding: "13px 18px" }}>
            <span style={{ fontSize: 13.5, color: C.inkSoft }}>Role</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.brandDark, background: C.brandSoft, padding: "4px 12px", borderRadius: 20, ...body }}>
              {user?.role}
            </span>
          </div>
        </Card>
      </div>

      {/* Danger zone */}
      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
        <div className="flex items-center justify-between" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Sign out</div>
            <div style={{ fontSize: 13, color: C.inkFaint, marginTop: 2 }}>End your session on this device.</div>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 press"
                  style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.surface, color: C.danger, fontSize: 14, fontWeight: 600, cursor: "pointer", ...body }}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}