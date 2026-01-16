import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Fecha menu quando muda de rota
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function isActive(p: string) {
    return pathname === p;
  }

  return (
    <>
      {/* Topbar mobile */}
      <header className="di-topbar">
        <button
          className="di-menu-btn"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
          type="button"
        >
          ☰
        </button>

        <div className="di-brand">
          <strong>Risk-Intelligence</strong>
        </div>

        <div style={{ width: 40 }} />
      </header>

      {/* Overlay (só interage quando open=true) */}
      <div
        className={`di-overlay ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      {/* Sidebar */}
      <aside className={`di-sidebar ${open ? "open" : ""}`}>
        <div className="di-sidebar-title">Risk-Intelligence</div>

        <nav className="di-nav">
          <Link className={`di-link ${isActive("/dashboard") ? "active" : ""}`} to="/dashboard">
            Dashboard
          </Link>

          <Link className={`di-link ${isActive("/companies") ? "active" : ""}`} to="/companies">
            Empresas
          </Link>

          <Link className={`di-link ${isActive("/sectors") ? "active" : ""}`} to="/sectors">
            Setores / Funções
          </Link>

          <Link className={`di-link ${isActive("/risks") ? "active" : ""}`} to="/risks">
            Riscos (PGR/NR-01)
          </Link>

          <Link className={`di-link ${isActive("/ergonomics") ? "active" : ""}`} to="/ergonomics">
            Ergonomia (NR-17)
          </Link>

          <Link className="di-link" to="/login">
            Voltar (Login)
          </Link>
        </nav>

        <div className="di-sidebar-hint">No celular, use o menu ☰.</div>
      </aside>
    </>
  );
}
