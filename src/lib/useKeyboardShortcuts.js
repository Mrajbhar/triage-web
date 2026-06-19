import { useEffect } from "react";
import { useNavigate } from "react-router-dom";


export function useKeyboardShortcuts({ onNewTicket }) {
  const navigate = useNavigate();

  useEffect(() => {
    let lastG = 0;

    const isTyping = (el) =>
      el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const typing = isTyping(document.activeElement);

      // "/" focuses search (only when not already typing somewhere)
      if (e.key === "/" && !typing) {
        e.preventDefault();
        window.dispatchEvent(new Event("triage:focus-search"));
        return;
      }

      if (typing) return; // don't hijack normal typing

      if (e.key === "n") {
        e.preventDefault();
        onNewTicket?.();
        return;
      }

      // "g" then a destination key, within 700ms
      if (e.key === "g") { lastG = Date.now(); return; }
      if (Date.now() - lastG < 700) {
        const dest = { d: "/", t: "/tickets", p: "/people", s: "/settings" }[e.key];
        if (dest) { e.preventDefault(); navigate(dest); }
        lastG = 0;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, onNewTicket]);
}