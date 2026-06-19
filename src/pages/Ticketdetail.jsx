import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Send, GitCommitHorizontal } from "lucide-react";
import { getTicket, updateTicket, getComments, addComment, getEvents, getUsers } from "../api";
import { C, display, body, STATUS, PRIORITY } from "../theme";
import { Badge } from "../components/Primitives";
import { initials } from "../lib/tickets";
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

export default function TicketDetail() {
  const { id } = useParams();
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

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <button
        onClick={() => navigate("/tickets")}
        className="flex items-center gap-2"
        style={{ border: "none", background: "transparent", color: C.inkSoft, fontSize: 14, cursor: "pointer", marginBottom: 18, ...body }}
      >
        <ArrowLeft size={16} /> Back to tickets
      </button>

      {/* Ticket header */}
      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 24, marginBottom: 22 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
          <Badge {...s} />
          <Badge {...p} />
        </div>
        <h1 style={{ ...display, fontSize: 24, fontWeight: 600, letterSpacing: -0.4, marginBottom: 14 }}>
          {ticket.subject}
        </h1>

        <div className="flex flex-wrap gap-x-8 gap-y-2" style={{ fontSize: 13.5, color: C.inkSoft }}>
          <Meta label="Requester" value={ticket.requester} />
          <Meta label="Assignee" value={ticket.assignee || "Unassigned"} />
          <Meta label="Opened" value={timeAgo(ticket.createdAt)} />
        </div>

        {/* Status changer (uses the PATCH endpoint) */}
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.lineSoft}` }}>
          <span style={{ fontSize: 13, fontWeight: 600, marginRight: 10 }}>Status</span>
          {STATUSES.map((st) => {
            const active = st.toLowerCase() === (ticket.status || "").toLowerCase();
            return (
              <button
                key={st}
                onClick={() => changeStatus(st)}
                style={{
                  marginRight: 8, padding: "6px 13px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${active ? C.brand : C.line}`,
                  background: active ? C.brandSoft : C.surface,
                  color: active ? C.brandDark : C.inkSoft, ...body,
                }}
              >
                {st}
              </button>
            );
          })}
        </div>

        {canAssign && (
          <div style={{ marginTop: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, marginRight: 10 }}>Assignee</span>
            <select
              value={ticket.assigneeId || ""}
              onChange={(e) => changeAssignee(e.target.value)}
              style={{
                padding: "7px 12px", borderRadius: 8, fontSize: 13.5, fontWeight: 500,
                border: `1.5px solid ${C.line}`, background: C.surface, color: C.ink, cursor: "pointer", ...body,
              }}
            >
              <option value="" disabled>Select an agent…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Activity feed (comments + audit events, interleaved) */}
      <h2 style={{ ...display, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Activity</h2>

      <div className="flex flex-col gap-3" style={{ marginBottom: 22 }}>
        {feed.length === 0 && (
          <div style={{ color: C.inkFaint, fontSize: 14 }}>No activity yet. Start the conversation below.</div>
        )}
        {feed.map((item) =>
          item.kind === "comment"
            ? <CommentCard key={`c-${item.data.id}`} c={item.data} />
            : <EventLine key={`e-${item.data.id}`} e={item.data} />
        )}
      </div>

      {/* New comment */}
      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
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
          <button
            onClick={submitComment}
            disabled={sending || !draft.trim()}
            className="flex items-center gap-2"
            style={{
              padding: "9px 16px", borderRadius: 9, border: "none",
              background: !draft.trim() ? C.line : C.brand,
              color: !draft.trim() ? C.inkFaint : "#fff",
              fontSize: 14, fontWeight: 600, cursor: !draft.trim() ? "default" : "pointer", ...body,
            }}
          >
            <Send size={15} /> {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentCard({ c }) {
  return (
    <div style={{
      background: c.isInternal ? "#FBF6E9" : C.surface,
      border: `1px solid ${c.isInternal ? "#EBDCB6" : C.line}`,
      borderRadius: 12, padding: "14px 16px",
    }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
        <div className="flex items-center justify-center"
             style={{ width: 26, height: 26, borderRadius: "50%", background: C.panel, color: "#fff", fontSize: 11, fontWeight: 600 }}>
          {initials(c.author)}
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{c.author}</span>
        {c.isInternal && (
          <span className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: "#B45309", background: "#F6E9C8", padding: "1px 8px", borderRadius: 20 }}>
            <Lock size={11} /> Internal
          </span>
        )}
        <span style={{ fontSize: 12, color: C.inkFaint, marginLeft: "auto" }}>{timeAgo(c.createdAt)}</span>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.5, color: C.ink, whiteSpace: "pre-wrap" }}>{c.body}</div>
    </div>
  );
}

function EventLine({ e }) {
  return (
    <div className="flex items-center gap-3" style={{ padding: "2px 6px", color: C.inkSoft, fontSize: 13 }}>
      <div className="flex items-center justify-center"
           style={{ width: 26, height: 26, borderRadius: "50%", background: C.lineSoft, color: C.inkFaint, flexShrink: 0 }}>
        <GitCommitHorizontal size={14} />
      </div>
      <span>
        <strong style={{ color: C.ink, fontWeight: 600 }}>{e.actor}</strong>
        {" — "}{e.detail || e.eventType}
      </span>
      <span style={{ marginLeft: "auto", fontSize: 12, color: C.inkFaint }}>{timeAgo(e.createdAt)}</span>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: C.inkFaint, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 500, color: C.ink }}>{value}</div>
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