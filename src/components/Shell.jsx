import { useState } from "react";
import { RC, RA, RI } from "../data/masterData.js";

const T = {
  en: {
    dashboard:"Dashboard", invoices:"All Invoices", dcinvoices:"Invoice Management",
    upload:"Invoice Upload & Post", trips:"Trips", users:"User Management",
    masterdata:"System Configuration", fleet:"Fleet Management", fuel:"Fuel Tracking",
    reports:"Reports", download:"POD Management", assign:"Dispatch Management",
    mydeliveries:"My Deliveries", odometer:"Daily Mileage Log", search:"Search Invoices",
    alerts:"Alerts", logout:"Logout",
    admin:"System Administrator", planning:"Planning",
    manager:"Distribution Center Manager", driver:"Delivery Driver", viewonly:"View Only"
  },
  ar: {
    dashboard:"لوحة القيادة", invoices:"جميع الفواتير", dcinvoices:"إدارة الفواتير",
    upload:"رفع وترحيل الفواتير", trips:"الرحلات", users:"إدارة المستخدمين",
    masterdata:"إعدادات النظام", fleet:"إدارة الأسطول", fuel:"تتبع الوقود",
    reports:"التقارير", download:"إدارة وثائق التسليم", assign:"إدارة الإرسال",
    mydeliveries:"تسليماتي", odometer:"سجل المسافات اليومي", search:"البحث عن الفواتير",
    alerts:"تنبيهات", logout:"تسجيل الخروج",
    admin:"مدير النظام", planning:"التخطيط",
    manager:"مدير مركز التوزيع", driver:"سائق التسليم", viewonly:"عرض فقط"
  }
};

const NAV = {
  admin:   [["dashboard","📊"],["invoices","📋"],["upload","📤"],["assign","🚚"],["trips","🔄"],["fleet","🚗"],["fuel","⛽"],["users","👥"],["masterdata","⚙️"],["reports","📈"],["download","📥"]],
  planning:[["dashboard","📊"],["upload","📤"],["invoices","📋"],["download","📥"],["users","👥"]],
  manager: [["dashboard","📊"],["invoices","📋"],["assign","🚚"],["trips","🔄"],["fleet","🚗"],["fuel","⛽"],["reports","📈"],["users","👥"]],
  driver:  [["mydeliveries","📦"],["odometer","🔢"]],
  viewonly:[["search","🔍"]],
};

