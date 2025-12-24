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

export default function Ergonomics() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [items, setItems] = useState<Erg[]>([]);

  const [companyId, setCompanyId] = useState("");
  const [sectorId, setSectorId] = useState("");

  const [workerName, setWorkerName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [workstation, setWorkstation] = useState("");

  const [posture, setPosture] = useState(2);
  const [repetitive, setRepetitive] = useState(2);
  const [forceEffort, setForceEffort] = useState(2);
  const [liftingLoad, setLiftingLoad] = useState(2);
  const [pacePressure, setPacePressure] = useState(2);
  const [breaks, setBreaks] = useState(2);
  const [environment, setEnvironment] = useState(2);
  const [organization, setOrganization] = useState(2);

  const [notes, setNotes] = useState("");
  const [recommendedActions, setRecommendedActions] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ ID do item que está sendo editado (null = modo “novo”)
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
  }, [posture, repetitive, forceEffort, liftingLoad, pacePressure, breaks, environment, organization]);

  async function loadBase() {
    setError(null);

    const c = await supabase.from("companies").select("id,name").order("name");
    if (c.error) return setError(c.error.message);
    setCompanies(c.data ?? []);

    const s = await supabase.from("sectors").select("id,sector_name,company_id").order("sector_name");
    if (s.error) return setError(s.error.message);
    setSectors(s.data ?? []);

    const r = await supabase
      .from("ergonomics")
      .select(`
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
      `)
      .order("created_at", { ascending: false });

    if (r.error) return setError(r.error.message);
    setItems(r.data ?? []);
  }

  useEffect(() => {
    loadBase();
  }, []);

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
    // mantém empresa/setor selecionados (fica mais prático)
  }

  function startEdit(it: Erg) {
    setError(null);
    setEditingId(it.id);

    setCompanyId(it.company_id);
    setSectorId(it.sector_id ?? "");

    setWorkerName(it.worker_name ?? "");
    setRoleName(it.role_name ?? "");
    setWorkstation(it.workstation ?? "");

    setPosture(it.posture ?? 2);
    setRepetitive(it.repetitive ?? 2);
    setForceEffort(it.force_effort ?? 2);
    setLiftingLoad(it.lifting_load ?? 2);
    setPacePressure(it.pace_pressure ?? 2);
    setBreaks(it.breaks ?? 2);
    setEnvironment(it.environment ?? 2);
    setOrganization(it.organization ?? 2);

    setNotes(it.notes ?? "");
    setRecommendedActions(it.recommended_actions ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    setBusy(true);
    setError(null);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setError("Sessão expirada. Faça login novamente.");
      setBusy(false);
      return;
    }

    const payload = {
      // user_id só no insert; no update não precisa mexer
      company_id: companyId,
      sector_id: sectorId || null,
      worker_name: workerName.trim(),
      role_name: roleName.trim(),
      workstation: workstation.trim(),
      posture,
      repetitive,
      force_effort: forceEffort,
      lifting_load: liftingLoad,
      pace_pressure: pacePressure,
      breaks,
      environment,
      organization,
      notes: notes.trim() ? notes.trim() : null,
      recommended_actions: recommendedActions.trim() ? recommendedActions.trim() : null,
    };

    // ✅ UPDATE (modo edição)
    if (editingId) {
      const upd = await supabase
        .from("ergonomics")
        .update(payload)
        .eq("id", editingId);

      if (upd.error) {
        setError(upd.error.message);
        setBusy(false);
        return;
      }

      setBusy(false);
      resetForm();
      loadBase();
      return;
    }

    // ✅ INSERT (modo novo)
    const ins = await supabase.from("ergonomics").insert({
      user_id: auth.user.id,
      ...payload,
    });

    if (ins.error) {
      setError(ins.error.message);
      setBusy(false);
      return;
    }

    setBusy(false);
    resetForm();
    loadBase();
  }

  async function handleDelete(id: string) {
    const ok = confirm("Excluir esta avaliação NR-17? Essa ação não pode ser desfeita.");
    if (!ok) return;

    setBusy(true);
    setError(null);

    const del = await supabase.from("ergonomics").delete().eq("id", id);
    if (del.error) {
      setError(del.error.message);
      setBusy(false);
      return;
    }

    // se estava editando esse item, sai do modo edição
    if (editingId === id) resetForm();

    setBusy(false);
    loadBase();
  }

  const filteredSectors = sectors.filter((s) => s.company_id === companyId);

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
              <input type="number" min={1} max={5} value={posture} onChange={(e) => setPosture(+e.target.value)} style={{ padding: 10 }} />

              <label>Repetitividade (1–5)</label>
              <input type="number" min={1} max={5} value={repetitive} onChange={(e) => setRepetitive(+e.target.value)} style={{ padding: 10 }} />

              <label>Força/Esforço (1–5)</label>
              <input type="number" min={1} max={5} value={forceEffort} onChange={(e) => setForceEffort(+e.target.value)} style={{ padding: 10 }} />

              <label>Levantamento de carga (1–5)</label>
              <input type="number" min={1} max={5} value={liftingLoad} onChange={(e) => setLiftingLoad(+e.target.value)} style={{ padding: 10 }} />

              <label>Ritmo / Pressão (1–5)</label>
              <input type="number" min={1} max={5} value={pacePressure} onChange={(e) => setPacePressure(+e.target.value)} style={{ padding: 10 }} />

              <label>Pausas (1–5)</label>
              <input type="number" min={1} max={5} value={breaks} onChange={(e) => setBreaks(+e.target.value)} style={{ padding: 10 }} />

              <label>Ambiente (1–5)</label>
              <input type="number" min={1} max={5} value={environment} onChange={(e) => setEnvironment(+e.target.value)} style={{ padding: 10 }} />

              <label>Organização (1–5)</label>
              <input type="number" min={1} max={5} value={organization} onChange={(e) => setOrganization(+e.target.value)} style={{ padding: 10 }} />

              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações (opcional)" style={{ padding: 10 }} />
              <input value={recommendedActions} onChange={(e) => setRecommendedActions(e.target.value)} placeholder="Ações recomendadas (opcional)" style={{ padding: 10 }} />

              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" disabled={!canSave} style={{ padding: 10, flex: 1 }}>
                  {busy ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar avaliação NR-17"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={busy}
                    style={{ padding: 10, width: 180 }}
                  >
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
                        <button
                          type="button"
                          onClick={() => handleDelete(it.id)}
                          disabled={busy}
                          style={{ padding: "6px 10px" }}
                        >
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
