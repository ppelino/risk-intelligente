import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabase";

type CompanyRow = {
  id: string;
  user_id: string;
  name: string;
  cnpj: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
};

export default function Companies() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // edição
  const [editingId, setEditingId] = useState<string | null>(null);

  // form
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [city, setCity] = useState("");
  const [stateUF, setStateUF] = useState("");

  const canSave = useMemo(() => name.trim().length >= 2 && !saving, [name, saving]);

  async function loadCompanies() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("companies")
      .select("id, user_id, name, cnpj, city, state, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setCompanies([]);
    } else {
      setCompanies((data ?? []) as CompanyRow[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  function resetForm() {
    setEditingId(null);
    setName("");
    setCnpj("");
    setCity("");
    setStateUF("");
  }

  function startEdit(c: CompanyRow) {
    setError(null);
    setEditingId(c.id);
    setName(c.name ?? "");
    setCnpj(c.cnpj ?? "");
    setCity(c.city ?? "");
    setStateUF(c.state ?? "");
  }

  async function handleCreateOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError(null);

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      setSaving(false);
      setError("Você não está logado. Faça login novamente.");
      return;
    }

    const payload = {
      name: name.trim(),
      cnpj: cnpj.trim() || null,
      city: city.trim() || null,
      state: stateUF.trim().toUpperCase() || null,
    };

    // UPDATE
    if (editingId) {
      const { error: updErr } = await supabase.from("companies").update(payload).eq("id", editingId);
      if (updErr) {
        setError(updErr.message);
        setSaving(false);
        return;
      }
      resetForm();
      await loadCompanies();
      setSaving(false);
      return;
    }

    // INSERT
    const insertPayload = { user_id: authData.user.id, ...payload };
    const { error: insErr } = await supabase.from("companies").insert(insertPayload);

    if (insErr) {
      setError(insErr.message);
      setSaving(false);
      return;
    }

    resetForm();
    await loadCompanies();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const ok = confirm("Excluir esta empresa? Essa ação não pode ser desfeita.");
    if (!ok) return;

    setSaving(true);
    setError(null);

    const { error: delErr } = await supabase.from("companies").delete().eq("id", id);
    if (delErr) {
      setError(delErr.message);
      setSaving(false);
      return;
    }

    if (editingId === id) resetForm();

    await loadCompanies();
    setSaving(false);
  }

  const actionBtn: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#111827", // ✅ força texto aparecer
    cursor: "pointer",
    fontWeight: 800,
    minWidth: 90,
  };

  return (
    <div className="di-layout">
      <Sidebar />

      <main className="di-main">
        <div className="container">
          <div className="card" style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h1 style={{ margin: 0 }}>Empresas</h1>
                <div style={{ opacity: 0.7 }}>CRUD do Supabase ✅</div>
              </div>

              <button onClick={loadCompanies} style={actionBtn} disabled={saving}>
                Recarregar
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 16, alignItems: "start" }}>
              {/* FORM */}
              <form onSubmit={handleCreateOrUpdate} className="card" style={{ padding: 14, display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>
                  {editingId ? "Editar empresa" : "Adicionar empresa"}
                </div>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome * (ex: Metalúrgica Alfa)"
                  style={{ padding: 10 }}
                />

                <input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="CNPJ (opcional)"
                  style={{ padding: 10 }}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10 }}>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cidade (opcional)"
                    style={{ padding: 10 }}
                  />
                  <input
                    value={stateUF}
                    onChange={(e) => setStateUF(e.target.value)}
                    placeholder="UF"
                    maxLength={2}
                    style={{ padding: 10, textTransform: "uppercase" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" disabled={!canSave} style={{ ...actionBtn, flex: 1, background: "#111827", color: "#fff", border: "none" }}>
                    {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar empresa"}
                  </button>

                  {editingId && (
                    <button type="button" onClick={resetForm} disabled={saving} style={actionBtn}>
                      Cancelar
                    </button>
                  )}
                </div>

                {error && <div style={{ color: "#b91c1c", fontWeight: 800 }}>Erro: {error}</div>}
              </form>

              {/* LISTA */}
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>Lista</div>

                {loading ? (
                  <div>Carregando...</div>
                ) : companies.length === 0 ? (
                  <div>Nenhuma empresa cadastrada ainda.</div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {companies.map((c) => (
                      <div key={c.id} className="card" style={{ padding: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 900 }}>{c.name}</div>

                          <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" onClick={() => startEdit(c)} disabled={saving} style={actionBtn}>
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(c.id)}
                              disabled={saving}
                              style={{ ...actionBtn, borderColor: "#fecaca", color: "#b91c1c" }}
                            >
                              Excluir
                            </button>
                          </div>
                        </div>

                        <div style={{ opacity: 0.85, marginTop: 4 }}>
                          {c.city ?? "-"} / {c.state ?? "-"} • CNPJ: {c.cnpj ?? "-"}
                        </div>

                        <div style={{ opacity: 0.6, marginTop: 6, fontSize: 12 }}>id: {c.id}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ opacity: 0.7, fontSize: 12 }}>
              Se der erro no Editar/Excluir: falta policy de UPDATE/DELETE no RLS.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
