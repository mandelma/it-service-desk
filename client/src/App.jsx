import { Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import TicketPage from "./pages/TicketPage.jsx";
import TicketDetailPage from "./pages/TicketDetailPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Avalik sisselogimisleht */}
      <Route
        path="/login"
        element={
          user
            ? <Navigate to="/tickets" replace />
            : <LoginPage />
        }
      />

      {/* Kaitstud leheküljed ühise paigutusega */}
      <Route element={<AppLayout />}>
        <Route path="/tickets" element={<TicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
      </Route>

      {/* Tundmatud aadressid */}
      <Route
        path="*"
        element={
          <Navigate
            to={user ? "/tickets" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;         
    