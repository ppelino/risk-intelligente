import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().includes("@") && password.length >= 6 && !busy;
  }, [email, password, busy]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    const to = location?.state?.from || "/dashboard";
    navigate(to, { replace: true });
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #e5e7eb" }}>
        <h1 style={{ marginTop: 0 }}>Login</h1>
        <p>Entre com email e senha (Supabase Auth).</p>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 10 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Seu email"
            style={{ width: "100%", padding: 10 }}
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            type="password"
            style={{ width: "100%", padding: 10 }}
          />

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #0f172a",
              background: canSubmit ? "#0f172a" : "#9ca3af",
              color: "#fff",
              fontWeight: 700,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {busy ? "Entrando..." : "Entrar"}
          </button>

          {error && <div style={{ color: "#b91c1c", fontWeight: 700 }}>Erro: {error}</div>}
        </form>
      </div>
    </div>
  );
}
