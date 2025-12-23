import { Routes, Route, Link } from "react-router-dom";

function Login() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Login</h1>
      <p>Se você está vendo isso, o Router está OK.</p>
      <Link to="/dashboard">Ir para Dashboard</Link>
    </div>
  );
}

function Dashboard() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Se você chegou aqui, as rotas estão funcionando.</p>
      <Link to="/">Voltar</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}





