import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage.jsx";
import TicketPage from "./pages/TicketPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function App() {

  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={
          user
            ? <Navigate to="/tickets" replace />
            : <LoginPage />
        }
      />

      <Route
        path="/tickets"
        element={
          user
            ? <TicketPage />
            : <Navigate to="/login" replace />
        }
      />

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
    