import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "./supabase";

type Props = {
  children: React.ReactNode;
};

export default function RequireAuth({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Carregando...</div>;

  if (!authed) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

