import Sidebar from "../components/Sidebar";

export default function Companies() {
  return (
    <div className="di-layout">
      <Sidebar />
      <main className="di-main">
        <div className="container">
          <div className="card" style={{ display: "grid", gap: 10 }}>
            <h1>Empresas</h1>
            <p>Página base OK ✅ (depois entra CRUD do Supabase)</p>
          </div>
        </div>
      </main>
    </div>
  );
}
