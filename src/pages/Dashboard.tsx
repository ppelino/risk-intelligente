import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const nav = useNavigate();

  return (
    <div className="container">
      <div className="card" style={{ display: "grid", gap: 12 }}>
        <h1>Dashboard</h1>
        <p>Se você está vendo isso, a rota /dashboard está OK ✅</p>

        <div style={{ display: "grid", gap: 10 }}>
          <button onClick={() => nav("/companies")}>🏭 Empresas</button>
          <button onClick={() => nav("/sectors")}>🧑‍🏭 Setores / Funções</button>
          <button onClick={() => nav("/risks")}>⚠️ Riscos (PGR/NR-01)</button>
          <button onClick={() => nav("/ergonomics")}>🧍 Ergonomia (NR-17)</button>
        </div>
      </div>
    </div>
  );
}
