import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  // caminho atual sem hook do router (não quebra se router estiver fora)
  const path = typeof window !== "undefined" ? window.location.pathname : "";

  // fecha menu ao clicar em qualquer link
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  function isActive(p: string) {
    return path === p;
  }

  return (
    <>
      {/* Topbar mobile */}
      <header className="di-topbar" onClick={(e) => e.stopPropagation()}>
        <button
          className="di-menu-btn"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          aria-label="Abrir menu"
        >
          ☰
        </button>

        <div className="di-brand">
          <strong>Risk-Intelligence</strong>
        </div>

        <div style={{ width: 40 }} />
      </header>

      {/* Overlay */}
      <div
        className={`di-overlay ${open ? "show" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(false);
        }}
      />

      {/* Sidebar */}
      <aside
        className={`di-sidebar ${open ? "open" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
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
