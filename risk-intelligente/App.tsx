import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Sectors from "./pages/Sectors";
import Risks from "./pages/Risks";
import Ergonomics from "./pages/Ergonomics";
import RequireAuth from "./lib/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/companies"
        element={
          <RequireAuth>
            <Companies />
          </RequireAuth>
        }
      />

      <Route
        path="/sectors"
        element={
          <RequireAuth>
            <Sectors />
          </RequireAuth>
        }
      />

      <Route
        path="/risks"
        element={
          <RequireAuth>
            <Risks />
          </RequireAuth>
        }
      />

      <Route
        path="/ergonomics"
        element={
          <RequireAuth>
            <Ergonomics />
          </RequireAuth>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
