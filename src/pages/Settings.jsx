import { useAuth } from "../context/AuthContext";
import { C, display, body } from "../theme";
import SlaPolicyManager from "../components/SlaPolicyManager";

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between"
         style={{ padding: "14px 20px", borderBottom: `1px solid ${C.lineSoft}` }}>
      <span style={{ fontSize: 13.5, color: C.inkSoft }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{value || "—"}</span>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden", marginBottom: 22, maxWidth: 560 }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.lineSoft}` }}>
        <h2 style={{ ...display, fontSize: 16, fontWeight: 600 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  return (
    <>
      <h1 style={{ ...display, fontSize: 26, fontWeight: 600, letterSpacing: -0.5, marginBottom: 20 }}>Settings</h1>

      <Card title="Workspace">
        <Row label="Company" value={user?.company} />
        <div className="flex items-center justify-between" style={{ padding: "14px 20px" }}>
          <span style={{ fontSize: 13.5, color: C.inkSoft }}>Workspace ID</span>
          <span style={{ fontSize: 12.5, fontFamily: "monospace", color: C.inkFaint }}>{user?.tenantId}</span>
        </div>
      </Card>

      <Card title="Your account">
        <Row label="Name" value={user?.name} />
        <Row label="Email" value={user?.email} />
        <div className="flex items-center justify-between" style={{ padding: "14px 20px" }}>
          <span style={{ fontSize: 13.5, color: C.inkSoft }}>Role</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: C.brandDark, background: C.brandSoft, padding: "4px 12px", borderRadius: 20, ...body }}>
            {user?.role}
          </span>
        </div>
      </Card>

      {isAdmin && <SlaPolicyManager />}

      <button
        onClick={signOut}
        style={{ padding: "11px 18px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.surface, color: C.danger, fontSize: 14, fontWeight: 600, cursor: "pointer", ...body }}
      >
        Sign out
      </button>
    </>
  );
}