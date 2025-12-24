import { Link, useLocation } from "react-router-dom";

type ItemProps = { to: string; label: string };

export default function Sidebar() {
  const { pathname } = useLocation();

  const Item = ({ to, label }: ItemProps) => {
    const active = pathname === to;

    return (
      <Link
        to={to}
        className={`di-link ${active ? "is-active" : ""}`}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </Link>
    );
  };

  return (
    <aside className="di-sidebar">
      <div className="di-brand">Risk-Intelligence</div>

      <nav className="di-nav">
        <Item to="/dashboard" label="Dashboard" />
        <Item to="/companies" label="Empresas" />
        <Item to="/sectors" label="Setores / Funções" />
        <Item to="/risks" label="Riscos (PGR/NR-01)" />
        <Item to="/ergonomics" label="Ergonomia (NR-17)" />
      </nav>
    </aside>
  );
}


