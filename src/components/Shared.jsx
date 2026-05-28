// src/components/Shared.jsx
import { STATUS_STYLES } from "../data/masterData.js";

export function Badge({ status, lang }) {
  const rtl = lang === "ar";
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span style={{ 
      fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
      background: s.bg, color: s.c, whiteSpace: "nowrap" 
    }}>
      {s.icon} {rtl && s.lblAr ? s.lblAr : s.label}
    </span>
  );
}

export function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{ 
      background: "white", borderRadius: 10, padding: "16px 20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 16, ...style 
    }}>
      {children}
    </div>
  );
}

export function CardTitle({ children, style }) {
  return (
    <div style={{ 
      fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 12,
      display: "flex", alignItems: "center", gap: 8, ...style 
    }}>
      {children}
    </div>
  );
}

export function Btn({ children, onClick, color = "#1A3A5C", style, disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ 
        background: disabled ? "#cbd5e1" : color, color: "white", border: "none",
        padding: small ? "6px 14px" : "10px 20px",
        borderRadius: 8, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", 
        fontSize: small ? 12 : 14, ...style 
      }}>
      {children}
    </button>
  );
}

export function SectionTitle({ children, style }) {
  return (
    <h2 style={{ 
      fontSize: 16, fontWeight: 700, color: "#1e293b", 
      marginBottom: 14, marginTop: 6, ...style 
    }}>
      {children}
    </h2>
  );
}

export function AgingBadge({ days, lang }) {
  const rtl = lang === "ar";
  const color = days <= 1
    ? { bg: "#d1fae5", c: "#065f46", en: "Fresh", ar: "جديد" }
    : days <= 3
    ? { bg: "#fef3c7", c: "#92400e", en: "Aging", ar: "قيد الانتظار" }
    : { bg: "#fee2e2", c: "#991b1b", en: `${days}d — Critical`, ar: `حرج — ${days} أيام` };
    
  return (
    <span style={{ 
      fontSize: 11, fontWeight: 600, padding: "2px 8px",
      borderRadius: 99, background: color.bg, color: color.c 
    }}>
      {rtl ? color.ar : color.en}
    </span>
  );
}
