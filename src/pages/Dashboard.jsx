import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";
import { getTickets, getTicketStats } from "../api";
import { C, display } from "../theme";
import { StatCard, TicketRow } from "../components/Primitives";
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

  // Dashboard shows just the most recent few; the full list lives on /tickets.
  const recent = tickets.slice(0, 5);

  const firstName = (user?.name || "there").split(" ")[0];
  const hour = new Date().getHours();
  const partOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  return (
    <>
      <h1 style={{ ...display, fontSize: 26, fontWeight: 600, letterSpacing: -0.5 }}>
        Good {partOfDay}, {firstName}
      </h1>
      <p style={{ color: C.inkSoft, marginTop: 4, fontSize: 14.5 }}>
        {state === "ready"
          ? `${stats.breaching} ticket${stats.breaching === 1 ? "" : "s"} at risk of breaching SLA.`
          : "Loading your queue…"}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ margin: "22px 0" }}>
        {state === "loading" ? (
          <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
        ) : (
          <>
            <StatCard icon={Inbox}        label="Open"      value={stats.open}      tint="#0F766E" bg="#E2F1EE" />
            <StatCard icon={AlertCircle}  label="Breaching" value={stats.breaching} tint="#DC2626" bg="#FCEBEB" />
            <StatCard icon={Clock}        label="Pending"   value={stats.pending}   tint="#B45309" bg="#FBF0DD" />
            <StatCard icon={CheckCircle2} label="Resolved"  value={stats.resolved}  tint="#4B5563" bg="#EEEDEA" />
          </>
        )}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden" }}>
        <div className="flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: `1px solid ${C.lineSoft}` }}>
          <h2 style={{ ...display, fontSize: 17, fontWeight: 600 }}>Recent tickets</h2>
          <span onClick={() => navigate("/tickets")}
                style={{ fontSize: 13.5, color: C.brand, fontWeight: 600, cursor: "pointer" }}>
            View all tickets →
          </span>
        </div>

        <div className="hidden lg:grid"
             style={{ gridTemplateColumns: "1fr 130px 110px 130px 120px 24px", gap: 12, padding: "10px 20px", fontSize: 12, fontWeight: 600, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.4 }}>
          <div>Ticket</div><div>Status</div><div>Priority</div><div>Assignee</div><div>SLA</div><div></div>
        </div>

        {state === "loading" && (
          <>
            <TicketRowSkeleton />
            <TicketRowSkeleton />
            <TicketRowSkeleton last />
          </>
        )}
        {state === "error" && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: C.danger, fontSize: 14 }}>
            Couldn't load tickets. Check that the API is running.
          </div>
        )}
        {state === "ready" && recent.length === 0 && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div className="flex items-center justify-center"
                 style={{ width: 48, height: 48, borderRadius: 13, background: C.brandSoft, margin: "0 auto 12px" }}>
              <Inbox size={22} color={C.brand} />
            </div>
            <div style={{ ...display, fontSize: 16, fontWeight: 600, color: C.ink }}>Your queue is clear</div>
            <p style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 5 }}>New tickets will show up here as they come in.</p>
          </div>
        )}
        {state === "ready" && (
          <div className="list-enter">
            {recent.map((t, i) => (
              <TicketRow key={t.id} t={t} last={i === recent.length - 1}
                         onClick={() => navigate(`/tickets/${t.id}`)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}