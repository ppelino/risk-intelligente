import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Sectors from "./pages/Sectors";
import Risks from "./pages/Risks";
import Ergonomics from "./pages/Ergonomics";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/companies" element={<Companies />} />
      <Route path="/sectors" element={<Sectors />} />
      <Route path="/risks" element={<Risks />} />
      <Route path="/ergonomics" element={<Ergonomics />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}








