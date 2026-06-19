
export function slaInfo(ticket) {
  if ((ticket.status || "").toLowerCase() === "resolved") return { label: "Met", breaching: false };
  if (!ticket.dueAt) return { label: "—", breaching: false };

  const diffMs = new Date(ticket.dueAt).getTime() - Date.now();
  const breaching = diffMs > 0 && diffMs <= 30 * 60 * 1000; // within 30 min
  if (diffMs <= 0) return { label: "Overdue", breaching: true };

  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return { label: `${mins}m left`, breaching };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { label: `${hrs}h ${mins % 60}m`, breaching };
  const days = Math.round(hrs / 24);
  return { label: days === 1 ? "Tomorrow" : `${days} days`, breaching };
}

// Map a raw API ticket into the flat shape TicketRow expects.
export function normalise(t) {
  const sla = slaInfo(t);
  return {
    id: t.id,
    ref: "TKT-" + String(t.id ?? "").slice(0, 4).toUpperCase(),
    subject: t.subject ?? "(no subject)",
    requester: t.requester ?? t.requesterName ?? "Unknown",
    assignee: t.assignee ?? t.assigneeName ?? "Unassigned",
    statusKey: (t.status ?? "open").toLowerCase(),
    priorityKey: (t.priority ?? "medium").toLowerCase(),
    sla: sla.label,
    breaching: sla.breaching,
    createdAt: t.createdAt ?? null,
    dueAt: t.dueAt ?? null,
  };
}

export function initials(name = "") {
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
}