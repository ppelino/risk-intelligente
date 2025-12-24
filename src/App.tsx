import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import AppShell from "./components/AppShell";

export default function App() {
  return (
    <Routes>
      {/* login */}
      <Route path="/login" element={<Login />} />

      {/* tudo que tem menu lateral */}
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/companies" element={<Companies />} />
        {/* depois a gente liga esses */}
        {/* <Route path="/sectors" element={<Sectors />} /> */}
        {/* <Route path="/risks" element={<Risks />} /> */}
        {/* <Route path="/ergonomics" element={<Ergonomics />} /> */}
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
