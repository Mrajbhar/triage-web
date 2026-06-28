import { Ticket, ShieldCheck, Zap, Clock } from "lucide-react";
import { C, display, body } from "../theme";


export default function AuthShell({
  title, subtitle, children, switcher,
  headline = "Every request,\nresolved on time.",
  tagline = "A multi-tenant support desk with live updates, SLA tracking, and role-based access — built for teams that can't drop the ball.",
}) {
  return (
    <div className="flex" style={{ minHeight: "100vh", background: C.bg, color: C.ink, ...body }}>
     
      <aside className="hidden lg:flex flex-col justify-between"
        style={{
          position: "relative", width: "52%", overflow: "hidden", padding: "48px 52px", color: "#fff",
          background:
            "radial-gradient(at 18% 22%, rgba(20,184,166,.35), transparent 52%)," +
            "radial-gradient(at 84% 6%, rgba(13,148,136,.42), transparent 50%)," +
            "radial-gradient(at 60% 105%, rgba(30,58,138,.45), transparent 55%)," +
            "#0A0D12",
        }}>
        <div className="orb" style={{ width: 300, height: 300, top: -50, left: 130, background: "#14B8A6", animation: "floatA 15s ease-in-out infinite" }} />
        <div className="orb" style={{ width: 240, height: 240, bottom: 30, right: 50, background: "#1E3A8A", animation: "floatB 18s ease-in-out infinite" }} />

        {/* Wordmark */}
        <div className="flex items-center gap-2" style={{ position: "relative" }}>
          <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 9, background: C.brand }}>
            <Ticket size={18} color="#fff" />
          </div>
          <span style={{ ...display, fontSize: 20, fontWeight: 600, letterSpacing: -0.3 }}>Triage</span>
        </div>

        
        <div style={{ position: "relative" }}>
          <div style={{ ...display, fontSize: 42, fontWeight: 600, lineHeight: 1.08, letterSpacing: -1, whiteSpace: "pre-line" }}>
            {headline}
          </div>
          <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,.62)", maxWidth: 390 }}>
            {tagline}
          </p>

          {/* Frosted-glass live-queue preview */}
          <div className="glass" style={{ marginTop: 30, borderRadius: 16, padding: "14px 16px", maxWidth: 360 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,.72)" }}>Live queue</span>
              <span className="flex items-center gap-1" style={{ fontSize: 11.5, color: "#34D399" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", display: "inline-block" }} /> Live
              </span>
            </div>
            <PreviewRow subject="Checkout failing on Safari" meta="#4821 · Open" chip="18m left" chipColor="#FCA5A5" chipBg="rgba(248,113,113,.16)" />
            <PreviewRow subject="Can't reset my password"   meta="#4820 · Pending" chip="2h left" chipColor="#7DD3FC" chipBg="rgba(56,189,248,.16)" />
            <PreviewRow subject="Billing address won't save" meta="#4817 · Open" chip="On track" chipColor="#6EE7B7" chipBg="rgba(52,211,153,.14)" last />
          </div>
        </div>

        {/* Feature chips */}
        <div className="flex items-center gap-5" style={{ position: "relative", fontSize: 12.5, color: "rgba(255,255,255,.5)" }}>
          <span className="flex items-center gap-2"><Zap size={14} /> Real-time</span>
          <span className="flex items-center gap-2"><Clock size={14} /> SLA tracking</span>
          <span className="flex items-center gap-2"><ShieldCheck size={14} /> Tenant-isolated</span>
        </div>
      </aside>

      {/* Right — form */}
      <main className="flex flex-1 items-center justify-center" style={{ padding: 24 }}>
        <div className="scale-in" style={{ width: "100%", maxWidth: 392 }}>
          <div className="lg:hidden flex items-center gap-2" style={{ marginBottom: 26 }}>
            <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 9, background: C.brand }}>
              <Ticket size={17} color="#fff" />
            </div>
            <span style={{ ...display, fontSize: 19, fontWeight: 600 }}>Triage</span>
          </div>

          <h1 style={{ ...display, fontSize: 28, fontWeight: 600, letterSpacing: -0.6 }}>{title}</h1>
          <p style={{ color: C.inkSoft, marginTop: 7, fontSize: 14.5, lineHeight: 1.5 }}>{subtitle}</p>
          <div style={{ marginTop: 26 }}>{children}</div>
          {switcher && <p style={{ textAlign: "center", marginTop: 22, fontSize: 13.5, color: C.inkSoft }}>{switcher}</p>}
        </div>
      </main>
    </div>
  );
}

function PreviewRow({ subject, meta, chip, chipColor, chipBg, last }) {
  return (
    <div className="flex items-center gap-3"
         style={{ padding: "10px 0", borderTop: "1px solid rgba(255,255,255,.10)", borderBottom: last ? "none" : "" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subject}</div>
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.5)" }}>{meta}</div>
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: chipColor, background: chipBg, padding: "3px 9px", borderRadius: 20, flexShrink: 0 }}>{chip}</span>
    </div>
  );
}