export default function Shell({ user, lang, setLang, page, setPage, onLogout, children, alerts }) {
  const [open, setOpen] = useState(false);
  const rtl = lang === "ar";
  const t = T[lang] || T.en;
  const nav = NAV[user.role] || NAV.viewonly;
  const cur = nav.find(n => n[0] === page)?.[0] || nav[0][0];
  const activeAlerts = (alerts||[]).filter(a => a.status === "active" && (!user.dc || a.dc === user.dc || user.role === "admin"));

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f1f5f9", direction:rtl?"rtl":"ltr", fontFamily:"'Segoe UI',sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{
        width:250, position:"fixed", height:"100vh",
        background:RC[user.role]||"#1A3A5C",
        display:"flex", flexDirection:"column", zIndex:200,
        transition:"transform 0.3s",
        transform:open?"translateX(0)":(rtl?"translateX(100%)":"translateX(-100%)"),
        [rtl?"right":"left"]:0,
        overflowY:"auto",
        boxShadow:"4px 0 20px rgba(0,0,0,0.3)"
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 18px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontSize:26 }}>🚚</span>
          <div>
            <div style={{ fontWeight:800, fontSize:17, color:"white" }}>DeliverFlow</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:2 }}>SPCO</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"12px 8px" }}>
          {nav.map(([id, icon]) => (
            <button key={id} onClick={() => { setPage(id); setOpen(false); }}
              style={{
                width:"100%",
                background:cur===id?(RA[user.role]||"#2471A3")+"44":"none",
                border:`1px solid ${cur===id?(RA[user.role]||"#2471A3"):"transparent"}`,
                color:cur===id?"white":"rgba(255,255,255,0.65)",
                padding:"12px 14px", borderRadius:8, cursor:"pointer",
                textAlign:rtl?"right":"left", fontSize:14,
                display:"flex", alignItems:"center", gap:10,
                marginBottom:3, fontWeight:cur===id?700:400
              }}>
              <span style={{ fontSize:17, width:22, textAlign:"center" }}>{icon}</span>
              <span>{id==="invoices"&&user.role==="manager"?t.dcinvoices:t[id]||id}</span>
            </button>
          ))}
        </nav>

        {/* Language */}
        <div style={{ display:"flex", gap:6, padding:"10px 16px" }}>
          {[["en","EN"],["ar","عربي"]].map(([l,lbl]) => (
            <button key={l} onClick={() => setLang(l)}
              style={{
                flex:1, border:"1px solid rgba(255,255,255,0.2)",
                background:lang===l?(RA[user.role]||"#2471A3"):"none",
                color:lang===l?"white":"rgba(255,255,255,0.5)",
                borderRadius:6, padding:"7px 0", cursor:"pointer",
                fontSize:13, fontWeight:600
              }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* User info */}
        <div style={{ padding:"14px 18px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{
              width:40, height:40, borderRadius:"50%",
              background:RA[user.role]||"#2471A3",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontWeight:700, fontSize:16, color:"white", flexShrink:0
            }}>{(user.name||"?").charAt(0)}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"white", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user.displayName||user.name}
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>
                {t[user.role]||user.role} {user.dc&&user.dc!=="Head Office"?"— "+user.dc:""}
              </div>
            </div>
          </div>
          <button onClick={onLogout} style={{
            width:"100%", background:"rgba(255,255,255,0.08)",
            border:"none", color:"rgba(255,255,255,0.6)",
            cursor:"pointer", fontSize:13, padding:"9px",
            borderRadius:6, fontWeight:600
          }}>
            {t.logout} →
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {open && <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:199 }} />}

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <header style={{
          background:"white", padding:"0 20px", height:60,
          display:"flex", alignItems:"center", gap:12,
          position:"sticky", top:0, zIndex:100,
          borderBottom:`3px solid ${RA[user.role]||"#2471A3"}`,
          boxShadow:"0 1px 4px rgba(0,0,0,0.06)"
        }}>
          <button onClick={() => setOpen(!open)} style={{
            background:"none", border:"none", fontSize:24,
            cursor:"pointer", color:"#374151", flexShrink:0, padding:4
          }}>☰</button>

          <div style={{ flex:1, fontWeight:800, fontSize:18, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {cur==="invoices"&&user.role==="manager"?t.dcinvoices:t[cur]||cur}
          </div>

          {activeAlerts.length > 0 && (
            <button onClick={() => setPage("dashboard")} style={{
              background:"#fee2e2", border:"none", borderRadius:8,
              padding:"6px 14px", cursor:"pointer", fontSize:13,
              fontWeight:700, color:"#991b1b", whiteSpace:"nowrap"
            }}>
              🔔 {activeAlerts.length} {t.alerts}
            </button>
          )}

          <div style={{
            fontSize:13, fontWeight:700, color:"white",
            padding:"6px 14px", borderRadius:20,
            background:RA[user.role]||"#2471A3", whiteSpace:"nowrap",
            display:"flex", alignItems:"center", gap:6
          }}>
            {RI[user.role]} {t[user.role]||user.role}
            {user.dc&&user.dc!=="Head Office"&&(
              <span style={{ fontSize:14, fontWeight:700 }}>— {user.dc}</span>
            )}
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1, padding:"20px", overflowY:"auto", maxWidth:1400, width:"100%", margin:"0 auto", boxSizing:"border-box" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
