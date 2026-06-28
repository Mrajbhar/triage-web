import { useCallback, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { getUsers, updateUserRole } from "../api";
import { useAuth } from "../context/AuthContext";
import { C, display, body } from "../theme";
import { initials } from "../lib/tickets";
import InviteUserModal from "../components/InviteUserModal";

const ROLE_STYLE = {
  admin:     { color: "#0F766E", bg: "#E2F1EE" },
  agent:     { color: "#2563EB", bg: "#E6EEFB" },
  requester: { color: "#6B7280", bg: "#F0EFEC" },
};
const ROLES = ["Admin", "Agent", "Requester"];

export default function People() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [state, setState] = useState("loading");
  const [showInvite, setShowInvite] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const load = useCallback(() => {
    getUsers()
      .then((data) => { setUsers(data); setState("ready"); })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (id, role) => {
    setSavingId(id);
    setError(null);
    const prev = users;
    // optimistic update
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, role } : u)));
    try {
      await updateUserRole(id, role);
    } catch (err) {
      setUsers(prev); // roll back
      setError(
        err.response?.status === 403 ? "Only admins can change roles."
        : err.response?.data?.message || "Couldn't update the role. Try again."
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <div className="flex items-end justify-between" style={{ flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
        <div>
          <h1 style={{ ...display, fontSize: 28, fontWeight: 600, letterSpacing: -0.6 }}>People</h1>
          <p style={{ color: C.inkSoft, marginTop: 5, fontSize: 14.5 }}>
            {state === "ready" ? `${users.length} member${users.length === 1 ? "" : "s"} in your workspace` : "Loading your team…"}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 press"
            style={{ background: C.brand, color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", ...body }}>
            <UserPlus size={16} /> Add teammate
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: C.danger, background: C.dangerSoft, fontSize: 13.5, padding: "10px 14px", borderRadius: 10, marginBottom: 16 }}>
          {error}
        </div>
      )}
      {state === "error" && (
        <div style={{ color: C.danger, fontSize: 14, padding: "40px 0", textAlign: "center" }}>
          Couldn't load people. Check that the API is running.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {state === "loading" && [0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
            <div className="flex items-center gap-3">
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: "50%" }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: "60%", height: 13 }} />
                <div className="skeleton" style={{ width: "85%", height: 11, marginTop: 8 }} />
              </div>
            </div>
          </div>
        ))}

        {state === "ready" && users.map((u) => {
          const roleKey = (u.role || "").toLowerCase();
          const role = ROLE_STYLE[roleKey] ?? ROLE_STYLE.requester;
          const isSelf = u.id === user?.userId;
          // an admin can edit everyone except themselves
          const editable = isAdmin && !isSelf;
          return (
            <div key={u.id} className="lift" style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center"
                     style={{ width: 44, height: 44, borderRadius: "50%", background: C.panel, color: "#fff", fontSize: 15, fontWeight: 600, flexShrink: 0 }}>
                  {initials(u.fullName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.fullName}</span>
                    {isSelf && <span style={{ fontSize: 11, color: C.inkFaint, fontWeight: 600 }}>You</span>}
                  </div>
                  <div style={{ fontSize: 13, color: C.inkFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                {editable ? (
                  <select
                    value={ROLES.find((r) => r.toLowerCase() === roleKey) || "Requester"}
                    disabled={savingId === u.id}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    style={{ padding: "7px 11px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                             border: `1.5px solid ${C.line}`, background: C.surface, color: C.ink,
                             cursor: savingId === u.id ? "default" : "pointer", ...body,
                             opacity: savingId === u.id ? 0.6 : 1 }}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 600, color: role.color, background: role.bg, padding: "4px 12px", borderRadius: 20, ...body }}>
                    {u.role}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showInvite && <InviteUserModal onClose={() => setShowInvite(false)} onCreated={load} />}
    </>
  );
}