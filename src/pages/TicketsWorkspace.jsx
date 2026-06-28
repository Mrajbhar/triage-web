import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Inbox, Ticket } from "lucide-react";
import { getTicketsPaged, getTicketCounts } from "../api";
import { useRealtime } from "../context/RealtimeContext";
import { useAuth } from "../context/AuthContext";
import { C, display, body, STATUS, PRIORITY } from "../theme";
import { Badge } from "../components/Primitives";
import { normalise } from "../lib/tickets";
import TicketDetail from "./TicketDetail";

const PAGE_SIZE = 20;
const SORTS = [
  { key: "newest",   label: "Newest first" },
  { key: "oldest",   label: "Oldest first" },
  { key: "priority", label: "Priority" },
  { key: "sla",      label: "SLA (soonest)" },
];
const PRIORITIES = ["All", "Urgent", "High", "Medium", "Low"];

const selectStyle = {
  padding: "7px 10px", borderRadius: 8, fontSize: 12.5, fontWeight: 500,
  border: `1.5px solid ${C.line}`, background: C.surface, color: C.ink, cursor: "pointer", ...body,
};


function paramsForView(view, isAgent) {
  if (isAgent) {
    if (view === "mine")       return { assignee: "me", openOnly: true };
    if (view === "unassigned") return { assignee: "unassigned", openOnly: true };
    if (view === "open")       return { status: "Open" };
    if (view === "breach")     return { breaching: true };
    return { status: "Resolved" };
  }
  if (view === "mine") return { openOnly: true };
  if (view === "open") return { status: "Open" };
  return { status: "Resolved" };
}

