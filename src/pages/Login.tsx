import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #e5e7eb" }}>
        <h1 style={{ marginTop: 0 }}>Login</h1>
        <p>Se você está vendo isso, o Router está OK.</p>

        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #0f172a",
            background: "#0f172a",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Ir para Dashboard
        </button>
      </div>
    </div>
  );
}





