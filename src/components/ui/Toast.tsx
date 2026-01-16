import { useEffect } from "react";

export default function Toast({
  msg,
  kind,
  onClose,
  ms = 2600,
}: {
  msg: string;
  kind: "ok" | "err";
  onClose: () => void;
  ms?: number;
}) {
  useEffect(() => {
    const t = window.setTimeout(onClose, ms);
    return () => window.clearTimeout(t);
  }, [onClose, ms]);

  return (
    <div
      onClick={onClose}
      role="status"
      aria-live="polite"
      title="Clique para fechar"
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 9999,
        background: kind === "ok" ? "#0f172a" : "#7f1d1d",
        color: "#fff",
        padding: "10px 12px",
        borderRadius: 12,
        boxShadow: "0 10px 25px rgba(0,0,0,.18)",
        maxWidth: 420,
        cursor: "pointer",
        fontWeight: 800,
      }}
    >
      {msg}
    </div>
  );
}
