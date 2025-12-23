import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function criarConta() {
    if (!email || !password) {
      setMessage("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage("Erro ao criar conta: " + error.message);
    } else {
      setMessage("Conta criada! Agora faça login.");
    }

    setLoading(false);
  }

  async function entrar() {
    if (!email || !password) {
      setMessage("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Erro no login: " + error.message);
      setLoading(false);
      return;
    }

    navigate("/dashboard", { replace: true });
    setLoading(false);
  }

  return (
    <div className="container" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div className="card" style={{ width: "100%", maxWidth: 420, display: "grid", gap: 10 }}>
        <h1>DataInsight SST – Login</h1>

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={entrar} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <button onClick={criarConta} disabled={loading}>
          {loading ? "Aguarde..." : "Criar nova conta"}
        </button>

        {message && <p style={{ marginTop: 6 }}>{message}</p>}
      </div>
    </div>
  );
}
