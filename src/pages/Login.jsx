import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Ticket, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { login as loginRequest } from "../api";
import { C, display, body } from "../theme";
import { Field, inputStyle } from "../components/Primitives";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const { token } = await loginRequest(email, password);
      signIn(token);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Invalid email or password."
          : "Couldn't reach the server. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => { if (e.key === "Enter") handleSignIn(); };

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
            Every request,<br />resolved on time.
          </div>
          <p style={{ marginTop: 18, fontSize: 15, lineHeight: 1.6, color: "#9AA0B0", maxWidth: 360 }}>
            A multi-tenant support desk with live ticket updates, SLA tracking,
            and role-based access — built for teams that can't drop the ball.
          </p>
        </div>

        <div className="flex items-center gap-2" style={{ fontSize: 13, color: "#7E869B" }}>
          <ShieldCheck size={15} />
          <span>Tenant-isolated · Full audit trail</span>
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

          <h1 style={{ ...display, fontSize: 27, fontWeight: 600, letterSpacing: -0.5 }}>Welcome back</h1>
          <p style={{ color: C.inkSoft, marginTop: 6, fontSize: 14.5 }}>
            Sign in to your agent workspace.
          </p>

          <div style={{ marginTop: 28 }}>
            <Field label="Work email">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="you@company.com"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = C.brand)}
                onBlur={(e) => (e.target.style.borderColor = C.line)}
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = C.brand)}
                onBlur={(e) => (e.target.style.borderColor = C.line)}
              />
            </Field>

            {error && (
              <div style={{ fontSize: 13.5, color: C.danger, background: C.dangerSoft, padding: "9px 12px", borderRadius: 9, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <div className="flex items-center justify-between" style={{ margin: "4px 0 22px" }}>
              <label className="flex items-center gap-2" style={{ fontSize: 13.5, color: C.inkSoft, cursor: "pointer" }}>
                <input type="checkbox" defaultChecked style={{ accentColor: C.brand }} />
                Remember me
              </label>
              <a style={{ fontSize: 13.5, color: C.brand, fontWeight: 500, cursor: "pointer" }}>Forgot password?</a>
            </div>

            <button
              onClick={handleSignIn}
              disabled={loading}
              className="flex items-center justify-center gap-2"
              style={{
                width: "100%", padding: "13px", border: "none", borderRadius: 11,
                background: loading ? C.brandDark : C.brand, color: "#fff",
                fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer",
                ...body, transition: "background .15s",
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.background = C.brandDark)}
              onMouseOut={(e) => !loading && (e.currentTarget.style.background = C.brand)}
            >
              {loading ? "Signing in…" : <>Sign in <ArrowRight size={17} /></>}
            </button>

            <p style={{ textAlign: "center", marginTop: 22, fontSize: 13.5, color: C.inkSoft }}>
              New to your team's workspace?{" "}
              <Link to="/register" style={{ color: C.brand, fontWeight: 600 }}>Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
