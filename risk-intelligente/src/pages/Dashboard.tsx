import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  const nav = useNavigate();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

  async function sair() {
    await supabase.auth.signOut();
    nav("/login", { replace: true });
  }

  return (
    <div className="di-layout">
      <Sidebar />

      <main className="di-main">
        <div className="container">
          <div className="card" style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h1 style={{ marginBottom: 6 }}>DataInsight SST — Dashboard</h1>
                <div>
                  Logado como: <b>{email}</b>
                </div>
              </div>

              <button onClick={sair} style={{ whiteSpace: "nowrap" }}>
                Sair
              </button>
            </div>

            <hr style={{ margin: "6px 0", borderColor: "#e2e8f0" }} />

            <h2 style={{ marginTop: 0 }}>Módulos</h2>

            <div style={{ display: "grid", gap: 10 }}>
              <button onClick={() => nav("/companies")}>🏭 Empresas</button>
              <button onClick={() => nav("/sectors")}>🧑‍🏭 Setores / Funções</button>
              <button onClick={() => nav("/risks")}>⚠️ Riscos (PGR / NR-01)</button>
              <button onClick={() => nav("/ergonomics")}>🧍 Ergonomia (NR-17)</button>
            </div>

            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Dica: no celular, o menu fica no topo; no PC ele vira lateral automaticamente.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
