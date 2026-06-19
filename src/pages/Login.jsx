import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { login as loginRequest } from "../api";
import { C, body } from "../theme";
import { Field, inputStyle, PasswordInput } from "../components/Primitives";
import AuthShell from "../components/AuthShell";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e?.preventDefault();
    if (loading) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const { token } = await loginRequest(email, password);
      signIn(token, remember);
      navigate("/");
    } catch (err) {
      const code = err.response?.status;
      setError(
        code === 401 ? "Invalid email or password."
        : code === 429 ? "Too many attempts. Please wait a minute and try again."
        : "Couldn't reach the server. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your agent workspace."
      headline={"Every request,\nresolved on time."}
      switcher={<>New to your team's workspace? <Link to="/register" style={{ color: C.brand, fontWeight: 600 }}>Create one</Link></>}
    >
      <form onSubmit={handleSignIn}>
        <Field label="Work email">
          <input
            type="email" name="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = C.brand)}
            onBlur={(e) => (e.target.style.borderColor = C.line)}
          />
        </Field>

        <Field label="Password">
          <PasswordInput
            value={password} onChange={(e) => setPassword(e.target.value)}
            name="password" autoComplete="current-password" placeholder="••••••••"
          />
        </Field>

        {error && (
          <div style={{ fontSize: 13.5, color: C.danger, background: C.dangerSoft, padding: "9px 12px", borderRadius: 9, marginBottom: 14 }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ fontSize: 13.5, color: C.inkSoft, background: C.bg, padding: "9px 12px", borderRadius: 9, marginBottom: 14 }}>
            {info}
          </div>
        )}

        <div className="flex items-center justify-between" style={{ margin: "2px 0 20px" }}>
          <label className="flex items-center gap-2" style={{ fontSize: 13.5, color: C.inkSoft, cursor: "pointer" }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ accentColor: C.brand }} />
            Remember me
          </label>
          <button type="button"
                  onClick={() => setInfo("Password reset isn't enabled in this demo — ask your workspace admin to reset it.")}
                  style={{ fontSize: 13.5, color: C.brand, fontWeight: 500, cursor: "pointer", border: "none", background: "transparent", ...body }}>
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 btn-brand"
          style={{
            width: "100%", padding: "13px", border: "none", borderRadius: 11, color: "#fff",
            fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer", opacity: loading ? .85 : 1, ...body,
          }}>
          {loading ? "Signing in…" : <>Sign in <ArrowRight size={17} /></>}
        </button>
      </form>
    </AuthShell>
  );
}