import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, SlidersHorizontal, Plus } from "lucide-react";
import { getTickets } from "../api";
import { useRealtime } from "../context/RealtimeContext";
import { C, display, body } from "../theme";
import { TicketRow } from "../components/Primitives";
import { TicketRowSkeleton } from "../components/Skeleton";
import { normalise } from "../lib/tickets";

const FILTERS = ["All", "Open", "Pending", "Resolved"];
const PRIORITIES = ["All", "Urgent", "High", "Medium", "Low"];
const SORTS = [
  { key: "newest",   label: "Newest first" },
  { key: "oldest",   label: "Oldest first" },
  { key: "priority", label: "Priority" },
  { key: "sla",      label: "SLA (soonest)" },
];

const PRI_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };

const selectStyle = {
  padding: "8px 12px", borderRadius: 9, fontSize: 13.5, fontWeight: 500,
  border: `1.5px solid ${C.line}`, background: C.surface, color: C.ink, cursor: "pointer",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

export default function Tickets() {
  const navigate = useNavigate();
  const [raw, setRaw] = useState([]);
  const [state, setState] = useState("loading");
  const [filter, setFilter] = useState("All");
  const [priority, setPriority] = useState("All");
  const [sort, setSort] = useState("newest");

  const load = useCallback(() => {
    getTickets()
      .then((data) => { setRaw(data); setState("ready"); })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => { load(); }, [load]);
  useRealtime(() => load());

  const tickets = useMemo(() => raw.map(normalise), [raw]);

  const counts = useMemo(() => ({
    All: tickets.length,
    Open: tickets.filter((t) => t.statusKey === "open").length,
    Pending: tickets.filter((t) => t.statusKey === "pending").length,
    Resolved: tickets.filter((t) => t.statusKey === "resolved").length,
  }), [tickets]);

  const shown = useMemo(() => {
    let list = tickets;
    if (filter !== "All") list = list.filter((t) => t.statusKey === filter.toLowerCase());
    if (priority !== "All") list = list.filter((t) => t.priorityKey === priority.toLowerCase());

    const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
    const sorted = [...list];
    if (sort === "newest")   sorted.sort(byNewest);
    if (sort === "oldest")   sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sort === "priority") sorted.sort((a, b) => (PRI_RANK[a.priorityKey] ?? 9) - (PRI_RANK[b.priorityKey] ?? 9) || byNewest(a, b));
    if (sort === "sla")      sorted.sort((a, b) => {
      const ad = a.dueAt ? new Date(a.dueAt) : Infinity;
      const bd = b.dueAt ? new Date(b.dueAt) : Infinity;
      return ad - bd;
    });
    return sorted;
  }, [tickets, filter, priority, sort]);

  const filtersActive = filter !== "All" || priority !== "All";

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ ...display, fontSize: 28, fontWeight: 600, letterSpacing: -0.6 }}>Tickets</h1>
        <p style={{ color: C.inkSoft, marginTop: 5, fontSize: 14.5 }}>
          {state === "ready" ? `${tickets.length} ticket${tickets.length === 1 ? "" : "s"} in your workspace` : "Loading your queue…"}
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2" style={{ marginBottom: 14, flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <button key={f} onClick={() => setFilter(f)} className="press"
              style={{
                padding: "7px 14px", borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                border: `1.5px solid ${active ? C.brand : C.line}`,
                background: active ? C.brandSoft : C.surface,
                color: active ? C.brandDark : C.inkSoft, ...body,
              }}>
              {f} <span style={{ color: active ? C.brandDark : C.inkFaint }}>({counts[f]})</span>
            </button>
          );
        })}
      </div>

      {/* Priority + sort controls */}
      <div className="flex items-center gap-2" style={{ marginBottom: 18, flexWrap: "wrap" }}>
        <SlidersHorizontal size={15} color={C.inkFaint} />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={selectStyle}>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p === "All" ? "All priorities" : p}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={selectStyle}>
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        {filtersActive && (
          <button onClick={() => { setFilter("All"); setPriority("All"); }} className="press"
                  style={{ ...selectStyle, color: C.inkSoft, border: "none", background: "transparent" }}>
            Clear filters
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 13, color: C.inkFaint }}>
          {state === "ready" ? `${shown.length} shown` : ""}
        </span>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden" }}>
        <div className="hidden lg:grid"
             style={{ gridTemplateColumns: "1fr 130px 110px 130px 120px 24px", gap: 12, padding: "12px 20px", fontSize: 12, fontWeight: 600, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${C.lineSoft}` }}>
          <div>Ticket</div><div>Status</div><div>Priority</div><div>Assignee</div><div>SLA</div><div></div>
        </div>

        {state === "loading" && (
          <><TicketRowSkeleton /><TicketRowSkeleton /><TicketRowSkeleton /><TicketRowSkeleton last /></>
        )}

        {state === "error" && (
          <div style={{ padding: "44px 20px", textAlign: "center", color: C.danger, fontSize: 14 }}>
            Couldn't load tickets. Check that the API is running, then refresh.
          </div>
        )}

        {state === "ready" && shown.length === 0 && (
          <EmptyTickets filtered={filtersActive} onClear={() => { setFilter("All"); setPriority("All"); }} />
        )}

        {state === "ready" && shown.length > 0 && (
          <div className="list-enter">
            {shown.map((t, i) => (
              <TicketRow key={t.id} t={t} last={i === shown.length - 1}
                         onClick={() => navigate(`/tickets/${t.id}`)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// An empty screen is an invitation to act, not a dead end.
function EmptyTickets({ filtered, onClear }) {
  return (
    <div style={{ padding: "52px 20px", textAlign: "center" }}>
      <div className="flex items-center justify-center"
           style={{ width: 52, height: 52, borderRadius: 14, background: C.brandSoft, margin: "0 auto 14px" }}>
        <Inbox size={24} color={C.brand} />
      </div>
      {filtered ? (
        <>
          <div style={{ ...display, fontSize: 17, fontWeight: 600, color: C.ink }}>No tickets match these filters</div>
          <p style={{ fontSize: 14, color: C.inkSoft, marginTop: 6 }}>Try widening the status or priority.</p>
          <button onClick={onClear} className="press"
                  style={{ marginTop: 14, padding: "9px 16px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.surface, color: C.ink, fontSize: 14, fontWeight: 600, cursor: "pointer", ...body }}>
            Clear filters
          </button>
        </>
      ) : (
        <>
          <div style={{ ...display, fontSize: 17, fontWeight: 600, color: C.ink }}>No tickets yet</div>
          <p style={{ fontSize: 14, color: C.inkSoft, marginTop: 6 }}>
            Create the first one with the New ticket button — or press <kbd style={kbd}>n</kbd>.
          </p>
        </>
      )}
    </div>
  );
}

const kbd = {
  fontFamily: "ui-monospace, monospace", fontSize: 12, padding: "1px 6px",
  border: `1px solid ${C.line}`, borderRadius: 5, background: C.bg, color: C.inkSoft,
};