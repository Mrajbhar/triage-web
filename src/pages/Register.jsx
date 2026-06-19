import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { register as registerRequest } from "../api";
import { C, body } from "../theme";
import { Field, inputStyle, PasswordInput } from "../components/Primitives";
import AuthShell from "../components/AuthShell";

export default function Register() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [form, setForm] = useState({ companyName: "", fullName: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pw = form.password;
  const reqs = [
    { ok: pw.length >= 6, label: "At least 6 characters" },
    { ok: /[A-Za-z]/.test(pw) && /\d/.test(pw), label: "Letters and a number" },
  ];

  const handleRegister = async (e) => {
    e?.preventDefault();
    if (loading) return;
    setError(null);
    if (!form.companyName || !form.fullName || !form.email || form.password.length < 6) {
      setError("Fill every field; password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { token } = await registerRequest(form);
      signIn(token, true);
      navigate("/");
    } catch (err) {
      const code = err.response?.status;
      setError(
        code === 409 ? "An account with this email already exists."
        : code === 429 ? "Too many attempts. Please wait a minute and try again."
        : "Couldn't create the account. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const focusBrand = (e) => (e.target.style.borderColor = C.brand);
  const blurLine = (e) => (e.target.style.borderColor = C.line);

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="A couple of details and you're in — you'll be the admin."
      headline={"Set up your\nsupport desk."}
      switcher={<>Already have an account? <Link to="/login" style={{ color: C.brand, fontWeight: 600 }}>Sign in</Link></>}
    >
      <form onSubmit={handleRegister}>
        <Field label="Company name">
          <input name="organization" autoComplete="organization" value={form.companyName} onChange={set("companyName")}
                 placeholder="Acme Co" style={inputStyle} onFocus={focusBrand} onBlur={blurLine} />
        </Field>

        <Field label="Your name">
          <input name="name" autoComplete="name" value={form.fullName} onChange={set("fullName")}
                 placeholder="Asha Kapoor" style={inputStyle} onFocus={focusBrand} onBlur={blurLine} />
        </Field>

        <Field label="Work email">
          <input type="email" name="email" autoComplete="email" value={form.email} onChange={set("email")}
                 placeholder="you@company.com" style={inputStyle} onFocus={focusBrand} onBlur={blurLine} />
        </Field>

        <Field label="Password">
          <PasswordInput value={form.password} onChange={set("password")}
                         name="new-password" autoComplete="new-password" placeholder="At least 6 characters" />
        </Field>

        {pw.length > 0 && (
          <div style={{ margin: "-4px 0 14px", display: "flex", flexDirection: "column", gap: 5 }}>
            {reqs.map((r) => (
              <div key={r.label} className="flex items-center gap-2" style={{ fontSize: 12.5, color: r.ok ? "#16A34A" : C.inkFaint }}>
                <Check size={13} style={{ opacity: r.ok ? 1 : 0.4 }} /> {r.label}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ fontSize: 13.5, color: C.danger, background: C.dangerSoft, padding: "9px 12px", borderRadius: 9, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 btn-brand"
          style={{
            width: "100%", padding: "13px", border: "none", borderRadius: 11, color: "#fff",
            fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer", marginTop: 6, opacity: loading ? .85 : 1, ...body,
          }}>
          {loading ? "Creating workspace…" : <>Create workspace <ArrowRight size={17} /></>}
        </button>
      </form>
    </AuthShell>
  );
}