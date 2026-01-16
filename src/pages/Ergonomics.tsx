import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabase";
import Toast from "../components/ui/Toast";
import ConfirmModal from "../components/ui/ConfirmModal";

type Company = { id: string; name: string };
type Sector = { id: string; sector_name: string; company_id: string };

type Erg = {
  id: string;
  company_id: string;
  sector_id: string | null;
  worker_name: string;
  role_name: string;
  workstation: string;
  posture: number;
  repetitive: number;
  force_effort: number;
  lifting_load: number;
  pace_pressure: number;
  breaks: number;
  environment: number;
  organization: number;
  notes: string | null;
  recommended_actions: string | null;
  created_at?: string;
};

function clamp15(v: unknown, fallback = 2) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(5, n));
}

export default function Ergonomics() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [items, setItems] = useState<Erg[]>([]);

  const [companyId, setCompanyId] = useState("");
  const [sectorId, setSectorId] = useState("");

  const [workerName, setWorkerName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [workstation, setWorkstation] = useState("");

  const [posture, setPosture] = useState<number>(2);
  const [repetitive, setRepetitive] = useState<number>(2);
  const [forceEffort, setForceEffort] = useState<number>(2);
  const [liftingLoad, setLiftingLoad] = useState<number>(2);
  const [pacePressure, setPacePressure] = useState<number>(2);
  const [breaks, setBreaks] = useState<number>(2);
  const [environment, setEnvironment] = useState<number>(2);
  const [organization, setOrganization] = useState<number>(2);

  const [notes, setNotes] = useState("");
  const [recommendedActions, setRecommendedActions] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Erg | null>(null);

  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const toastOk = (msg: string) => setToast({ msg, kind: "ok" });
  const toastErr = (msg: string) => setToast({ msg, kind: "err" });

  const canSave = useMemo(() => {
    return (
      companyId &&
      workerName.trim().length >= 2 &&
      roleName.trim().length >= 2 &&
      workstation.trim().length >= 2 &&
      !busy
    );
  }, [companyId, workerName, roleName, workstation, busy]);

  const score = useMemo(() => {
    const sum =
      posture + repetitive + forceEffort + liftingLoad + pacePressure + breaks + environment + organization;
    return Math.round((sum / 8) * 10) / 10;
  }, [posture, repetitive, forceEffort, liftingLoad, pacePressure, breaks, environment, organization]);

  async function loadBase() {
    setError(null);
    try {
      const c = await supabase.from("companies").select("id,name").order("name");
      if (c.error) throw c.error;
      setCompanies(c.data ?? []);

      const s = await supabase.from("sectors").select("id,sector_name,company_id").order("sector_name");
      if (s.error) throw s.error;
      setSectors(s.data ?? []);

      const r = await supabase
        .from("ergonomics")
        .select("id,company_id,sector_id,worker_name,role_name,workstation,posture,repetitive,force_effort,lifting_load,pace_pressure,breaks,environment,organization,notes,recommended_actions,created_at")
        .order("created_at", { ascending: false });

      if (r.error) throw r.error;
      setItems((r.data ?? []) as Erg[]);
    } catch (e: any) {
      const msg = e?.message ?? "Falha ao carregar Ergonomia.";
      setError(msg);
      toastErr(msg);
      console.error("loadBase ergonomics error:", e);
    }
  }

  useEffect(() => {
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSectorId("");
  }, [companyId]);

  function resetForm() {
    setEditingId(null);
    setWorkerName("");
    setRoleName("");
    setWorkstation("");
    setNotes("");
    setRecommendedActions("");
    setPosture(2);
    setRepetitive(2);
    setForceEffort(2);
    setLiftingLoad(2);
    setPacePressure(2);
    setBreaks(2);
    setEnvironment(2);
    setOrganization(2);
  }

  function startEdit(it: Erg) {
    setError(null);
    setEditingId(it.id);
    setCompanyId(it.company_id);
    setSectorId(it.sector_id ?? "");
    setWorkerName(it.worker_name ?? "");
    setRoleName(it.role_name ?? "");
    setWorkstation(it.workstation ?? "");

    setPosture(clamp15(it.posture, 2));
    setRepetitive(clamp15(it.repetitive, 2));
    setForceEffort(clamp15(it.force_effort, 2));
    setLiftingLoad(clamp15(it.lifting_load, 2));
    setPacePressure(clamp15(it.pace_pressure, 2));
    setBreaks(clamp15(it.breaks, 2));
    setEnvironment(clamp15(it.environment, 2));
    setOrganization(clamp15(it.organization, 2));

    setNotes(it.notes ?? "");
    setRecommendedActions(it.recommended_actions ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toastOk("Modo edição ativado.");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    setBusy(true);
    setError(null);

    try {
      const { data: authRes, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw new Error(authErr.message);
      if (!authRes.user) throw new Error("Sessão expirada. Faça login novamente.");

      const payload = {
        company_id: companyId,
        sector_id: sectorId || null,
        worker_name: workerName.trim(),
        role_name: roleName.trim(),
        workstation: workstation.trim(),
        posture: clamp15(posture),
        repetitive: clamp15(repetitive),
        force_effort: clamp15(forceEffort),
        lifting_load: clamp15(liftingLoad),
        pace_pressure: clamp15(pacePressure),
        breaks: clamp15(breaks),
        environment: clamp15(environment),
        organization: clamp15(organization),
        notes: notes.trim() ? notes.trim() : null,
        recommended_actions: recommendedActions.trim() ? recommendedActions.trim() : null,
      };

      if (editingId) {
        const upd = await supabase.from("ergonomics").update(payload).eq("id", editingId);
        if (upd.error) throw upd.error;

        toastOk("Avaliação atualizada.");
        resetForm();
        await loadBase();
        return;
      }

      const ins = await supabase.from("ergonomics").insert({
        user_id: authRes.user.id,
        ...payload,
      });

      if (ins.error) throw ins.error;

      toastOk("Avaliação cadastrada.");
      resetForm();
      await loadBase();
    } catch (err: any) {
      const msg = err?.message ?? "Falha ao salvar.";
      setError(msg);
      toastErr(msg);
      console.error("ERRO ergonomics save:", err);
    } finally {
      setBusy(false);
    }
  }

  async function doDeleteNow(it: Erg) {
    setBusy(true);
    setError(null);

    try {
      const del = await supabase.from("ergonomics").delete().eq("id", it.id);
      if (del.error) throw del.error;

      if (editingId === it.id) resetForm();
      toastOk("Excluído.");
      await loadBase();
    } catch (err: any) {
      const msg = err?.message ?? "Falha ao excluir.";
      setError(msg);
      toastErr(msg);
      console.error("ERRO ergonomics delete:", err);
    } finally {
      setBusy(false);
    }
  }

  const filteredSectors = useMemo(() => sectors.filter((s) => s.company_id === companyId), [sectors, companyId]);

  return (
    <div className="di-layout">
      <Sidebar />

      <main className="di-main">
        <div className="container">
          <div className="card" style={{ display: "grid", gap: 12 }}>
            <div className="di-toolbar">
              <h1>Ergonomia – NR-17</h1>
              <button className="di-btn" type="button" onClick={loadBase} disabled={busy}>
                Recarregar
              </button>
            </div>

            <div className="card" style={{ padding: 12 }}>
              <strong>Score (média 1–5):</strong> {score}
              {editingId && <div className="di-small" style={{ marginTop: 6 }}>Modo edição ✅ (ID: {editingId})</div>}
            </div>

            <form onSubmit={handleSave} style={{ display: "grid", gap: 10, maxWidth: 820 }}>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                <option value="">Empresa</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select value={sectorId} onChange={(e) => setSectorId(e.target.value)}>
                <option value="">Setor (opcional)</option>
                {filteredSectors.map((s) => <option key={s.id} value={s.id}>{s.sector_name}</option>)}
              </select>

              <input value={workerName} onChange={(e) => setWorkerName(e.target.value)} placeholder="Trabalhador (ex: João Silva)" />
              <input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Função/Cargo (ex: Manutenção)" />
              <input value={workstation} onChange={(e) => setWorkstation(e.target.value)} placeholder="Posto de trabalho (ex: produção)" />

              <label>Postura (1–5)</label>
              <input type="number" min={1} max={5} value={posture} onChange={(e) => setPosture(clamp15(e.target.value))} />

              <label>Repetitividade (1–5)</label>
              <input type="number" min={1} max={5} value={repetitive} onChange={(e) => setRepetitive(clamp15(e.target.value))} />

              <label>Força/Esforço (1–5)</label>
              <input type="number" min={1} max={5} value={forceEffort} onChange={(e) => setForceEffort(clamp15(e.target.value))} />

              <label>Levantamento de carga (1–5)</label>
              <input type="number" min={1} max={5} value={liftingLoad} onChange={(e) => setLiftingLoad(clamp15(e.target.value))} />

              <label>Ritmo / Pressão (1–5)</label>
              <input type="number" min={1} max={5} value={pacePressure} onChange={(e) => setPacePressure(clamp15(e.target.value))} />

              <label>Pausas (1–5)</label>
              <input type="number" min={1} max={5} value={breaks} onChange={(e) => setBreaks(clamp15(e.target.value))} />

              <label>Ambiente (1–5)</label>
              <input type="number" min={1} max={5} value={environment} onChange={(e) => setEnvironment(clamp15(e.target.value))} />

              <label>Organização (1–5)</label>
              <input type="number" min={1} max={5} value={organization} onChange={(e) => setOrganization(clamp15(e.target.value))} />

              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações (opcional)" />
              <input value={recommendedActions} onChange={(e) => setRecommendedActions(e.target.value)} placeholder="Ações recomendadas (opcional)" />

              <div style={{ display: "flex", gap: 10 }}>
                <button className={canSave ? "di-btn-primary" : ""} type="submit" disabled={!canSave} style={{ flex: 1 }}>
                  {busy ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar avaliação NR-17"}
                </button>

                {editingId && (
                  <button className="di-btn" type="button" onClick={resetForm} disabled={busy} style={{ width: 180 }}>
                    Cancelar
                  </button>
                )}
              </div>

              {error && <div style={{ color: "#b91c1c", fontWeight: 800 }}>Erro: {error}</div>}
            </form>

            <div style={{ marginTop: 10 }}>
              <h3>Avaliações cadastradas</h3>

              <div style={{ display: "grid", gap: 10 }}>
                {items.map((it) => (
                  <div key={it.id} className="card" style={{ padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 900 }}>
                        {it.worker_name} — {it.role_name}
                        <div className="di-small">Posto: {it.workstation}</div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="di-btn-primary" type="button" onClick={() => startEdit(it)} disabled={busy}>
                          Editar
                        </button>
                        <button className="di-btn-danger" type="button" onClick={() => setConfirmDelete(it)} disabled={busy}>
                          Excluir
                        </button>
                      </div>
                    </div>

                    <div className="di-small" style={{ marginTop: 8 }}>
                      P:{it.posture} R:{it.repetitive} F:{it.force_effort} C:{it.lifting_load} Rit:{it.pace_pressure} Pa:{it.breaks} Amb:{it.environment} Org:{it.organization}
                    </div>

                    {it.notes && <div className="di-small">Obs: {it.notes}</div>}
                    {it.recommended_actions && <div className="di-small">Ações: {it.recommended_actions}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <ConfirmModal
        open={!!confirmDelete}
        title="Excluir avaliação NR-17"
        message={confirmDelete ? `Tem certeza que deseja excluir "${confirmDelete.worker_name}"?` : ""}
        confirmText={busy ? "Excluindo..." : "Excluir"}
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete || busy) return;
          const it = confirmDelete;
          setConfirmDelete(null);
          doDeleteNow(it);
        }}
      />

      {toast && <Toast msg={toast.msg} kind={toast.kind} onClose={() => setToast(null)} ms={toast.kind === "ok" ? 2600 : 3600} />}
    </div>
  );
}
