import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Sectors from "./pages/Sectors";
import AppShell from "./components/AppShell";
import RequireAuth from "./components/RequireAuth";

export default function App() {
  return (
    <Routes>
      {/* login */}
      <Route path="/login" element={<Login />} />

      {/* tudo protegido (só entra logado) */}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/sectors" element={<Sectors />} />

          {/* Se ainda não tem essas páginas, melhor NÃO ter link no menu
              ou crie páginas placeholder pra não quebrar navegação */}
          {/* <Route path="/risks" element={<Risks />} /> */}
          {/* <Route path="/ergonomics" element={<Ergonomics />} /> */}
        </Route>
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
