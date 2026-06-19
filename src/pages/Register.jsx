import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Ticket, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { register as registerRequest } from "../api";
import { C, display, body } from "../theme";
import { Field, inputStyle } from "../components/Primitives";

export default function Register() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [form, setForm] = useState({
    companyName: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleRegister = async () => {
    if (loading) return;
    setError(null);

    if (!form.companyName || !form.fullName || !form.email || form.password.length < 6) {
      setError("Fill every field; password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { token } = await registerRequest(form);
      signIn(token);         
      navigate("/");
    } catch (err) {
      setError(
        err.response?.status === 409
          ? "An account with this email already exists."
          : "Couldn't create the account. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => { if (e.key === "Enter") handleRegister(); };

  const focusBrand = (e) => (e.target.style.borderColor = C.brand);
  const blurLine = (e) => (e.target.style.borderColor = C.line);

  return (
    <div className="flex" style={{ minHeight: "100vh", background: C.bg, ...body, color: C.ink }}>
    
      <div
        className="hidden md:flex flex-col justify-between"
        style={{ width: "44%", background: C.panel, padding: "48px 44px", color: "#fff" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center"
               style={{ width: 34, height: 34, borderRadius: 9, background: C.brand }}>
            <Ticket size={18} color="#fff" />
          </div>
          <span style={{ ...display, fontSize: 20, fontWeight: 600, letterSpacing: -0.3 }}>Triage</span>
        </div>

        <div>
          <div style={{ ...display, fontSize: 40, fontWeight: 600, lineHeight: 1.1, letterSpacing: -1 }}>
            Set up your<br />support desk.
          </div>
          <p style={{ marginTop: 18, fontSize: 15, lineHeight: 1.6, color: "#9AA0B0", maxWidth: 360 }}>
            Creating an account spins up a fresh workspace for your company.
            You'll be the admin and can invite your agents next.
          </p>
        </div>

        <div className="flex items-center gap-2" style={{ fontSize: 13, color: "#7E869B" }}>
          <ShieldCheck size={15} />
          <span>Your data is isolated to your workspace</span>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center" style={{ padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div className="md:hidden flex items-center gap-2" style={{ marginBottom: 28 }}>
            <div className="flex items-center justify-center"
                 style={{ width: 32, height: 32, borderRadius: 9, background: C.brand }}>
              <Ticket size={17} color="#fff" />
            </div>
            <span style={{ ...display, fontSize: 19, fontWeight: 600 }}>Triage</span>
          </div>

          <h1 style={{ ...display, fontSize: 27, fontWeight: 600, letterSpacing: -0.5 }}>Create your workspace</h1>
          <p style={{ color: C.inkSoft, marginTop: 6, fontSize: 14.5 }}>
            A couple of details and you're in.
          </p>

          <div style={{ marginTop: 28 }}>
            <Field label="Company name">
              <input value={form.companyName} onChange={set("companyName")} onKeyDown={onKeyDown}
                     placeholder="Acme Co" style={inputStyle} onFocus={focusBrand} onBlur={blurLine} />
            </Field>

            <Field label="Your name">
              <input value={form.fullName} onChange={set("fullName")} onKeyDown={onKeyDown}
                     placeholder="Asha Kapoor" style={inputStyle} onFocus={focusBrand} onBlur={blurLine} />
            </Field>

            <Field label="Work email">
              <input value={form.email} onChange={set("email")} onKeyDown={onKeyDown}
                     placeholder="you@company.com" style={inputStyle} onFocus={focusBrand} onBlur={blurLine} />
            </Field>

            <Field label="Password">
              <input type="password" value={form.password} onChange={set("password")} onKeyDown={onKeyDown}
                     placeholder="At least 6 characters" style={inputStyle} onFocus={focusBrand} onBlur={blurLine} />
            </Field>

            {error && (
              <div style={{ fontSize: 13.5, color: C.danger, background: C.dangerSoft, padding: "9px 12px", borderRadius: 9, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={loading}
              className="flex items-center justify-center gap-2"
              style={{
                width: "100%", padding: "13px", border: "none", borderRadius: 11,
                background: loading ? C.brandDark : C.brand, color: "#fff",
                fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer",
                marginTop: 6, ...body, transition: "background .15s",
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.background = C.brandDark)}
              onMouseOut={(e) => !loading && (e.currentTarget.style.background = C.brand)}
            >
              {loading ? "Creating workspace…" : <>Create workspace <ArrowRight size={17} /></>}
            </button>

            <p style={{ textAlign: "center", marginTop: 22, fontSize: 13.5, color: C.inkSoft }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: C.brand, fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
