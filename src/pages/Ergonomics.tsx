import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabase";

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

  // guardo como number, mas vou blindar no payload
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
      posture +
      repetitive +
      forceEffort +
      liftingLoad +
      pacePressure +
      breaks +
      environment +
      organization;
    return Math.round((sum / 8) * 10) / 10;
  }, [
    posture,
    repetitive,
    forceEffort,
    liftingLoad,
    pacePressure,
    breaks,
    environment,
    organization,
  ]);

  async function loadBase() {
    setError(null);

    const c = await supabase.from("companies").select("id,name").order("name");
    if (c.error) return setError(c.error.message);
    setCompanies(c.data ?? []);

    const s = await supabase
      .from("sectors")
      .select("id,sector_name,company_id")
      .order("sector_name");
    if (s.error) return setError(s.error.message);
    setSectors(s.data ?? []);

    const r = await supabase
      .from("ergonomics")
      .select(
        `
        id,
        company_id,
        sector_id,
        worker_name,
        role_name,
        workstation,
        posture,
        repetitive,
        force_effort,
        lifting_load,
        pace_pressure,
        breaks,
        environment,
        organization,
        notes,
        recommended_actions,
        created_at
      `
      )
      .order("created_at", { ascending: false });

    if (r.error) return setError(r.error.message);
    setItems((r.data ?? []) as Erg[]);
  }

  useEffect(() => {
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ quando troca empresa, limpa setor (evita setor de outra empresa)
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

      // ✅ blindagem total nos números (nunca vai NaN)
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
        if (upd.error) throw new Error(upd.error.message);

        resetForm();
        await loadBase();
        return;
      }

      const ins = await supabase.from("ergonomics").insert({
        user_id: authRes.user.id,
        ...payload,
      });

      if (ins.error) throw new Error(ins.error.message);

      resetForm();
      await loadBase();
    } catch (err: any) {
      console.error("ERRO ao salvar ergonomics:", err);
      setError(err?.message ?? "Falha ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = confirm("Excluir esta avaliação NR-17? Essa ação não pode ser desfeita.");
    if (!ok) return;

    setBusy(true);
    setError(null);

    try {
      const del = await supabase.from("ergonomics").delete().eq("id", id);
      if (del.error) throw new Error(del.error.message);

      if (editingId === id) resetForm();
      await loadBase();
    } catch (err: any) {
      console.error("ERRO ao excluir ergonomics:", err);
      setError(err?.message ?? "Falha ao excluir.");
    } finally {
      setBusy(false);
    }
  }

  const filteredSectors = useMemo(() => {
    return sectors.filter((s) => s.company_id === companyId);
  }, [sectors, companyId]);

  return (
    <div className="di-layout">
      <Sidebar />

      <main className="di-main">
        <div className="container">
          <div className="card" style={{ display: "grid", gap: 12 }}>
            <h1>Ergonomia – NR-17</h1>

            <div className="card" style={{ padding: 12 }}>
              <strong>Score (média 1–5):</strong> {score}
              {editingId && (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                  Modo edição ativo ✅ (ID: {editingId})
                </div>
              )}
            </div>

            <form onSubmit={handleSave} style={{ display: "grid", gap: 10, maxWidth: 820 }}>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={{ padding: 10 }}>
                <option value="">Empresa</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select value={sectorId} onChange={(e) => setSectorId(e.target.value)} style={{ padding: 10 }}>
                <option value="">Setor (opcional)</option>
                {filteredSectors.map((s) => (
                  <option key={s.id} value={s.id}>{s.sector_name}</option>
                ))}
              </select>

              <input value={workerName} onChange={(e) => setWorkerName(e.target.value)} placeholder="Trabalhador (ex: João Silva)" style={{ padding: 10 }} />
              <input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Função/Cargo (ex: Manutenção)" style={{ padding: 10 }} />
              <input value={workstation} onChange={(e) => setWorkstation(e.target.value)} placeholder="Posto de trabalho (ex: produção)" style={{ padding: 10 }} />

              <label>Postura (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={posture}
                onChange={(e) => setPosture(clamp15(e.target.value))}
                style={{ padding: 10 }}
              />

              <label>Repetitividade (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={repetitive}
                onChange={(e) => setRepetitive(clamp15(e.target.value))}
                style={{ padding: 10 }}
              />

              <label>Força/Esforço (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={forceEffort}
                onChange={(e) => setForceEffort(clamp15(e.target.value))}
                style={{ padding: 10 }}
              />

              <label>Levantamento de carga (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={liftingLoad}
                onChange={(e) => setLiftingLoad(clamp15(e.target.value))}
                style={{ padding: 10 }}
              />

              <label>Ritmo / Pressão (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={pacePressure}
                onChange={(e) => setPacePressure(clamp15(e.target.value))}
                style={{ padding: 10 }}
              />

              <label>Pausas (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={breaks}
                onChange={(e) => setBreaks(clamp15(e.target.value))}
                style={{ padding: 10 }}
              />

              <label>Ambiente (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={environment}
                onChange={(e) => setEnvironment(clamp15(e.target.value))}
                style={{ padding: 10 }}
              />

              <label>Organização (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={organization}
                onChange={(e) => setOrganization(clamp15(e.target.value))}
                style={{ padding: 10 }}
              />

              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações (opcional)" style={{ padding: 10 }} />
              <input value={recommendedActions} onChange={(e) => setRecommendedActions(e.target.value)} placeholder="Ações recomendadas (opcional)" style={{ padding: 10 }} />

              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" disabled={!canSave} style={{ padding: 10, flex: 1 }}>
                  {busy ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar avaliação NR-17"}
                </button>

                {editingId && (
                  <button type="button" onClick={resetForm} disabled={busy} style={{ padding: 10, width: 180 }}>
                    Cancelar
                  </button>
                )}
              </div>

              {error && <div style={{ color: "#b91c1c", fontWeight: 700 }}>Erro: {error}</div>}
            </form>

            <div style={{ marginTop: 10 }}>
              <h3>Avaliações cadastradas</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {items.map((it) => (
                  <div key={it.id} className="card" style={{ padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 800 }}>
                        {it.worker_name} — {it.role_name}
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => startEdit(it)} disabled={busy} style={{ padding: "6px 10px" }}>
                          Editar
                        </button>
                        <button type="button" onClick={() => handleDelete(it.id)} disabled={busy} style={{ padding: "6px 10px" }}>
                          Excluir
                        </button>
                      </div>
                    </div>

                    <div style={{ opacity: 0.85 }}>Posto: {it.workstation}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      P:{it.posture} R:{it.repetitive} F:{it.force_effort} C:{it.lifting_load} Rit:{it.pace_pressure} Pa:{it.breaks} Amb:{it.environment} Org:{it.organization}
                    </div>
                    {it.notes && <div style={{ fontSize: 12, opacity: 0.75 }}>Obs: {it.notes}</div>}
                    {it.recommended_actions && <div style={{ fontSize: 12, opacity: 0.75 }}>Ações: {it.recommended_actions}</div>}
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
