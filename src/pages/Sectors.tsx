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
  created_at?: string | null;
};

type SortMode = "recent" | "company" | "sector" | "role";

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

export default function Sectors() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);

  // form
  const [companyId, setCompanyId] = useState("");
  const [sectorName, setSectorName] = useState("");
  const [roleName, setRoleName] = useState("");

  // filtros/lista
  const [filterCompanyId, setFilterCompanyId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  // estados
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // edição / delete modal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Sector | null>(null);

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

  const companiesMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of companies) m.set(c.id, c.name);
    return m;
  }, [companies]);

  async function loadAll() {
    setError(null);
    setLoading(true);

    try {
      const c = await supabase.from("companies").select("id,name").order("name");
      if (c.error) throw c.error;
      setCompanies(c.data ?? []);

      // inclui created_at se existir (se não existir, não quebra)
      const s = await supabase
        .from("sectors")
        .select("id,company_id,sector_name,role_name,notes,created_at")
        .order("sector_name");

      if (s.error) throw s.error;
      setSectors((s.data ?? []) as Sector[]);
    } catch (e: any) {
      setError(e?.message ?? "Falha ao carregar.");
      toastErr(e?.message ?? "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm(keepCompany = true) {
    setEditingId(null);
    setSectorName("");
    setRoleName("");
    if (!keepCompany) setCompanyId("");
  }

  function startEdit(s: Sector) {
    setError(null);
    setEditingId(s.id);
    setCompanyId(s.company_id);
    setSectorName(s.sector_name ?? "");
    setRoleName(s.role_name ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toastOk("Modo edição ativado.");
  }

  function validate(payload: { company_id: string; sector_name: string; role_name: string | null }) {
    if (!payload.company_id) return "Selecione a empresa.";
    if (payload.sector_name.trim().length < 2) return "Setor precisa ter pelo menos 2 caracteres.";

    // anti-duplicado (empresa + setor + função)
    const key =
      payload.company_id +
      "::" +
      norm(payload.sector_name) +
      "::" +
      norm(payload.role_name ?? "");

    const dup = sectors.find((x) => {
      const k2 = x.company_id + "::" + norm(x.sector_name) + "::" + norm(x.role_name ?? "");
      if (editingId) return k2 === key && x.id !== editingId;
      return k2 === key;
    });

    if (dup) return "Duplicado: já existe esse Setor + Função para essa empresa.";
    return null;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    const payload = {
      company_id: companyId,
      sector_name: sectorName.trim(),
      role_name: roleName.trim() ? roleName.trim() : null,
    };

    const v = validate(payload);
    if (v) {
      setBusy(false);
      setError(v);
      toastErr(v);
      return;
    }

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Sessão expirada. Faça login novamente.");

      if (editingId) {
        const upd = await supabase.from("sectors").update(payload).eq("id", editingId);
        if (upd.error) throw upd.error;

        toastOk("Atualizado com sucesso.");
        resetForm(true);
        await loadAll();
        return;
      }

      const ins = await supabase.from("sectors").insert({
        user_id: userId,
        ...payload,
      });

      if (ins.error) throw ins.error;

      toastOk("Salvo com sucesso.");
      resetForm(true);
      await loadAll();
    } catch (e: any) {
      const msg = e?.message ?? "Falha ao salvar.";
      setError(msg);
      toastErr(msg);
    } finally {
      setBusy(false);
    }
  }

  async function doDeleteNow(s: Sector) {
    setBusy(true);
    setError(null);

    try {
      const del = await supabase.from("sectors").delete().eq("id", s.id);
      if (del.error) throw del.error;

      if (editingId === s.id) resetForm(true);

      toastOk("Excluído.");
      await loadAll();
    } catch (e: any) {
      const msg = e?.message ?? "Falha ao excluir.";
      setError(msg);
      toastErr(msg);
    } finally {
      setBusy(false);
    }
  }

  const filteredSectors = useMemo(() => {
    let arr = sectors;

    if (filterCompanyId) arr = arr.filter((s) => s.company_id === filterCompanyId);

    const q = norm(query);
    if (q) {
      arr = arr.filter((s) => {
        const companyName = companiesMap.get(s.company_id) ?? "";
        return (
          norm(s.sector_name).includes(q) ||
          norm(s.role_name ?? "").includes(q) ||
          norm(companyName).includes(q)
        );
      });
    }

    const copy = [...arr];
    copy.sort((a, b) => {
      const ca = companiesMap.get(a.company_id) ?? "";
      const cb = companiesMap.get(b.company_id) ?? "";

      if (sortMode === "company") return ca.localeCompare(cb) || a.sector_name.localeCompare(b.sector_name);
      if (sortMode === "sector") return a.sector_name.localeCompare(b.sector_name) || norm(a.role_name ?? "").localeCompare(norm(b.role_name ?? ""));
      if (sortMode === "role") return norm(a.role_name ?? "").localeCompare(norm(b.role_name ?? "")) || a.sector_name.localeCompare(b.sector_name);

      // recent
      const da = a.created_at ? Date.parse(a.created_at) : 0;
      const db = b.created_at ? Date.parse(b.created_at) : 0;
      return db - da;
    });

    return copy;
  }, [sectors, filterCompanyId, query, sortMode, companiesMap]);

  const canSave = useMemo(() => {
    return companyId && sectorName.trim().length >= 2 && !busy;
  }, [companyId, sectorName, busy]);

  return (
    <div className="di-layout">
      <Sidebar />

      <main className="di-main">
        <div
          className="container"
          style={{
            maxWidth: 1400, // ✅ mais largo no desktop
          }}
        >
          <div className="card" style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <h1>Setores / Funções</h1>

              <button
                type="button"
                onClick={loadAll}
                disabled={busy || loading}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  color: "#111827",
                  cursor: "pointer",
                  fontWeight: 800,
                  minWidth: 120,
                }}
              >
                {loading ? "Carregando..." : "Recarregar"}
              </button>
            </div>

            {/* FORM */}
            <div className="card" style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>
                  {editingId ? "Editar setor/função" : "Adicionar setor/função"}
                </div>

                {editingId && (
                  <button
                    type="button"
                    onClick={() => resetForm(true)}
                    disabled={busy}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      color: "#0f172a",
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    Cancelar edição
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} style={{ display: "grid", gap: 10, marginTop: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontWeight: 800 }}>Empresa</label>
                  <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={{ padding: 10 }}>
                    <option value="">Selecione a empresa...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontWeight: 800 }}>Setor</label>
                  <input
                    value={sectorName}
                    onChange={(e) => setSectorName(e.target.value)}
                    placeholder="Ex: Produção"
                    style={{ padding: 10 }}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontWeight: 800 }}>Função/Cargo (opcional)</label>
                  <input
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Ex: Operador de prensa"
                    style={{ padding: 10 }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canSave}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: "none",
                    background: canSave ? "#111827" : "#94a3b8",
                    color: "#fff",
                    fontWeight: 900,
                    cursor: canSave ? "pointer" : "not-allowed",
                  }}
                >
                  {busy ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar"}
                </button>

                {error && <div style={{ color: "#b91c1c", fontWeight: 800 }}>Erro: {error}</div>}
              </form>
            </div>

            {/* LISTA + FILTROS */}
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Lista</div>

              <div
                className="card"
                style={{
                  padding: 12,
                  marginBottom: 12,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontWeight: 800 }}>Filtrar por empresa</label>
                  <select value={filterCompanyId} onChange={(e) => setFilterCompanyId(e.target.value)} style={{ padding: 10 }}>
                    <option value="">(Todas)</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 10 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <label style={{ fontWeight: 800 }}>Buscar</label>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar por setor, função ou empresa..."
                      style={{ padding: 10 }}
                    />
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <label style={{ fontWeight: 800 }}>Ordenar</label>
                    <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} style={{ padding: 10 }}>
                      <option value="recent">Mais recentes</option>
                      <option value="company">Empresa</option>
                      <option value="sector">Setor</option>
                      <option value="role">Função</option>
                    </select>
                  </div>
                </div>

                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  Total: <strong>{filteredSectors.length}</strong>
                </div>
              </div>

              {loading ? (
                <div>Carregando...</div>
              ) : filteredSectors.length === 0 ? (
                <div style={{ fontSize: 13, opacity: 0.75 }}>Nenhum setor cadastrado com esse filtro.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {filteredSectors.map((s) => (
                    <div key={s.id} className="card" style={{ padding: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 900 }}>{s.sector_name}</div>
                          {s.role_name && <div style={{ opacity: 0.85 }}>{s.role_name}</div>}
                          <div style={{ fontSize: 12, opacity: 0.7 }}>
                            Empresa: {companiesMap.get(s.company_id) ?? s.company_id}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
                          <button
                            type="button"
                            onClick={() => startEdit(s)}
                            disabled={busy}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 10,
                              border: "1px solid #e5e7eb",
                              background: "#111827",
                              color: "#fff",
                              cursor: "pointer",
                              fontWeight: 900,
                            }}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDelete(s)}
                            disabled={busy}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 10,
                              border: "1px solid #fecaca",
                              background: "#fff",
                              color: "#b91c1c",
                              cursor: "pointer",
                              fontWeight: 900,
                            }}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
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
      </main>

      <ConfirmModal
        open={!!confirmDelete}
        title="Excluir setor/função"
        message={
          confirmDelete
            ? `Tem certeza que deseja excluir "${confirmDelete.sector_name}"${
                confirmDelete.role_name ? ` / "${confirmDelete.role_name}"` : ""
              }? Essa ação não pode ser desfeita.`
            : ""
        }
        confirmText={busy ? "Excluindo..." : "Excluir"}
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete || busy) return;
          const s = confirmDelete;
          setConfirmDelete(null);
          doDeleteNow(s);
        }}
      />

      {toast && <Toast msg={toast.msg} kind={toast.kind} onClose={() => setToast(null)} />}
    </div>
  );
}
