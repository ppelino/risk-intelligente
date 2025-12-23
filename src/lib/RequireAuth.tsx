import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useNavigate } from "react-router-dom";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;

      if (!data.session) {
        navigate("/login", { replace: true });
      }
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [navigate]);

  if (loading) return <p style={{ padding: 24 }}>Carregando...</p>;
  return <>{children}</>;
}
