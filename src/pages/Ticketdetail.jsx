import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Send, GitCommitHorizontal, AlertTriangle, Clock } from "lucide-react";
import { getTicket, updateTicket, getComments, addComment, getEvents, getUsers } from "../api";
import { C, display, body, STATUS, PRIORITY } from "../theme";
import { Badge } from "../components/Primitives";
import { initials, slaInfo } from "../lib/tickets";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";

const STATUSES = ["Open", "Pending", "Resolved"];

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TicketDetail({ id: propId, embedded = false }) {
  const params = useParams();
  const id = propId ?? params.id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const canPostInternal = (user?.role || "").toLowerCase() !== "requester";
  const canAssign = canPostInternal;

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [state, setState] = useState("loading");

  const [draft, setDraft] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    Promise.all([getTicket(id), getComments(id), getEvents(id)])
      .then(([t, c, e]) => { setTicket(t); setComments(c); setEvents(e); setState("ready"); })
      .catch(() => setState("error"));
    if (canAssign) getUsers().then(setUsers).catch(() => {});
  }, [id, canAssign]);

  useEffect(() => { load(); }, [load]);
  useRealtime((p) => { if (!p || p.ticketId === id) load(); });

  const feed = useMemo(() => {
    const c = comments.map((x) => ({ kind: "comment", at: x.createdAt, data: x }));
    const e = events.map((x) => ({ kind: "event", at: x.createdAt, data: x }));
    return [...c, ...e].sort((a, b) => new Date(a.at) - new Date(b.at));
  }, [comments, events]);

  const changeStatus = async (status) => {
    const updated = await updateTicket(id, { status });
    setTicket(updated);
    getEvents(id).then(setEvents);
  };

  const changeAssignee = async (assigneeId) => {
    if (!assigneeId) return;
    const updated = await updateTicket(id, { assigneeId });
    setTicket(updated);
    getEvents(id).then(setEvents);
  };

  const submitComment = async () => {
    if (sending || !draft.trim()) return;
    setSending(true);
    try {
      const created = await addComment(id, { body: draft.trim(), isInternal });
      setComments((prev) => [...prev, created]);
      setDraft("");
      setIsInternal(false);
    } finally {
      setSending(false);
    }
  };

  if (state === "loading") return <Centered>Loading ticket…</Centered>;
  if (state === "error" || !ticket) return <Centered danger>Couldn't load this ticket.</Centered>;

  const s = STATUS[(ticket.status || "").toLowerCase()] ?? STATUS.open;
  const p = PRIORITY[(ticket.priority || "").toLowerCase()] ?? PRIORITY.medium;
  const sla = slaInfo(ticket);

  return (
    <div style={embedded ? undefined : { maxWidth: 1080, margin: "0 auto" }}>
      <button onClick={() => navigate("/tickets")}
              className={`flex items-center gap-2 press ${embedded ? "lg:hidden" : ""}`}
              style={{ border: "none", background: "transparent", color: C.inkSoft, fontSize: 14, cursor: "pointer", marginBottom: 16, ...body }}>
        <ArrowLeft size={16} /> Back to tickets
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left: header + activity + composer */}
        <div className="xl:col-span-2">
          {/* Header card */}
          <div style={{ position: "relative", overflow: "hidden", background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div aria-hidden style={{ position: "absolute", top: -30, right: -30, width: 110, height: 110, borderRadius: "50%", background: sla.breaching ? "#DC2626" : C.brand, opacity: 0.07 }} />
            <div className="flex items-center gap-2" style={{ marginBottom: 10, position: "relative" }}>
              <Badge {...s} />
              <Badge {...p} />
              {sla.breaching && (
                <span className="flex items-center gap-1" style={{ fontSize: 11.5, fontWeight: 600, color: C.danger, background: C.dangerSoft, padding: "3px 10px", borderRadius: 20 }}>
                  <AlertTriangle size={12} /> {sla.label}
                </span>
              )}
            </div>
            <h1 style={{ ...display, fontSize: 24, fontWeight: 600, letterSpacing: -0.4, position: "relative" }}>{ticket.subject}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1" style={{ marginTop: 10, fontSize: 13, color: C.inkFaint, position: "relative" }}>
              <span>Opened by <strong style={{ color: C.inkSoft, fontWeight: 600 }}>{ticket.requester}</strong></span>
              <span>·</span>
              <span>{timeAgo(ticket.createdAt)}</span>
            </div>
          </div>

          {/* Activity timeline */}
          <h2 style={{ ...display, fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Activity</h2>
          <div style={{ position: "relative", marginBottom: 20 }}>
            {feed.length > 1 && (
              <div aria-hidden style={{ position: "absolute", left: 15, top: 12, bottom: 12, width: 2, background: C.lineSoft }} />
            )}
            <div className="flex flex-col gap-3">
              {feed.length === 0 && (
                <div style={{ color: C.inkFaint, fontSize: 14 }}>No activity yet. Start the conversation below.</div>
              )}
              {feed.map((item) =>
                item.kind === "comment"
                  ? <CommentItem key={`c-${item.data.id}`} c={item.data} />
                  : <EventItem key={`e-${item.data.id}`} e={item.data} />
              )}
            </div>
          </div>

          {/* Composer */}
          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={isInternal ? "Write an internal note (only agents see this)…" : "Write a reply…"}
              rows={3}
              style={{ width: "100%", border: "none", outline: "none", resize: "vertical", fontSize: 14, ...body, color: C.ink, background: "transparent", boxSizing: "border-box" }}
            />
            <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
              {canPostInternal ? (
                <label className="flex items-center gap-2" style={{ fontSize: 13, color: C.inkSoft, cursor: "pointer" }}>
                  <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} style={{ accentColor: C.brand }} />
                  Internal note
                </label>
              ) : <span />}
              <button onClick={submitComment} disabled={sending || !draft.trim()}
                      className="flex items-center gap-2 press"
                      style={{ padding: "9px 16px", borderRadius: 9, border: "none",
                               background: !draft.trim() ? C.line : C.brand, color: !draft.trim() ? C.inkFaint : "#fff",
                               fontSize: 14, fontWeight: 600, cursor: !draft.trim() ? "default" : "pointer", ...body }}>
                <Send size={15} /> {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: details sidebar */}
        <div>
          <div style={{ position: "sticky", top: 0, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
            <h2 style={{ ...display, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Details</h2>

            <SideLabel>Status</SideLabel>
            <div className="flex flex-col gap-2" style={{ marginBottom: 18 }}>
              {STATUSES.map((st) => {
                const active = st.toLowerCase() === (ticket.status || "").toLowerCase();
                return (
                  <button key={st} onClick={() => changeStatus(st)} className="press"
                          style={{ textAlign: "left", padding: "8px 12px", borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                                   border: `1.5px solid ${active ? C.brand : C.line}`,
                                   background: active ? C.brandSoft : C.surface,
                                   color: active ? C.brandDark : C.inkSoft, ...body }}>
                    {st}
                  </button>
                );
              })}
            </div>

            {canAssign && (
              <div style={{ marginBottom: 18 }}>
                <SideLabel>Assignee</SideLabel>
                <select value={ticket.assigneeId || ""} onChange={(e) => changeAssignee(e.target.value)}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 9, fontSize: 13.5, fontWeight: 500,
                                 border: `1.5px solid ${C.line}`, background: C.surface, color: C.ink, cursor: "pointer", ...body }}>
                  <option value="" disabled>Select an agent…</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>)}
                </select>
              </div>
            )}

            <div style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              <Meta label="Requester" value={ticket.requester} />
              {!canAssign && <Meta label="Assignee" value={ticket.assignee || "Unassigned"} />}
              <Meta label="SLA" value={sla.label} icon={Clock} danger={sla.breaching} />
              <Meta label="Opened" value={timeAgo(ticket.createdAt)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ c }) {
  return (
    <div className="flex gap-3" style={{ position: "relative" }}>
      <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "50%", background: C.panel, color: "#fff", fontSize: 12, fontWeight: 600, flexShrink: 0, zIndex: 1 }}>
        {initials(c.author)}
      </div>
      <div style={{ flex: 1, minWidth: 0, background: c.isInternal ? "#FBF6E9" : C.surface,
                    border: `1px solid ${c.isInternal ? "#EBDCB6" : C.line}`, borderRadius: 12, padding: "12px 15px" }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 5 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{c.author}</span>
          {c.isInternal && (
            <span className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: "#B45309", background: "#F6E9C8", padding: "1px 8px", borderRadius: 20 }}>
              <Lock size={11} /> Internal
            </span>
          )}
          <span style={{ fontSize: 12, color: C.inkFaint, marginLeft: "auto" }}>{timeAgo(c.createdAt)}</span>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: C.ink, whiteSpace: "pre-wrap" }}>{c.body}</div>
      </div>
    </div>
  );
}

