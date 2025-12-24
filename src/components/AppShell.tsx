import { NavLink, Outlet, useNavigate } from "react-router-dom";

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  display: "block",
  padding: "12px 14px",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: 600,
  background: isActive ? "#0f172a" : "#ffffff",
  color: isActive ? "#ffffff" : "#0f172a",
  border: "1px solid #e5e7eb",
});

export default function AppShell() {
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef2f7" }}>
      <aside
        style={{
          width: 260,
          padding: 16,
          background: "#f8fafc",
          borderRight: "1px solid #e5e7eb",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 12 }}>Risk-Intelligence</div>

        <nav style={{ display: "grid", gap: 10 }}>
          <NavLink to="/dashboard" style={linkStyle}>
            Dashboard
          </NavLink>

          <NavLink to="/companies" style={linkStyle}>
            Empresas
          </NavLink>

          <NavLink to="/login" style={linkStyle} onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
            Voltar (Login)
          </NavLink>
        </nav>

        <p style={{ marginTop: 14, fontSize: 12, color: "#64748b" }}>
          No celular, a gente transforma em menu no topo depois.
        </p>
      </aside>

      <main style={{ flex: 1, padding: 22 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

