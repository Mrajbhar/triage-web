import { C } from "../theme";

// Primitive shimmer block. Width/height/radius are overridable.
export function Skeleton({ w = "100%", h = 14, r = 8, style }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

// A row that mirrors the ticket list layout, so loading -> loaded doesn't jump.
export function TicketRowSkeleton({ last }) {
  return (
    <div className="flex items-center" style={{ gap: 12, padding: "14px 20px", borderBottom: last ? "none" : `1px solid ${C.lineSoft}` }}>
      <div style={{ flex: 1 }}>
        <Skeleton w="58%" h={14} />
        <Skeleton w="34%" h={11} style={{ marginTop: 8 }} />
      </div>
      <Skeleton w={70} h={22} r={20} />
      <Skeleton w={60} h={22} r={20} />
      <Skeleton w={90} h={14} />
    </div>
  );
}

// Stat card skeleton matching the dashboard grid.
export function StatCardSkeleton() {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
      <Skeleton w={34} h={34} r={9} />
      <Skeleton w="50%" h={24} style={{ marginTop: 14 }} />
      <Skeleton w="38%" h={12} style={{ marginTop: 8 }} />
    </div>
  );
}