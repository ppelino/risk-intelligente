export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 9998,
        padding: 16,
      }}
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="card"
        style={{
          width: "min(560px, 100%)",
          padding: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: 8 }}>{title}</h2>
        <p style={{ marginBottom: 14, color: "#334155" }}>{message}</p>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" className="di-btn" onClick={onCancel}>
            {cancelText}
          </button>

          <button
            type="button"
            className={danger ? "di-btn-danger" : "di-btn-primary"}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
