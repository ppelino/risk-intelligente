import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./lib/RequireAuth";
import AppShell from "./components/AppShell";

import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Sectors from "./pages/Sectors";
import Risks from "./pages/Risks";
import Ergonomics from "./pages/Ergonomics";
import Login from "./pages/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="companies" element={<Companies />} />
        <Route path="sectors" element={<Sectors />} />
        <Route path="risks" element={<Risks />} />
        <Route path="ergonomics" element={<Ergonomics />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}


