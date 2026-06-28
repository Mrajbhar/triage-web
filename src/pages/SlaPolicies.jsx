import { C, display } from "../theme";
import SlaPolicyManager from "../components/SlaPolicyManager";

export default function SlaPolicies() {
  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ ...display, fontSize: 28, fontWeight: 600, letterSpacing: -0.6 }}>SLA policies</h1>
      <p style={{ color: C.inkSoft, marginTop: 5, fontSize: 14.5, marginBottom: 22 }}>
        Define response and resolution targets. New tickets get a deadline based on your shortest policy's resolve time.
      </p>
      <SlaPolicyManager />
    </div>
  );
}