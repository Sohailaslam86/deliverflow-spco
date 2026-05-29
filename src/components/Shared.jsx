// src/components/Shared.jsx
import { STATUS_STYLES } from "../data/masterData.js";

export function Badge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99,
      background:s.bg, color:s.c, whiteSpace:"nowrap" }}>
      {s.icon} {s.label}
    </span>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{ background:"white", borderRadius:10, padding:"16px 20px",
      boxShadow:"0 1px 3px rgba(0,0,0,0.06)", marginBottom:16, ...style }}>
      {children}
    </div>
  );
}

export function CardTitle({ children, style }) {
  return (
    <div style={{ fontWeight:700, fontSize:15, color:"#0f172a", marginBottom:12,
      display:"flex", alignItems:"center", gap:8, ...style }}>
      {children}
    </div>
  );
}

export function Btn({ children, onClick, color="#1A3A5C", style, disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:color, color:"white", border:"none",
        padding: small ? "6px 14px" : "10px 20px",
        borderRadius:8, fontWeight:700,
        cursor:disabled?"not-allowed":"pointer",
        fontSize: small ? 12 : 13,
        opacity:disabled?0.5:1, ...style }}>
      {children}
    </button>
  );
}

export function OutlineBtn({ children, onClick, color="#1A3A5C", style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:"white", color, border:`1.5px solid ${color}`,
        padding:"8px 16px", borderRadius:8, fontWeight:600,
        cursor:disabled?"not-allowed":"pointer", fontSize:13,
        opacity:disabled?0.5:1, ...style }}>
      {children}
    </button>
  );
}

export function Input({ label, value, onChange, type="text", placeholder="", required, style }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && (
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:5 }}>
          {label}{required && <span style={{ color:"#ef4444" }}> *</span>}
        </label>
      )}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8,
          padding:"9px 12px", fontSize:14, outline:"none", boxSizing:"border-box", ...style }} />
    </div>
  );
}

export function Textarea({ label, value, onChange, placeholder="", required }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && (
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:5 }}>
          {label}{required && <span style={{ color:"#ef4444" }}> *</span>}
        </label>
      )}
      <textarea value={value} onChange={e=>onChange(e.target.value)}  
        placeholder={placeholder} rows={3}
        style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8,
          padding:"9px 12px", fontSize:14, outline:"none",
          boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }} />
    </div>
  );
}

export function Select({ label, value, onChange, options=[], required, placeholder="Select..." }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && (
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:5 }}>
          {label}{required && <span style={{ color:"#ef4444" }}> *</span>}
        </label>
      )}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8,
          padding:"9px 12px", fontSize:14, outline:"none",
          background:"white", boxSizing:"border-box" }}>
        <option value="">{placeholder}</option>
        {options.map(o => (
          typeof o === "string"
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function SuccessMsg({ msg, onClose }) {
  return (
    <div style={{ background:"#d1fae5", color:"#065f46", borderRadius:8,
      padding:"12px 16px", fontWeight:600, marginBottom:12,
      display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span>✅ {msg}</span>
      {onClose && <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#065f46", fontSize:18 }}>×</button>}
    </div>
  );
}

export function ErrorMsg({ msg }) {
  return (
    <div style={{ background:"#fee2e2", color:"#991b1b", borderRadius:8,
      padding:"12px 16px", fontWeight:500, marginBottom:12 }}>
      ⚠️ {msg}
    </div>
  );
}

export function StatCard({ icon, label, value, color, sub, onClick }) {
  return (
    <div onClick={onClick}
      style={{ background:"white", borderRadius:10, padding:"14px", textAlign:"center",
        boxShadow:"0 1px 3px rgba(0,0,0,0.06)", borderTop:`4px solid ${color}`,
        cursor:onClick?"pointer":"default" }}>
      <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
      <div style={{ fontWeight:800, fontSize:22, color }}>{value}</div>
      <div style={{ fontSize:12, color:"#94a3b8" }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{sub}</div>}
    </div>
  );
}

export function SectionTitle({ children }) {
  return (
    <div style={{ fontWeight:700, fontSize:15, color:"#0f172a", margin:"16px 0 10px" }}>
      {children}
    </div>
  );
}

export function EmptyState({ icon="📭", title, sub }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 20px", color:"#94a3b8" }}>
      <div style={{ fontSize:40, marginBottom:10 }}>{icon}</div>
      <div style={{ fontWeight:600, fontSize:15, marginBottom:4 }}>{title}</div>
      {sub && <div style={{ fontSize:13 }}>{sub}</div>}
    </div>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
      {tabs.map(([id, icon, label]) => (
        <button key={id} onClick={() => onChange(id)}
          style={{ padding:"8px 16px", borderRadius:8, border:"none",
            background:active===id?"#1A3A5C":"#f1f5f9",
            color:active===id?"white":"#374151",
            cursor:"pointer", fontSize:13, fontWeight:600 }}>
          {icon} {label}
        </button>
      ))}
    </div>
  );
}

export function InfoBox({ children, color="#EAF2FF", borderColor="#2471A3", textColor="#1A5276" }) {
  return (
    <div style={{ background:color, borderLeft:`4px solid ${borderColor}`,
      padding:"10px 14px", borderRadius:"0 8px 8px 0",
      fontSize:13, color:textColor, marginBottom:12 }}>
      ℹ️ {children}
    </div>
  );
}

export function WarnBox({ children }) {
  return (
    <div style={{ background:"#FEF9E7", borderLeft:"4px solid #F39C12",
      padding:"10px 14px", borderRadius:"0 8px 8px 0",
      fontSize:13, color:"#7D6608", marginBottom:12 }}>
      ⚠️ {children}
    </div>
  );
}

export function AgingBadge({ days }) {
  const color = days <= 1
    ? { bg:"#d1fae5", c:"#065f46", label:"Fresh" }
    : days <= 3
    ? { bg:"#fef3c7", c:"#92400e", label:"Aging" }
    : { bg:"#fee2e2", c:"#991b1b", label:`${days}d — Critical` };
  return (
    <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px",
      borderRadius:99, background:color.bg, color:color.c }}>
      {color.label}
    </span>
  );
}

export function Modal({ title, children, onClose, width=480 }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
      zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"white", borderRadius:12, padding:28,
        width:"100%", maxWidth:width, maxHeight:"90vh", overflowY:"auto",
        boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:20 }}>
          <h2 style={{ margin:0, fontWeight:800, fontSize:18, color:"#0f172a" }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none",
            cursor:"pointer", fontSize:22, color:"#94a3b8" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
