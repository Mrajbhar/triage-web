import { useCallback, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { getUsers } from "../api";
import { useAuth } from "../context/AuthContext";
import { C, display, body } from "../theme";
import { initials } from "../lib/tickets";
import InviteUserModal from "../components/InviteUserModal";

const ROLE_STYLE = {
  admin:     { color: "#0F766E", bg: "#E2F1EE" },
  agent:     { color: "#2563EB", bg: "#E6EEFB" },
  requester: { color: "#6B7280", bg: "#F0EFEC" },
};

export default function People() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [state, setState] = useState("loading");
  const [showInvite, setShowInvite] = useState(false);

  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const load = useCallback(() => {
    getUsers()
      .then((data) => { setUsers(data); setState("ready"); })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <h1 style={{ ...display, fontSize: 26, fontWeight: 600, letterSpacing: -0.5 }}>People</h1>
        {isAdmin && (
          <button onClick={() => setShowInvite(true)} className="flex items-center gap-2"
            style={{ background: C.brand, color: "#fff", border: "none", borderRadius: 10, padding: "9px 15px", fontSize: 14, fontWeight: 600, cursor: "pointer", ...body }}>
            <UserPlus size={16} /> Add teammate
          </button>
        )}
      </div>
      <p style={{ color: C.inkSoft, marginTop: 4, fontSize: 14.5, marginBottom: 20 }}>
        {state === "ready" ? `${users.length} member${users.length === 1 ? "" : "s"} in your workspace.` : "Loading…"}
      </p>

      {state === "loading" && <div style={{ color: C.inkFaint, fontSize: 14 }}>Loading people…</div>}
      {state === "error" && <div style={{ color: C.danger, fontSize: 14 }}>Couldn't load people. Check that the API is running.</div>}

      {state === "ready" && (
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden" }}>
          {users.map((u, i) => {
            const role = ROLE_STYLE[(u.role || "").toLowerCase()] ?? ROLE_STYLE.requester;
            return (
              <div key={u.id} className="flex items-center gap-3"
                   style={{ padding: "14px 20px", borderBottom: i === users.length - 1 ? "none" : `1px solid ${C.lineSoft}` }}>
                <div className="flex items-center justify-center"
                     style={{ width: 38, height: 38, borderRadius: "50%", background: C.panel, color: "#fff", fontSize: 13, fontWeight: 600 }}>
                  {initials(u.fullName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>{u.fullName}</div>
                  <div style={{ fontSize: 13, color: C.inkFaint }}>{u.email}</div>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: role.color, background: role.bg, padding: "4px 12px", borderRadius: 20, ...body }}>
                  {u.role}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {showInvite && (
        <InviteUserModal onClose={() => setShowInvite(false)} onCreated={load} />
      )}
    </>
  );
}