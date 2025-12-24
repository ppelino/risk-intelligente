import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabase";

type Company = { id: string; name: string };
type Sector = { id: string; sector_name: string; company_id: string };

type Risk = {
  id: string;
  hazard: string;
  risk: string;
  probability: number;
  severity: number;
  risk_level: number;
};

export default function Risks() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);

  const [companyId, setCompanyId] = useState("");
  const [sectorId, setSectorId] = useState("");

  const [hazard, setHazard] = useState("");
  const [riskDesc, setRiskDesc] = useState("");
  const [probability, setProbability] = useState(1);
  const [severity, setSeverity] = useState(1);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => {
    return companyId && sectorId && hazard && riskDesc && !busy;
  }, [companyId, sectorId, hazard, riskDesc, busy]);

  async function loadBase() {
    const c = await supabase.from("companies").select("id,name").order("name");
    if (!c.error) setCompanies(c.data ?? []);

    const s = await supabase
      .from("sectors")
      .select("id,sector_name,company_id")
      .order("sector_name");
    if (!s.error) setSectors(s.data ?? []);

    const r = await supabase
      .from("risks")
      .select("id,hazard,risk,probability,severity,risk_level")
      .order("created_at", { ascending: false });

    if (!r.error) setRisks(r.data ?? []);
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
      setError("Sessão expirada.");
      setBusy(false);
      return;
    }

    const ins = await supabase.from("risks").insert({
      user_id: auth.user.id,
      company_id: companyId,
      sector_id: sectorId,
      hazard,
      risk: riskDesc,
      probability,
      severity,
    });

    if (ins.error) {
      setError(ins.error.message);
      setBusy(false);
      return;
    }

    setHazard("");
    setRiskDesc("");
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

            <form onSubmit={handleSave} style={{ display: "grid", gap: 10, maxWidth: 640 }}>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                <option value="">Empresa</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select value={sectorId} onChange={(e) => setSectorId(e.target.value)}>
                <option value="">Setor</option>
                {filteredSectors.map((s) => (
                  <option key={s.id} value={s.id}>{s.sector_name}</option>
                ))}
              </select>

              <input placeholder="Perigo (ex: Ruído)" value={hazard} onChange={(e) => setHazard(e.target.value)} />
              <input placeholder="Risco (ex: Perda auditiva)" value={riskDesc} onChange={(e) => setRiskDesc(e.target.value)} />

              <label>Probabilidade (1–5)</label>
              <input type="number" min={1} max={5} value={probability} onChange={(e) => setProbability(+e.target.value)} />

              <label>Severidade (1–5)</label>
              <input type="number" min={1} max={5} value={severity} onChange={(e) => setSeverity(+e.target.value)} />

              <button disabled={!canSave}>
                {busy ? "Salvando..." : "Salvar risco"}
              </button>

              {error && <div style={{ color: "darkred", fontWeight: 700 }}>Erro: {error}</div>}
            </form>

            <div>
              <h3>Riscos cadastrados</h3>
              {risks.map((r) => (
                <div key={r.id} className="card" style={{ marginBottom: 8 }}>
                  <strong>{r.hazard}</strong> – {r.risk}
                  <div>Prob: {r.probability} | Sev: {r.severity} | Nível: {r.risk_level}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
