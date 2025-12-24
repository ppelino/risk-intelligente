import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Login</h1>
      <p>Se você está vendo isso, o Router está OK.</p>

      <Link to="/dashboard">Ir para Dashboard</Link>
    </div>
  );
}


