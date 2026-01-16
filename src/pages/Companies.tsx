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

type SortMode = "recent" | "name" | "city";

function norm(s: string) {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function Toast({
  msg,
  kind,
  onClose,
}: {
  msg: string;
  kind: "ok" | "err";
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      role="status"
      aria-live="polite"
      title="Clique para fechar"
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 9999,
        background: kind === "ok" ? "#0f172a" : "#7f1d1d",
        color: "#fff",
        padding: "10px 12px",
        borderRadius: 12,
        boxShadow: "0 10px 25px rgba(0,0,0,.18)",
        maxWidth: 380,
        cursor: "pointer",
        fontWeight: 700,
      }}
    >
      {msg}
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 9998,
        padding: 16,
      }}
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
    >
      <div
        style={{
          width: "min(560px, 100%)",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          padding: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: 8 }}>{title}</h2>
        <p style={{ marginBottom: 14, color: "#334155" }}>{message}</p>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "#fff",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              background: danger ? "#7f1d1d" : "#0f172a",
              border: "1px solid " + (danger ? "#7f1d1d" : "#0f172a"),
              color: "#fff",
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function onlyDigits(s: string) {
  return (s ?? "").replace(/\D/g, "");
}

export default function Companies() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CompanyRow | null>(null);

  // toast
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  function toastOk(msg: string) {
    setToast({ msg, kind: "ok" });
    window.setTimeout(() => setToast(null), 2600);
  }
  function toastErr(msg: string) {
    setToast({ msg, kind: "err" });
    window.setTimeout(() => setToast(null), 3600);
  }

  // filtros
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  // form
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [city, setCity] = useState("");
  const [stateUF, setStateUF] = useState("");

  async function loadCompanies() {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("companies")
        .select("id, user_id, name, cnpj, city, state, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCompanies((data ?? []) as CompanyRow[]);
    } catch (e: any) {
      const msg = e?.message ?? "Falha ao carregar empresas.";
      setError(msg);
      toastErr(msg);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
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
    window.scrollTo({ top: 0, behavior: "smooth" });
    toastOk("Modo edição ativado.");
  }

  function validate() {
    if (name.trim().length < 2) return "Nome precisa ter pelo menos 2 caracteres.";

    const uf = stateUF.trim();
    if (uf && uf.length !== 2) return "UF deve ter 2 letras (ex.: SP).";

    const cnpjDigits = onlyDigits(cnpj);
    if (cnpj.trim() && cnpjDigits.length !== 14) return "CNPJ inválido (precisa ter 14 dígitos).";

    // anti-duplicado por nome (simples)
    const key = norm(name);
    const dup = companies.find((c) => norm(c.name) === key && c.id !== editingId);
    if (dup) return "Já existe uma empresa com esse nome (duplicado).";

    return null;
  }

  const canSave = useMemo(() => name.trim().length >= 2 && !saving, [name, saving]);

  async function handleCreateOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    const v = validate();
    if (v) {
      setError(v);
      toastErr(v);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) throw new Error("Você não está logado. Faça login novamente.");

      const payload = {
        name: name.trim(),
        cnpj: cnpj.trim() ? onlyDigits(cnpj.trim()) : null,
        city: city.trim() || null,
        state: stateUF.trim() ? stateUF.trim().toUpperCase() : null,
      };

      if (editingId) {
        const { error: updErr } = await supabase.from("companies").update(payload).eq("id", editingId);
        if (updErr) throw updErr;

        toastOk("Empresa atualizada.");
        resetForm();
        await loadCompanies();
        return;
      }

      const insertPayload = { user_id: authData.user.id, ...payload };
      const { error: insErr } = await supabase.from("companies").insert(insertPayload);
      if (insErr) throw insErr;

      toastOk("Empresa cadastrada.");
      resetForm();
      await loadCompanies();
    } catch (e: any) {
      const msg = e?.message ?? "Falha ao salvar empresa.";
      setError(msg);
      toastErr(msg);
    } finally {
      setSaving(false);
    }
  }

  async function doDeleteNow(c: CompanyRow) {
    setSaving(true);
    setError(null);

    try {
      const { error: delErr } = await supabase.from("companies").delete().eq("id", c.id);
      if (delErr) throw delErr;

      if (editingId === c.id) resetForm();

      toastOk("Empresa excluída.");
      await loadCompanies();
    } catch (e: any) {
      const msg = e?.message ?? "Falha ao excluir.";
      setError(msg);
      toastErr(msg);
    } finally {
      setSaving(false);
    }
  }

  const filteredCompanies = useMemo(() => {
    const q = norm(query);
    let arr = companies;

    if (q) {
      arr = arr.filter((c) => {
        return (
          norm(c.name).includes(q) ||
          norm(c.city ?? "").includes(q) ||
          norm(c.state ?? "").includes(q) ||
          norm(c.cnpj ?? "").includes(q)
        );
      });
    }

    const copy = [...arr];
    copy.sort((a, b) => {
      if (sortMode === "name") return (a.name ?? "").localeCompare(b.name ?? "");
      if (sortMode === "city") return (a.city ?? "").localeCompare(b.city ?? "") || (a.name ?? "").localeCompare(b.name ?? "");
      // recent
      return Date.parse(b.created_at) - Date.parse(a.created_at);
    });

    return copy;
  }, [companies, query, sortMode]);

  const actionBtn: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 800,
    minWidth: 110,
  };

  return (
    <div className="di-layout">
      <Sidebar />

      <main className="di-main">
        <div className="container" style={{ maxWidth: 1400 }}>
          <div className="card" style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <h1 style={{ margin: 0 }}>Empresas</h1>
                <div style={{ opacity: 0.7 }}>CRUD Supabase ✅ (com filtros/validação/toast)</div>
              </div>

              <button onClick={loadCompanies} style={actionBtn} disabled={saving || loading}>
                {loading ? "Carregando..." : "Recarregar"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 16, alignItems: "start" }}>
              {/* FORM */}
              <form onSubmit={handleCreateOrUpdate} className="card" style={{ padding: 14, display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>
                  {editingId ? "Editar empresa" : "Adicionar empresa"}
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontWeight: 800 }}>Nome *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Metalúrgica Alfa"
                    style={{ padding: 10 }}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontWeight: 800 }}>CNPJ (opcional)</label>
                  <input
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="Somente números ou com máscara"
                    style={{ padding: 10 }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <label style={{ fontWeight: 800 }}>Cidade (opcional)</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" style={{ padding: 10 }} />
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <label style={{ fontWeight: 800 }}>UF</label>
                    <input
                      value={stateUF}
                      onChange={(e) => setStateUF(e.target.value)}
                      placeholder="SP"
                      maxLength={2}
                      style={{ padding: 10, textTransform: "uppercase" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="submit"
                    disabled={!canSave}
                    style={{
                      ...actionBtn,
                      flex: 1,
                      background: canSave ? "#111827" : "#94a3b8",
                      color: "#fff",
                      border: "none",
                    }}
                  >
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

              {/* LISTA + FILTROS */}
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>Lista</div>

                <div className="card" style={{ padding: 12, marginBottom: 12, display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 10 }}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <label style={{ fontWeight: 800 }}>Buscar</label>
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar por nome, cidade, UF, CNPJ..."
                        style={{ padding: 10 }}
                      />
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      <label style={{ fontWeight: 800 }}>Ordenar</label>
                      <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} style={{ padding: 10 }}>
                        <option value="recent">Mais recentes</option>
                        <option value="name">Nome</option>
                        <option value="city">Cidade</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    Total: <strong>{filteredCompanies.length}</strong>
                  </div>
                </div>

                {loading ? (
                  <div>Carregando...</div>
                ) : filteredCompanies.length === 0 ? (
                  <div>Nenhuma empresa encontrada.</div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {filteredCompanies.map((c) => (
                      <div key={c.id} className="card" style={{ padding: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 900 }}>{c.name}</div>

                          <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" onClick={() => startEdit(c)} disabled={saving} style={{ ...actionBtn, minWidth: 90 }}>
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmDelete(c)}
                              disabled={saving}
                              style={{ ...actionBtn, minWidth: 90, borderColor: "#fecaca", color: "#b91c1c" }}
                            >
                              Excluir
                            </button>
                          </div>
                        </div>

                        <div style={{ opacity: 0.85, marginTop: 6 }}>
                          {c.city ?? "-"} / {c.state ?? "-"} • CNPJ: {c.cnpj ?? "-"}
                        </div>

                        <div style={{ opacity: 0.6, marginTop: 6, fontSize: 12 }}>id: {c.id}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ opacity: 0.7, fontSize: 12, marginTop: 12 }}>
                  Se der erro no Editar/Excluir: falta policy de UPDATE/DELETE no RLS.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ConfirmModal
        open={!!confirmDelete}
        title="Excluir empresa"
        message={confirmDelete ? `Tem certeza que deseja excluir "${confirmDelete.name}"? Essa ação não pode ser desfeita.` : ""}
        confirmText={saving ? "Excluindo..." : "Excluir"}
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete || saving) return;
          const c = confirmDelete;
          setConfirmDelete(null);
          doDeleteNow(c);
        }}
      />

      {toast && <Toast msg={toast.msg} kind={toast.kind} onClose={() => setToast(null)} />}
    </div>
  );
}
