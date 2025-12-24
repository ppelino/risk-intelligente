import Sidebar from "../components/Sidebar";

export default function Ergonomics() {
  return (
    <div className="di-layout">
      <Sidebar />
      <main className="di-main">
        <div className="container">
          <div className="card" style={{ display: "grid", gap: 10 }}>
            <h1>Ergonomia (NR-17)</h1>
            <p>Página base OK ✅</p>
          </div>
        </div>
      </main>
    </div>
  );
}
