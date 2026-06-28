import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { getTickets } from "../api";
import { useRealtime } from "../context/RealtimeContext";
import { C, display, body, STATUS, PRIORITY } from "../theme";
import { StatCardSkeleton } from "../components/Skeleton";
import { normalise } from "../lib/tickets";

export default function Reports() {
  const [raw, setRaw] = useState([]);
  const [state, setState] = useState("loading");

  const load = useCallback(() => {
    getTickets()
      .then((data) => { setRaw(data); setState("ready"); })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => { load(); }, [load]);
  useRealtime(() => load());

  const tickets = useMemo(() => raw.map(normalise), [raw]);

  const m = useMemo(() => {
    const total = tickets.length;
    const resolved = tickets.filter((t) => t.statusKey === "resolved").length;
    const breaching = tickets.filter((t) => t.breaching && t.statusKey !== "resolved").length;
    const rate = total ? Math.round((resolved / total) * 100) : 0;

    const byStatus = { open: 0, pending: 0, resolved: 0 };
    const byPriority = { urgent: 0, high: 0, medium: 0, low: 0 };
    tickets.forEach((t) => {
      if (byStatus[t.statusKey] != null) byStatus[t.statusKey]++;
      if (byPriority[t.priorityKey] != null) byPriority[t.priorityKey]++;
    });

    // ticket volume for the last 7 calendar days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      days.push({ t: d.getTime(), label: d.toLocaleDateString(undefined, { weekday: "short" }), count: 0 });
    }
    tickets.forEach((t) => {
      if (!t.createdAt) return;
      const c = new Date(t.createdAt); c.setHours(0, 0, 0, 0);
      const day = days.find((x) => x.t === c.getTime());
      if (day) day.count++;
    });

    return { total, resolved, breaching, rate, byStatus, byPriority, days };
  }, [tickets]);

  const cards = [
    { label: "Total tickets",   value: m.total,        icon: Inbox,        tint: "#0F766E", bg: "#E2F1EE" },
    { label: "Resolved",        value: m.resolved,     icon: CheckCircle2, tint: "#4B5563", bg: "#EEEDEA" },
    { label: "Resolution rate", value: `${m.rate}%`,   icon: TrendingUp,   tint: "#2563EB", bg: "#E6EEFB" },
    { label: "Breaching",       value: m.breaching,    icon: AlertTriangle,tint: "#DC2626", bg: "#FCEBEB", alert: m.breaching > 0 },
  ];

  const maxDay = Math.max(1, ...m.days.map((d) => d.count));

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ ...display, fontSize: 28, fontWeight: 600, letterSpacing: -0.6 }}>Reports</h1>
        <p style={{ color: C.inkSoft, marginTop: 5, fontSize: 14.5 }}>How your workspace is performing.</p>
      </div>

      {state === "error" && (
        <div style={{ color: C.danger, fontSize: 14, padding: "40px 0", textAlign: "center" }}>
          Couldn't load report data. Check that the API is running.
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 20 }}>
        {state === "loading"
          ? <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
          : cards.map((c) => (
            <div key={c.label} className="lift" style={{ position: "relative", overflow: "hidden", background: C.surface, borderRadius: 16, padding: 18, border: `1px solid ${c.alert ? "rgba(220,38,38,.35)" : C.line}` }}>
              <div aria-hidden style={{ position: "absolute", top: -26, right: -26, width: 92, height: 92, borderRadius: "50%", background: c.tint, opacity: 0.1 }} />
              <div className="flex items-center justify-center" style={{ position: "relative", width: 38, height: 38, borderRadius: 11, background: c.bg, marginBottom: 14 }}>
                <c.icon size={19} color={c.tint} />
              </div>
              <div style={{ ...display, fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 6 }}>{c.label}</div>
            </div>
          ))}
      </div>

      {state === "ready" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 7-day volume */}
          <div className="lg:col-span-2" style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
            <h2 style={{ ...display, fontSize: 17, fontWeight: 600 }}>Tickets created</h2>
            <p style={{ fontSize: 12.5, color: C.inkFaint, marginBottom: 20 }}>Last 7 days</p>
            <div className="flex items-end" style={{ gap: 10, height: 180 }}>
              {m.days.map((d) => (
                <div key={d.t} className="flex flex-col items-center" style={{ flex: 1, height: "100%", justifyContent: "flex-end", gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.inkSoft }}>{d.count}</div>
                  <div style={{ width: "100%", maxWidth: 42, borderRadius: "6px 6px 0 0",
                                height: `${(d.count / maxDay) * 100}%`, minHeight: d.count > 0 ? 6 : 2,
                                background: d.count > 0 ? C.brand : C.lineSoft,
                                transition: "height .5s cubic-bezier(.22,.61,.36,1)" }} />
                  <div style={{ fontSize: 12, color: C.inkFaint }}>{d.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdowns */}
          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
            <h2 style={{ ...display, fontSize: 17, fontWeight: 600, marginBottom: 16 }}>By status</h2>
            {["open", "pending", "resolved"].map((k) => (
              <BreakBar key={k} label={STATUS[k].label} count={m.byStatus[k]} max={Math.max(1, ...Object.values(m.byStatus))} color={STATUS[k].color} />
            ))}

            <h2 style={{ ...display, fontSize: 17, fontWeight: 600, margin: "22px 0 16px" }}>By priority</h2>
            {["urgent", "high", "medium", "low"].map((k) => (
              <BreakBar key={k} label={PRIORITY[k].label} count={m.byPriority[k]} max={Math.max(1, ...Object.values(m.byPriority))} color={PRIORITY[k].color} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function BreakBar({ label, count, max, color }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <div className="flex items-center justify-between" style={{ fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: C.inkSoft, fontWeight: 500 }}>{label}</span>
        <span style={{ color: C.ink, fontWeight: 600 }}>{count}</span>
      </div>
      <div style={{ height: 8, borderRadius: 6, background: C.lineSoft, overflow: "hidden" }}>
        <div style={{ width: `${(count / max) * 100}%`, height: "100%", borderRadius: 6, background: color, transition: "width .5s cubic-bezier(.22,.61,.36,1)" }} />
      </div>
    </div>
  );
}