import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, AlertTriangle, Clock, CheckCircle2, ArrowUpRight, UserX } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";
import { getTickets, getTicketStats } from "../api";
import { C, display, body, PRIORITY } from "../theme";
import { TicketRow } from "../components/Primitives";
import { StatCardSkeleton, TicketRowSkeleton } from "../components/Skeleton";
import { normalise } from "../lib/tickets";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [raw, setRaw] = useState([]);
  const [stats, setStats] = useState({ open: 0, pending: 0, resolved: 0, breaching: 0 });
  const [state, setState] = useState("loading");

  const load = useCallback(() => {
    Promise.all([getTickets(), getTicketStats()])
      .then(([tickets, s]) => { setRaw(tickets); setStats(s); setState("ready"); })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => { load(); }, [load]);
  useRealtime(() => load());

  const tickets = useMemo(() => raw.map(normalise), [raw]);
  const recent = tickets.slice(0, 5);

  const dist = useMemo(() => {
    const by = { urgent: 0, high: 0, medium: 0, low: 0 };
    tickets.forEach((t) => { if (by[t.priorityKey] != null) by[t.priorityKey] += 1; });
    return by;
  }, [tickets]);

  const unassigned = useMemo(() => tickets.filter((t) => t.assignee === "Unassigned").length, [tickets]);

  const firstName = (user?.name || "there").split(" ")[0];
  const hour = new Date().getHours();
  const partOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const metrics = [
    { key: "open",      label: "Open",      value: stats.open,      icon: Inbox,         tint: "#0F766E", bg: "#E2F1EE" },
    { key: "breaching", label: "Breaching", value: stats.breaching, icon: AlertTriangle, tint: "#DC2626", bg: "#FCEBEB", alert: stats.breaching > 0 },
    { key: "pending",   label: "Pending",   value: stats.pending,   icon: Clock,         tint: "#B45309", bg: "#FBF0DD" },
    { key: "resolved",  label: "Resolved",  value: stats.resolved,  icon: CheckCircle2,  tint: "#4B5563", bg: "#EEEDEA" },
  ];

  return (
    <>
      {/* Hero */}
      <div className="flex items-end justify-between" style={{ flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.6 }}>{today}</div>
          <h1 style={{ ...display, fontSize: 28, fontWeight: 600, letterSpacing: -0.6, marginTop: 4 }}>
            Good {partOfDay}, {firstName}
          </h1>
        </div>
        {state === "ready" && stats.breaching > 0 && (
          <button onClick={() => navigate("/tickets")} className="flex items-center gap-2 press"
                  style={{ fontSize: 13, fontWeight: 600, color: C.danger, background: C.dangerSoft, border: "none", borderRadius: 20, padding: "8px 14px", cursor: "pointer", ...body }}>
            <AlertTriangle size={14} /> {stats.breaching} at risk of breaching SLA
          </button>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ margin: "20px 0" }}>
        {state === "loading"
          ? <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
          : metrics.map((m) => <MetricCard key={m.key} {...m} onClick={() => navigate("/tickets")} />)}
      </div>

      {/* Two-column: recent tickets + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent tickets (spans 2) */}
        <div className="lg:col-span-2" style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden" }}>
          <div className="flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: `1px solid ${C.lineSoft}` }}>
            <h2 style={{ ...display, fontSize: 17, fontWeight: 600 }}>Recent tickets</h2>
            <button onClick={() => navigate("/tickets")} className="flex items-center gap-1 press"
                    style={{ fontSize: 13.5, color: C.brand, fontWeight: 600, cursor: "pointer", border: "none", background: "transparent", ...body }}>
              View all <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="hidden lg:grid"
               style={{ gridTemplateColumns: "1fr 130px 110px 130px 120px 24px", gap: 12, padding: "10px 20px", fontSize: 12, fontWeight: 600, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.4 }}>
            <div>Ticket</div><div>Status</div><div>Priority</div><div>Assignee</div><div>SLA</div><div></div>
          </div>

          {state === "loading" && (<><TicketRowSkeleton /><TicketRowSkeleton /><TicketRowSkeleton last /></>)}
          {state === "error" && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: C.danger, fontSize: 14 }}>
              Couldn't load tickets. Check that the API is running.
            </div>
          )}
          {state === "ready" && recent.length === 0 && (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <div className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 13, background: C.brandSoft, margin: "0 auto 12px" }}>
                <Inbox size={22} color={C.brand} />
              </div>
              <div style={{ ...display, fontSize: 16, fontWeight: 600, color: C.ink }}>Your queue is clear</div>
              <p style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 5 }}>New tickets will show up here as they come in.</p>
            </div>
          )}
          {state === "ready" && recent.length > 0 && (
            <div className="list-enter">
              {recent.map((t, i) => (
                <TicketRow key={t.id} t={t} last={i === recent.length - 1} onClick={() => navigate(`/tickets/${t.id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* Side panel: priority breakdown */}
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
          <h2 style={{ ...display, fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Priority breakdown</h2>
          <p style={{ fontSize: 12.5, color: C.inkFaint, marginBottom: 16 }}>Across {tickets.length} ticket{tickets.length === 1 ? "" : "s"}</p>

          {state === "loading" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 12, borderRadius: 6 }} />)}
            </div>
          ) : (
            <>
              {["urgent", "high", "medium", "low"].map((k) => {
                const count = dist[k];
                const max = Math.max(1, ...Object.values(dist));
                const pct = Math.round((count / max) * 100);
                const p = PRIORITY[k];
                return (
                  <div key={k} style={{ marginBottom: 14 }}>
                    <div className="flex items-center justify-between" style={{ fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: C.inkSoft, fontWeight: 500 }}>{p.label}</span>
                      <span style={{ color: C.ink, fontWeight: 600 }}>{count}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 6, background: C.lineSoft, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: p.color, transition: "width .5s cubic-bezier(.22,.61,.36,1)" }} />
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center gap-2" style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.lineSoft}`, fontSize: 13, color: unassigned > 0 ? C.ink : C.inkFaint }}>
                <UserX size={15} color={unassigned > 0 ? "#B45309" : C.inkFaint} />
                <span><strong style={{ fontWeight: 600 }}>{unassigned}</strong> unassigned</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}


function MetricCard({ icon: Icon, label, value, tint, bg, alert, onClick }) {
  return (
    <div onClick={onClick} className="lift"
         style={{ position: "relative", overflow: "hidden", cursor: "pointer",
                  background: C.surface, borderRadius: 16, padding: 18,
                  border: `1px solid ${alert ? "rgba(220,38,38,.35)" : C.line}` }}>
      <div aria-hidden style={{ position: "absolute", top: -26, right: -26, width: 92, height: 92, borderRadius: "50%", background: tint, opacity: 0.1 }} />
      <div className="flex items-center justify-center" style={{ position: "relative", width: 38, height: 38, borderRadius: 11, background: bg, marginBottom: 14 }}>
        <Icon size={19} color={tint} />
      </div>
      <div style={{ ...display, fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 6 }}>{label}</div>
    </div>
  );
}