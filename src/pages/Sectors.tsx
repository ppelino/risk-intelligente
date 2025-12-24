import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabase";

type Company = { id: string; name: string };
type Sector = { id: string; company_id: string; name: string; role: string | null };

export default function Sectors() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);

  const [companyId, setCompanyId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => {
    return companyId && name.trim().length >= 2 && !busy;
  }, [companyId, name, busy]);

  async function loadAll() {
    setError(null);

    const c = await supabase.from("companies").select("id,name").order("name");
    if (c.error) return setError(c.error.message);
    setCompanies(c.data ?? []);

    const s = await supabase.from("sectors").select("id,company_id,name,role").order("name");
    if (s.error) return setError(s.error.message);
    setSectors(s.data ?? []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    setBusy(true);
    setError(null);

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (!userId) {
      setError("Sessão expirada. Faça login novamente.");
      setBusy(false);
      return;
    }

    const ins = await supabase.from("sectors").insert({
      user_id: userId,
      company_id: companyId,
      name: name.trim(),
      role: role.trim() ? role.trim() : null,
    });

    if (ins.error) {
      setError(ins.error.message);
      setBusy(false);
      return;
    }

    setName("");
    setRole("");
    setBusy(false);
    loadAll();
  }

  return (
    <div className="di-layout">
      <Sidebar />

      <main className="di-main">
        <div className="container">
          <div className="card" style={{ display: "grid", gap: 12 }}>
            <h1>Setores / Funções</h1>

            <form onSubmit={handleSave} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={{ padding: 10 }}>
                <option value="">Selecione a empresa...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do setor (ex: Produção)" style={{ padding: 10 }} />
              <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Função/Cargo (ex: Operador de prensa)" style={{ padding: 10 }} />

              <button type="submit" disabled={!canSave} style={{ padding: 10 }}>
                {busy ? "Salvando..." : "Salvar"}
              </button>

              {error && <div style={{ color: "#b91c1c", fontWeight: 700 }}>Erro: {error}</div>}
            </form>

            <div style={{ marginTop: 10 }}>
              <h3>Lista</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {sectors.map((s) => (
                  <div key={s.id} className="card" style={{ padding: 12 }}>
                    <div style={{ fontWeight: 800 }}>{s.name}</div>
                    {s.role && <div style={{ opacity: 0.8 }}>{s.role}</div>}
                    <div style={{ fontSize: 12, opacity: 0.65 }}>company_id: {s.company_id}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
