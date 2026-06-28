import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RealtimeProvider } from "./context/RealtimeContext";
import { ThemeProvider } from "./context/ThemeContext";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TicketsWorkspace from "./pages/TicketsWorkspace";
import Reports from "./pages/Reports";
import SlaPolicies from "./pages/SlaPolicies";
import People from "./pages/People";
import Settings from "./pages/Settings";

function Protected({ children }) {
  const { isAuthed } = useAuth();
  return isAuthed ? children : <Navigate to="/login" replace />;
}

function PublicOnly({ children }) {
  const { isAuthed } = useAuth();
  return isAuthed ? <Navigate to="/" replace /> : children;
}


function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase();
  return roles.includes(role) ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RealtimeProvider>
        <BrowserRouter>
          <Routes>
          
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

          
          <Route element={<Protected><AppLayout /></Protected>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tickets" element={<TicketsWorkspace />} />
            <Route path="/tickets/:id" element={<TicketsWorkspace />} />
            <Route path="/reports" element={<RoleRoute roles={["admin", "agent"]}><Reports /></RoleRoute>} />
            <Route path="/sla" element={<RoleRoute roles={["admin"]}><SlaPolicies /></RoleRoute>} />
            <Route path="/people" element={<RoleRoute roles={["admin", "agent"]}><People /></RoleRoute>} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </RealtimeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}