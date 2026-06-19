import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RealtimeProvider } from "./context/RealtimeContext";
import { ThemeProvider } from "./context/ThemeContext";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/tickets";
import TicketDetail from "./pages/Ticketdetail";
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
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/people" element={<People />} />
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