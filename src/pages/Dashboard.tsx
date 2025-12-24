import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Dashboard</h1>
      <p>Se você está vendo isso, a rota /dashboard está OK ✅</p>
      <Link to="/">Voltar para Login</Link>
    </div>
  );
}


