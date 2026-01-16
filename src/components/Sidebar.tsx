import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    // fecha drawer ao navegar
    setOpen(false);
  }, [loc.pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `di-link ${isActive ? "active" : ""}`;

  return (
    <>
      {/* Topbar mobile */}
      <header className="di-topbar">
        <button className="di-menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Abrir menu">
          ☰
        </button>
        <div className="di-brand">Risk-Intelligence</div>
        <div style={{ width: 42 }} />
      </header>

      {/* Overlay mobile */}
      <div className={`di-overlay ${open ? "show" : ""}`} onClick={() => setOpen(false)} />

      {/* Sidebar (desktop) + Drawer (mobile) */}
      <aside className={`di-sidebar ${open ? "drawer open" : "drawer"}`}>
        <div className="di-sidebar-title">Risk-Intelligence</div>

        <nav className="di-nav">
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/companies" className={linkClass}>Empresas</NavLink>
          <NavLink to="/sectors" className={linkClass}>Setores / Funções</NavLink>
          <NavLink to="/risks" className={linkClass}>Riscos (PGR/NR-01)</NavLink>
          <NavLink to="/ergonomics" className={linkClass}>Ergonomia (NR-17)</NavLink>
          <NavLink to="/login" className={linkClass}>Voltar (Login)</NavLink>
        </nav>

        <div className="di-sidebar-hint">No celular, use o menu ☰.</div>
      </aside>
    </>
  );
}
