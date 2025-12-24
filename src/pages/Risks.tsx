import Sidebar from "../components/Sidebar";

export default function Risks() {
  return (
    <div className="di-layout">
      <Sidebar />
      <main className="di-main">
        <div className="container">
          <div className="card" style={{ display: "grid", gap: 10 }}>
            <h1>Riscos (PGR / NR-01)</h1>
            <p>Página base OK ✅</p>
          </div>
        </div>
      </main>
    </div>
  );
}
