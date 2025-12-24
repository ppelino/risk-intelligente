import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabase";

type Company = { id: string; name: string };
type Sector = { id: string; sector_name: string; company_id: string };

type Risk = {
  id: string;
  company_id: string;
  sector_id: string | null;
  hazard: string;
  risk_description: string;
  risk_type: string | null;
  existing_controls: string | null;
  recommended_actions: string | null; // ✅ PLURAL (igual no banco)
  probability: number;
  severity: number;
  created_at: string;
};

export default function Risks() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);

  const [companyId, setCompanyId] = useState("");
  const [sectorId, setSectorId] = useState("");

  const [hazard, setHazard] = useState("");
  const [riskDescription, setRiskDescription] = useState("");
  const [riskType, setRiskType] = useState("");
  const [existingControls, setExistingControls] = useState("");
  const [recommendedActions, setRecommendedActions] = useState(""); // ✅ plural
  const [probability, setProbability] = useState(1);
  const [severity, setSeverity] = useState(1);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => {
    return companyId && hazard.trim() && riskDescription.trim() && !busy;
  }, [companyId, hazard, riskDescription, busy]);

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
      .from("risks")
      .select(
        "id,company_id,sector_id,hazard,risk_description,risk_type,existing_controls,recommended_actions,probability,severity,created_at"
      )
      .order("created_at", { ascending: false });

    if (r.error) return setError(r.error.message);
    setRisks((r.data ?? []) as Risk[]);
  }

  useEffect(() => {
    loadBase();
  }, []);

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

    const ins = await supabase.from("risks").insert({
      user_id: auth.user.id,
      company_id: companyId,
      sector_id: sectorId || null,
      hazard: hazard.trim(),
      risk_description: riskDescription.trim(),
      risk_type: riskType.trim() ? riskType.trim() : null,
      existing_controls: existingControls.trim() ? existingControls.trim() : null,
      recommended_actions: recommendedActions.trim() ? recommendedActions.trim() : null, // ✅ PLURAL
      probability,
      severity,
    });

    if (ins.error) {
      setError(ins.error.message);
      setBusy(false);
      return;
    }

    setHazard("");
    setRiskDescription("");
    setRiskType("");
    setExistingControls("");
    setRecommendedActions("");
    setProbability(1);
    setSeverity(1);
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
            <h1>Riscos – PGR / NR-01</h1>

            <form onSubmit={handleSave} style={{ display: "grid", gap: 10, maxWidth: 720 }}>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={{ padding: 10 }}>
                <option value="">Empresa</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select value={sectorId} onChange={(e) => setSectorId(e.target.value)} style={{ padding: 10 }}>
                <option value="">Setor (opcional)</option>
                {filteredSectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sector_name}
                  </option>
                ))}
              </select>

              <input
                value={hazard}
                onChange={(e) => setHazard(e.target.value)}
                placeholder="Fonte/Perigo (ex: Ruído de máquinas)"
                style={{ padding: 10 }}
              />
              <input
                value={riskDescription}
                onChange={(e) => setRiskDescription(e.target.value)}
                placeholder="Descrição do risco (ex: Perda auditiva)"
                style={{ padding: 10 }}
              />

              <input
                value={riskType}
                onChange={(e) => setRiskType(e.target.value)}
                placeholder="Tipo (ex: Físico / Químico / Ergonômico...)"
                style={{ padding: 10 }}
              />
              <input
                value={existingControls}
                onChange={(e) => setExistingControls(e.target.value)}
                placeholder="Controles existentes (opcional)"
                style={{ padding: 10 }}
              />
              <input
                value={recommendedActions}
                onChange={(e) => setRecommendedActions(e.target.value)}
                placeholder="Ações recomendadas (opcional)"
                style={{ padding: 10 }}
              />

              <label>Probabilidade (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={probability}
                onChange={(e) => setProbability(+e.target.value)}
                style={{ padding: 10 }}
              />

              <label>Severidade (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={severity}
                onChange={(e) => setSeverity(+e.target.value)}
                style={{ padding: 10 }}
              />

              <button type="submit" disabled={!canSave} style={{ padding: 10 }}>
                {busy ? "Salvando..." : "Salvar risco"}
              </button>

              {error && <div style={{ color: "#b91c1c", fontWeight: 700 }}>Erro: {error}</div>}
            </form>

            <div>
              <h3>Riscos cadastrados</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {risks.map((r) => (
                  <div key={r.id} className="card" style={{ padding: 12 }}>
                    <div style={{ fontWeight: 800 }}>{r.hazard}</div>
                    <div style={{ opacity: 0.85 }}>{r.risk_description}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      Prob: {r.probability} | Sev: {r.severity}
                      {r.risk_type ? ` | Tipo: ${r.risk_type}` : ""}
                    </div>
                    {r.existing_controls && (
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Controles: {r.existing_controls}</div>
                    )}
                    {r.recommended_actions && (
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Ações: {r.recommended_actions}</div>
                    )}
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