export default function TicketsWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = (user?.role || "").toLowerCase();
  const isAgent = role === "admin" || role === "agent";

  const [view, setView] = useState("mine");
  const [priority, setPriority] = useState("All");
  const [sort, setSort] = useState("newest");

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [state, setState] = useState("loading");   
  const [loadingMore, setLoadingMore] = useState(false);
  const [counts, setCounts] = useState({ mine: 0, unassigned: 0, open: 0, breaching: 0, resolved: 0 });

  const views = useMemo(() => (
    isAgent
      ? [
          { key: "mine",       label: "My tickets", count: counts.mine },
          { key: "unassigned", label: "Unassigned", count: counts.unassigned },
          { key: "open",       label: "All open",   count: counts.open },
          { key: "breach",     label: "Breaching",  count: counts.breaching, danger: true },
          { key: "resolved",   label: "Resolved",   count: counts.resolved },
        ]
      : [
          { key: "mine",     label: "My tickets", count: counts.mine },
          { key: "open",     label: "Open",       count: counts.open },
          { key: "resolved", label: "Resolved",   count: counts.resolved },
        ]
  ), [isAgent, counts]);

  const loadCounts = useCallback(() => {
    getTicketCounts().then(setCounts).catch(() => {});
  }, []);

  const fetchPage = useCallback(async (pageNum, replace) => {
    const params = { ...paramsForView(view, isAgent), sort, page: pageNum, pageSize: PAGE_SIZE };
    if (priority !== "All") params.priority = priority;
    if (replace) setState("loading"); else setLoadingMore(true);
    try {
      const res = await getTicketsPaged(params);
      const norm = (res.items || []).map(normalise);
      setItems((prev) => (replace ? norm : [...prev, ...norm]));
      setTotal(res.total ?? norm.length);
      setPage(res.page ?? pageNum);
      setState("ready");
    } catch {
      if (replace) setState("error");
    } finally {
      setLoadingMore(false);
    }
  }, [view, isAgent, sort, priority]);

  // Reload page 1 whenever the view / filter / sort changes.
  useEffect(() => { fetchPage(1, true); }, [fetchPage]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  // Live updates: refresh the current view's first page and the chip counts.
  useRealtime(() => { fetchPage(1, true); loadCounts(); });

  const hasMore = items.length < total;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 items-start">
      {/* ---------------- LIST PANE ---------------- */}
      <div className={id ? "hidden lg:flex" : "flex"}
           style={{ flexDirection: "column", position: "sticky", top: 0, alignSelf: "start", maxHeight: "calc(100vh - 104px)" }}>
        <div style={{ marginBottom: 12 }}>
          <h1 style={{ ...display, fontSize: 24, fontWeight: 600, letterSpacing: -0.5 }}>Tickets</h1>
          <p style={{ color: C.inkSoft, marginTop: 3, fontSize: 13.5 }}>
            {state === "ready" ? `${total} ticket${total === 1 ? "" : "s"} in this view` : "Loading your queue…"}
          </p>
        </div>

        {/* Views rail */}
        <div className="flex gap-2" style={{ overflowX: "auto", paddingBottom: 10, marginBottom: 4 }}>
          {views.map((v) => {
            const active = v.key === view;
            const bg = active ? (v.danger ? C.danger : C.ink) : C.surface;
            const color = active ? "#fff" : C.inkSoft;
            return (
              <button key={v.key} onClick={() => setView(v.key)} className="press"
                style={{ whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
                         border: `1px solid ${active ? bg : C.line}`, background: bg, color,
                         padding: "6px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: "pointer", ...body }}>
                {v.label} <span style={{ fontSize: 11, opacity: 0.7 }}>{v.count}</span>
              </button>
            );
          })}
        </div>

        {/* Filter + sort */}
        <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} style={selectStyle}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p === "All" ? "All priorities" : p}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={selectStyle}>
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>

        {/* Cards (scroll within the sticky pane) */}
        <div style={{ overflowY: "auto", flex: 1, paddingRight: 2 }}>
          {state === "loading" && [0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}

          {state === "error" && (
            <div style={{ padding: "30px 4px", color: C.danger, fontSize: 13.5 }}>
              Couldn't load tickets. Check the API is running, then refresh.
            </div>
          )}

          {state === "ready" && items.length === 0 && (
            <div style={{ padding: "40px 16px", textAlign: "center" }}>
              <div className="flex items-center justify-center" style={{ width: 46, height: 46, borderRadius: 13, background: C.brandSoft, margin: "0 auto 12px" }}>
                <Inbox size={22} color={C.brand} />
              </div>
              <div style={{ ...display, fontSize: 15.5, fontWeight: 600 }}>Nothing here</div>
              <p style={{ fontSize: 13, color: C.inkSoft, marginTop: 5 }}>This view is empty right now.</p>
            </div>
          )}

          {state === "ready" && items.length > 0 && (
            <>
              <div className="list-enter">
                {items.map((t) => (
                  <TicketCard key={t.id} t={t} selected={String(t.id) === String(id)}
                              onClick={() => navigate(`/tickets/${t.id}`)} />
                ))}
              </div>
              {hasMore && (
                <button onClick={() => fetchPage(page + 1, false)} disabled={loadingMore} className="press"
                  style={{ width: "100%", marginTop: 4, padding: "10px", borderRadius: 10, cursor: "pointer",
                           border: `1px solid ${C.line}`, background: C.surface, color: C.inkSoft,
                           fontSize: 13.5, fontWeight: 600, ...body }}>
                  {loadingMore ? "Loading…" : `Load more (${total - items.length} more)`}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ---------------- DETAIL PANE ---------------- */}
      <div className={id ? "block" : "hidden lg:block"} style={{ minWidth: 0 }}>
        {id ? <TicketDetail key={id} id={id} embedded /> : <DetailPlaceholder />}
      </div>
    </div>
  );
}

function TicketCard({ t, selected, onClick }) {
  return (
    <button onClick={onClick} className="press"
      style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 8, cursor: "pointer",
               background: C.surface, borderRadius: 12, padding: "12px 13px", ...body,
               border: `1px solid ${selected ? C.brand : C.line}`,
               boxShadow: selected ? `0 0 0 1px ${C.brand}` : "none" }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 7 }}>
        <Badge {...(STATUS[t.statusKey] || STATUS.open)} />
        <Badge {...(PRIORITY[t.priorityKey] || PRIORITY.medium)} />
        <span style={{ marginLeft: "auto", fontSize: 11.5, color: C.inkFaint }}>{t.ref}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, lineHeight: 1.3, marginBottom: 6,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {t.subject}
      </div>
      <div className="flex items-center" style={{ fontSize: 12, color: C.inkFaint, gap: 8 }}>
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.requester}</span>
        <span style={{ marginLeft: "auto", fontWeight: 600, color: t.breaching ? C.danger : C.inkFaint, flexShrink: 0 }}>{t.sla}</span>
      </div>
    </button>
  );
}

function CardSkeleton() {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 13px", marginBottom: 8 }}>
      <div className="skeleton" style={{ width: "45%", height: 14, marginBottom: 9 }} />
      <div className="skeleton" style={{ width: "85%", height: 13, marginBottom: 9 }} />
      <div className="skeleton" style={{ width: "60%", height: 11 }} />
    </div>
  );
}

function DetailPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center"
         style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, minHeight: 420, textAlign: "center", padding: 40 }}>
      <div className="flex items-center justify-center" style={{ width: 54, height: 54, borderRadius: 15, background: C.brandSoft, marginBottom: 16 }}>
        <Ticket size={24} color={C.brand} />
      </div>
      <div style={{ ...display, fontSize: 18, fontWeight: 600 }}>Select a ticket</div>
      <p style={{ fontSize: 14, color: C.inkSoft, marginTop: 6, maxWidth: 280 }}>
        Choose a ticket from the list to see the conversation and take action.
      </p>
    </div>
  );
}