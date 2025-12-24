import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabase";

type Company = { id: string; name: string };

type Sector = {
  id: string;
  company_id: string;
  sector_name: string;
  role_name: string | null;
  notes?: string | null;
};

export default function Sectors() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);

  const [companyId, setCompanyId] = useState("");
  const [sectorName, setSectorName] = useState("");
  const [roleName, setRoleName] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ modo edição
  const [editingId, setEditingId] = useState<string | null>(null);

  const companiesMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of companies) m.set(c.id, c.name);
    return m;
  }, [companies]);

  const canSave = useMemo(() => {
    return companyId && sectorName.trim().length >= 2 && !busy;
  }, [companyId, sectorName, busy]);

  async function loadAll() {
    setError(null);

    const c = await supabase.from("companies").select("id,name").order("name");
    if (c.error) return setError(c.error.message);
    setCompanies(c.data ?? []);

    const s = await supabase
      .from("sectors")
      .select("id,company_id,sector_name,role_name,notes")
      .order("sector_name");

    if (s.error) return setError(s.error.message);
    setSectors((s.data ?? []) as Sector[]);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setEditingId(null);
    setSectorName("");
    setRoleName("");
    // mantém companyId selecionado (mais prático)
  }

  function startEdit(s: Sector) {
    setError(null);
    setEditingId(s.id);

    setCompanyId(s.company_id);
    setSectorName(s.sector_name ?? "");
    setRoleName(s.role_name ?? "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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

    const payload = {
      company_id: companyId,
      sector_name: sectorName.trim(),
      role_name: roleName.trim() ? roleName.trim() : null,
    };

    // ✅ UPDATE
    if (editingId) {
      const upd = await supabase.from("sectors").update(payload).eq("id", editingId);

      if (upd.error) {
        setError(upd.error.message);
        setBusy(false);
        return;
      }

      setBusy(false);
      resetForm();
      loadAll();
      return;
    }

    // ✅ INSERT
    const ins = await supabase.from("sectors").insert({
      user_id: userId,
      ...payload,
    });

    if (ins.error) {
      setError(ins.error.message);
      setBusy(false);
      return;
    }

    setBusy(false);
    resetForm();
    loadAll();
  }

  async function handleDelete(id: string) {
    const ok = confirm("Excluir este setor/função? Essa ação não pode ser desfeita.");
    if (!ok) return;

    setBusy(true);
    setError(null);

    const del = await supabase.from("sectors").delete().eq("id", id);

    if (del.error) {
      setError(del.error.message);
      setBusy(false);
      return;
    }

    if (editingId === id) resetForm();

    setBusy(false);
    loadAll();
  }

  const filteredSectors = useMemo(() => {
    if (!companyId) return sectors;
    return sectors.filter((s) => s.company_id === companyId);
  }, [sectors, companyId]);

  return (
    <div className="di-layout">
      <Sidebar />

      <main className="di-main">
        <div className="container">
          <div className="card" style={{ display: "grid", gap: 12 }}>
            <h1>Setores / Funções</h1>

            {editingId && (
              <div className="card" style={{ padding: 12 }}>
                <strong>Modo edição ativo ✅</strong>
                <div style={{ fontSize: 12, opacity: 0.75 }}>ID: {editingId}</div>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={{ padding: 10 }}>
                <option value="">Selecione a empresa...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                value={sectorName}
                onChange={(e) => setSectorName(e.target.value)}
                placeholder="Nome do setor (ex: Produção)"
                style={{ padding: 10 }}
              />

              <input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Função/Cargo (ex: Operador de prensa)"
                style={{ padding: 10 }}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" disabled={!canSave} style={{ padding: 10, flex: 1 }}>
                  {busy ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar"}
                </button>

                {editingId && (
                  <button type="button" onClick={resetForm} disabled={busy} style={{ padding: 10, width: 160 }}>
                    Cancelar
                  </button>
                )}
              </div>

              {error && <div style={{ color: "#b91c1c", fontWeight: 700 }}>Erro: {error}</div>}
            </form>

            <div style={{ marginTop: 10 }}>
              <h3>Lista</h3>

              <div style={{ display: "grid", gap: 10 }}>
                {filteredSectors.map((s) => (
                  <div key={s.id} className="card" style={{ padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{s.sector_name}</div>
                        {s.role_name && <div style={{ opacity: 0.8 }}>{s.role_name}</div>}
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          Empresa: {companiesMap.get(s.company_id) ?? s.company_id}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
                        <button type="button" onClick={() => startEdit(s)} disabled={busy} style={{ padding: "6px 10px" }}>
                          Editar
                        </button>
                        <button type="button" onClick={() => handleDelete(s.id)} disabled={busy} style={{ padding: "6px 10px" }}>
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {!filteredSectors.length && (
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    Nenhum setor cadastrado para esta empresa ainda.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
