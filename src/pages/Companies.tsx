import { useEffect, useMemo, useState } from "react";
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

  // Form
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

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError(null);

    // Quem está logado
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      setSaving(false);
      setError("Você não está logado. Faça login novamente.");
      return;
    }

    const payload = {
      user_id: authData.user.id, // importante p/ RLS
      name: name.trim(),
      cnpj: cnpj.trim() || null,
      city: city.trim() || null,
      state: stateUF.trim().toUpperCase() || null,
    };

    const { error: insertErr } = await supabase.from("companies").insert(payload);

    if (insertErr) {
      setError(insertErr.message);
      setSaving(false);
      return;
    }

    // limpa form + recarrega lista
    setName("");
    setCnpj("");
    setCity("");
    setStateUF("");

    await loadCompanies();
    setSaving(false);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Empresas</h1>
      <p>Página base OK ✅ (agora CRUD do Supabase)</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: 20,
          alignItems: "start",
          marginTop: 16,
        }}
      >
        {/* FORM CREATE */}
        <form
          onSubmit={handleCreateCompany}
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Adicionar empresa</h3>

          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Nome *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Metalúrgica Alfa"
            style={{ width: "100%", padding: 10, marginBottom: 12 }}
          />

          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            CNPJ
          </label>
          <input
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="Somente números ou com máscara"
            style={{ width: "100%", padding: 10, marginBottom: 12 }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Cidade
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Poá"
                style={{ width: "100%", padding: 10, marginBottom: 12 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                UF
              </label>
              <input
                value={stateUF}
                onChange={(e) => setStateUF(e.target.value)}
                placeholder="SP"
                maxLength={2}
                style={{ width: "100%", padding: 10, marginBottom: 12, textTransform: "uppercase" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSave}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "none",
              background: canSave ? "#111827" : "#9ca3af",
              color: "#fff",
              cursor: canSave ? "pointer" : "not-allowed",
              fontWeight: 700,
            }}
          >
            {saving ? "Salvando..." : "Salvar empresa"}
          </button>

          {error && (
            <div style={{ marginTop: 12, color: "#b91c1c", fontWeight: 600 }}>
              Erro: {error}
            </div>
          )}
        </form>

        {/* LISTAGEM */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ marginTop: 0 }}>Lista</h3>
            <button
              onClick={loadCompanies}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Recarregar
            </button>
          </div>

          {loading ? (
            <p>Carregando...</p>
          ) : companies.length === 0 ? (
            <p>Nenhuma empresa cadastrada ainda.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {companies.map((c) => (
                <div
                  key={c.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{c.name}</div>
                  <div style={{ opacity: 0.85, marginTop: 4 }}>
                    {c.city ?? "-"} / {c.state ?? "-"} • CNPJ: {c.cnpj ?? "-"}
                  </div>
                  <div style={{ opacity: 0.6, marginTop: 6, fontSize: 12 }}>
                    id: {c.id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12, opacity: 0.7, fontSize: 12 }}>
        Dica: se der erro de RLS no insert, falta policy de INSERT.
      </div>
    </div>
  );
}
