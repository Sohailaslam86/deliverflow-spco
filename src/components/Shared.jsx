// src/components/Shared.jsx
const STATUS_STYLES = {
  pending:     { label: "Pending",     lblAr: "قيد الانتظار", icon: "⏳", bg: "#f1f5f9", c: "#475569" },
  assigned:    { label: "Assigned",    lblAr: "تم التعيين",  icon: "👤", bg: "#e0e7ff", c: "#4338ca" },
  intransit:   { label: "In Transit",  lblAr: "في الطريق",   icon: "🚚", bg: "#fef3c7", c: "#b45309" },
  delivered:   { label: "Delivered",   lblAr: "تم التسليم",  icon: "✅", bg: "#d1fae5", c: "#065f46" },
  outstanding: { label: "Outstanding", lblAr: "معلقة",      icon: "⚠️", bg: "#ffedd5", c: "#c2410c" },
  failed:      { label: "Failed",      lblAr: "فاشلة",       icon: "❌", bg: "#fee2e2", c: "#b91c1c" }
};

export function Badge({ status, lang }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const isAr = lang === "ar";
  return (
    <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
      background: s.bg, color: s.c, whiteSpace: "nowrap" }}>
      {s.icon} {isAr && s.lblAr ? s.lblAr : s.label}
    </span>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{ background: "white", borderRadius: 10, padding: "16px 20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 16, ...style }}>
      {children}
    </div>
  );
}

export function CardTitle({ children, style }) {
  return (
    <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 12,
      display: "flex", alignItems: "center", gap: 8, ...style }}>
      {children}
    </div>
  );
}

export function Btn({ children, onClick, color="#1A3A5C", style, disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: disabled ? "#cbd5e1" : color, color: "white", border: "none",
        padding: small ? "6px 14px" : "10px 20px",
        borderRadius: 8, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        fontSize: small ? 12 : 13, display: "inline-flex", alignItems: "center",
        justifyContent: "center", gap: 6, ...style }}>
      {children}
    </button>
  );
}

export function Input({ label, value, onChange, type="text", required, placeholder }) {
  return (
    <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{label} {required && <span style={{color:"#ef4444"}}>*</span>}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, color: "#1e293b", background: "white" }} />
    </div>
  );
}

export function Select({ label, value, onChange, options=[], required }) {
  return (
    <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{label} {required && <span style={{color:"#ef4444"}}>*</span>}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, color: "#1e293b", background: "white" }}>
        <option value="" disabled hidden>Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function SuccessMsg({ msg }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, background: "#10b981", color: "white",
      padding: "12px 24px", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      fontWeight: 700, zIndex: 1100, fontSize: 13 }}>
      ✓ {msg}
    </div>
  );
}

export function AgingBadge({ days, lang }) {
  const isAr = lang === "ar";
  const color = days <= 1
    ? { bg: "#d1fae5", c: "#065f46", label: isAr ? "جديد" : "Fresh" }
    : days <= 3
    ? { bg: "#fef3c7", c: "#92400e", label: isAr ? "قيد الانتظار" : "Aging" }
    : { bg: "#fee2e2", c: "#991b1b", label: isAr ? `${days} أيام` : `${days}d — Critical` };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px",
      borderRadius: 99, background: color.bg, color: color.c }}>
      {color.label}
    </span>
  );
}
