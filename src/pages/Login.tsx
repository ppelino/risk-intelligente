import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="di-layout">
      <main className="di-main">
        <div className="container">
          <div className="card" style={{ display: "grid", gap: 10 }}>
            <h1>Login</h1>
            <p>Se você está vendo isso, o Router está OK.</p>

            {/* Por enquanto é só navegação (depois entra Supabase aqui) */}
            <Link to="/dashboard" style={{ fontWeight: 700 }}>
              Ir para Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}