function EventItem({ e }) {
  return (
    <div className="flex items-center gap-3" style={{ position: "relative" }}>
      <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "50%", background: C.bg, border: `1px solid ${C.line}`, color: C.inkFaint, flexShrink: 0, zIndex: 1 }}>
        <GitCommitHorizontal size={14} />
      </div>
      <div className="flex items-center" style={{ flex: 1, minWidth: 0, fontSize: 13, color: C.inkSoft, gap: 8 }}>
        <span><strong style={{ color: C.ink, fontWeight: 600 }}>{e.actor}</strong> {e.detail || e.eventType}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.inkFaint, flexShrink: 0 }}>{timeAgo(e.createdAt)}</span>
      </div>
    </div>
  );
}

function SideLabel({ children }) {
  return <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: C.inkFaint, fontWeight: 600, marginBottom: 8 }}>{children}</div>;
}

function Meta({ label, value, icon: Icon, danger }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: C.inkFaint, marginBottom: 3 }}>{label}</div>
      <div className="flex items-center gap-1.5" style={{ fontSize: 13.5, fontWeight: 500, color: danger ? C.danger : C.ink }}>
        {Icon && <Icon size={13} />} {value}
      </div>
    </div>
  );
}

function Centered({ children, danger }) {
  return (
    <div style={{ ...body, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", color: danger ? C.danger : C.inkSoft, fontSize: 15 }}>
      {children}
    </div>
  );
}