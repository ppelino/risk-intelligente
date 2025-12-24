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

type CompanyForm = {
  name: string;
  cnpj: string;
  city: string;
  state: string;
};

const emptyForm: CompanyForm = { name: "", cnpj: "", city: "", state: "" };

export default function Companies() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState<CompanyRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  useEffect(() => {
    let active = true;

    async function init() {
      setLoading(true);
      setError(null);

      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;

      if (!active) return;

      setSessionUserId(uid);

      // Se não tem login ainda, NÃO quebra: só para aqui.
      if (!uid) {
        setItems([]);
        setLoading(false);
        return;
      }

      await fetchCompanies(uid);
      setLoading(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const uid = newSession?.user?.id ?? null;
      if (!active) return;

      setSessionUserId(uid);
      setEditingId(null);
      setForm(emptyForm);

      if (!uid) {
        setItems([]);
        return;
      }

      setLoading(true);
      await fetchCompanies(uid);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCompanies(uid: string) {
    setError(null);

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setItems([]);
      return;
    }

    setItems((data ?? []) as CompanyRow[]);
  }

  function onChange<K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function startEdit(row: CompanyRow) {
    setEditingId(row.id);
    setForm({
      name: row.name ?? "",
      cnpj: row.cnpj ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
    });
    setError(null);
  }

  async function save() {
    if (!sessionUserId) {
      setError("Você precisa estar logado para salvar empresas.");
      return;
    }

    if (!form.name.trim()) {
      setError("Nome da empresa é obrigatório.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (!isEditing) {
        const payload = {
          user_id: sessionUserId,
          name: form.name.trim(),
          cnpj: form.cnpj.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
        };

        const { error } = await supabase.from("companies").insert(payload);
        if (error) throw error;

        await fetchCompanies(sessionUserId);
        setForm(emptyForm);
      } else {
        const payload = {
          name: form.name.trim(),
          cnpj: form.cnpj.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
        };

        const { error } = await supabase
          .from("companies")
          .update(payload)
          .eq("id", editingId)
          .eq("user_id", sessionUserId);

        if (error) throw error;

        await fetchCompanies(sessionUserId);
        setEditingId(null);
        setForm(emptyForm);
      }
    } catch (e: any) {
      setError(e?.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: CompanyRow) {
    if (!sessionUserId) {
      setError("Você precisa estar logado para excluir empresas.");
      return;
    }

    const ok = confirm(`Excluir a empresa "${row.name}"?`);
    if (!ok) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", row.id)
        .eq("user_id", sessionUserId);

      if (error) throw error;

      await fetchCompanies(sessionUserId);
      if (editingId === row.id) {
        setEditingId(null);
        setForm(emptyForm);
      }
    } catch (e: any) {
      setError(e?.message ?? "Erro ao excluir.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Empresas</h1>

      {!sessionUserId && (
        <div style={{ padding: 12, borderRadius: 10, background: "#fff3cd", marginBottom: 12 }}>
          Você ainda não está logado no Supabase.  
          **O CRUD vai funcionar assim que a autenticação estiver ativa.**
        </div>
      )}

      {error && (
        <div style={{ padding: 12, borderRadius: 10, background: "#ffe3e3", marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 18, alignItems: "start" }}>
        {/* Form */}
        <div style={{ background: "white", borderRadius: 14, padding: 16, boxShadow: "0 1px 10px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{isEditing ? "Editar empresa" : "Nova empresa"}</h2>
            <button onClick={startNew} disabled={saving} style={btnLight}>
              Limpar
            </button>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <label style={label}>
              Nome *
              <input
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="Ex: Metalúrgica Alfa"
                style={input}
              />
            </label>

            <label style={label}>
              CNPJ
              <input
                value={form.cnpj}
                onChange={(e) => onChange("cnpj", e.target.value)}
                placeholder="Somente números ou com máscara"
                style={input}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10 }}>
              <label style={label}>
                Cidade
                <input value={form.city} onChange={(e) => onChange("city", e.target.value)} placeholder="Ex: Poá" style={input} />
              </label>

              <label style={label}>
                UF
                <input value={form.state} onChange={(e) => onChange("state", e.target.value)} placeholder="SP" style={input} />
              </label>
            </div>

            <button onClick={save} disabled={saving || loading} style={btnPrimary}>
              {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar empresa"}
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ background: "white", borderRadius: 14, padding: 16, boxShadow: "0 1px 10px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Lista</h2>
            <button
              onClick={() => sessionUserId && fetchCompanies(sessionUserId)}
              disabled={loading || saving || !sessionUserId}
              style={btnLight}
              title={!sessionUserId ? "Faça login para carregar do Supabase" : "Atualizar"}
            >
              Atualizar
            </button>
          </div>

          {loading ? (
            <div>Carregando…</div>
          ) : items.length === 0 ? (
            <div style={{ color: "#666" }}>Nenhuma empresa ainda.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {items.map((row) => (
                <div key={row.id} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{row.name}</div>
                      <div style={{ color: "#555", fontSize: 13 }}>
                        {row.city ?? "-"} / {row.state ?? "-"} • CNPJ: {row.cnpj ?? "-"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => startEdit(row)} disabled={saving} style={btnLight}>
                        Editar
                      </button>
                      <button onClick={() => remove(row)} disabled={saving} style={btnDanger}>
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p style={{ marginTop: 14, color: "#666", fontSize: 12 }}>
        Próximo passo: ao clicar em uma empresa, vamos abrir Setores/Funções filtrando por company_id.
      </p>
    </div>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  outline: "none",
};

const label: React.CSSProperties = {
  fontSize: 13,
  color: "#222",
  display: "grid",
  gap: 6,
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  background: "#0f172a",
  color: "white",
  fontWeight: 700,
};

const btnLight: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  cursor: "pointer",
  background: "white",
  fontWeight: 600,
};

const btnDanger: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #fecaca",
  cursor: "pointer",
  background: "#fff1f2",
  color: "#991b1b",
  fontWeight: 700,
};

const card: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
};

