import { useState } from "react";
import { RC, RA, RI } from "../data/masterData.js";

const T = {
  en: {
    dashboard:"Dashboard",
    invoices:"All Invoices",
    dcinvoices:"DC Invoices",
    upload:"Invoice Processing",
    trips:"Trips",
    users:"User Management",
    masterdata:"System Configuration",
    fleet:"Fleet",
    fuel:"Fuel Tracking",
    reports:"Reports",
    download:"POD Management",
    assign:"Dispatch Management",
    mydeliveries:"Delivery Route",
    odometer:"Trip Log",
    search:"Search Invoices",
    alerts:"Alerts",
    logout:"Logout",
    admin:"System Administrator",
    planning:"Planning",
    manager:"Distribution Center Manager",
    driver:"Delivery Driver",
    viewonly:"View Only"
  },
  ar: {
    dashboard:"\u0644\u0648\u062d\u0629 \u0627\u0644\u0642\u064a\u0627\u062f\u0629",
    invoices:"\u062c\u0645\u064a\u0639 \u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631",
    dcinvoices:"\u0641\u0648\u0627\u062a\u064a\u0631 \u0627\u0644\u0645\u0631\u0643\u0632",
    upload:"\u0645\u0639\u0627\u0644\u062c\u0629 \u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631",
    trips:"\u0627\u0644\u0631\u062d\u0644\u0627\u062a",
    users:"\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646",
    masterdata:"\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0646\u0638\u0627\u0645",
    fleet:"\u0627\u0644\u0623\u0633\u0637\u0648\u0644",
    fuel:"\u062a\u062a\u0628\u0639 \u0627\u0644\u0648\u0642\u0648\u062f",
    reports:"\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631",
    download:"\u0625\u062f\u0627\u0631\u0629 \u0648\u062b\u0627\u0626\u0642 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    assign:"\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644",
    mydeliveries:"\u0645\u0633\u0627\u0631 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    odometer:"\u0633\u062c\u0644 \u0627\u0644\u0631\u062d\u0644\u0629",
    search:"\u0627\u0644\u0628\u062d\u062b \u0639\u0646 \u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631",
    alerts:"\u062a\u0646\u0628\u064a\u0647\u0627\u062a",
    logout:"\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c",
    admin:"\u0645\u062f\u064a\u0631 \u0627\u0644\u0646\u0638\u0627\u0645",
    planning:"\u0627\u0644\u062a\u062e\u0637\u064a\u0637",
    manager:"\u0645\u062f\u064a\u0631 \u0645\u0631\u0643\u0632 \u0627\u0644\u062a\u0648\u0632\u064a\u0639",
    driver:"\u0633\u0627\u0626\u0642 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    viewonly:"\u0639\u0631\u0636 \u0641\u0642\u0637"
  }
};

const NAV = {
  admin:   [["dashboard","\ud83d\udcca"],["invoices","\ud83d\udccb"],["upload","\ud83d\udce4"],["trips","\ud83d\udd04"],["users","\ud83d\udc65"],["masterdata","\u2699\ufe0f"],["fleet","\ud83d\ude97"],["fuel","\u26fd"],["reports","\ud83d\udcc8"],["download","\ud83d\udce5"]],
  planning:[["dashboard","\ud83d\udcca"],["upload","\ud83d\udce4"],["invoices","\ud83d\udccb"],["download","\ud83d\udce5"],["users","\ud83d\udc65"]],
  manager: [["dashboard","\ud83d\udcca"],["invoices","\ud83d\udccb"],["assign","\ud83d\ude9a"],["trips","\ud83d\udd04"],["fleet","\ud83d\ude97"],["fuel","\u26fd"],["reports","\ud83d\udcc8"],["users","\ud83d\udc65"]],
  driver:  [["mydeliveries","\ud83d\udce6"],["odometer","\ud83d\udd22"],["users","\ud83d\udc65"]],
  viewonly:[["search","\ud83d\udd0d"],["users","\ud83d\udc65"]],
};

export default function Shell({ user, lang, setLang, page, setPage, onLogout, children, alerts }) {
  const [open, setOpen] = useState(false);
  const rtl = lang === "ar";
  const t = T[lang] || T.en;
  const nav = NAV[user.role] || NAV.viewonly;
  const cur = nav.find(n => n[0] === page)?.[0] || nav[0][0];
  const activeAlerts = (alerts||[]).filter(a => a.status === "active" && (!user.dc || a.dc === user.dc));

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f1f5f9", direction:rtl?"rtl":"ltr", fontFamily:"'Segoe UI',sans-serif" }}>

      <aside style={{
        width:240, position:"fixed", height:"100vh", background:RC[user.role],
        display:"flex", flexDirection:"column", zIndex:200,
        transition:"transform 0.3s",
        transform:open?"translateX(0)":(rtl?"translateX(100%)":"translateX(-100%)"),
        [rtl?"right":"left"]:0, overflowY:"auto",
        boxShadow:"4px 0 20px rgba(0,0,0,0.3)"
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"18px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontSize:22 }}>\ud83d\ude9a</span>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:"white" }}>DeliverFlow</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:2 }}>SPCO</div>
          </div>
        </div>

        <nav style={{ flex:1, padding:"10px 8px" }}>
          {nav.map(([id, icon]) => (
            <button key={id} onClick={() => { setPage(id); setOpen(false); }}
              style={{
                width:"100%", background:cur===id?RA[user.role]+"33":"none",
                border:`1px solid ${cur===id?RA[user.role]:"transparent"}`,
                color:cur===id?"white":"rgba(255,255,255,0.6)",
                padding:"10px 12px", borderRadius:8, cursor:"pointer",
                textAlign:rtl?"right":"left", fontSize:13,
                display:"flex", alignItems:"center", gap:8, marginBottom:2,
                fontWeight:cur===id?600:400
              }}>
              <span style={{ fontSize:15, width:20, textAlign:"center" }}>{icon}</span>
              <span>{id==="invoices"&&user.role==="manager"?t.dcinvoices:t[id]||id}</span>
            </button>
          ))}
        </nav>

        <div style={{ display:"flex", gap:6, padding:"8px 16px" }}>
          {[["en","EN"],["ar","\u0639\u0631\u0628\u064a"]].map(([l,lbl]) => (
            <button key={l} onClick={() => setLang(l)}
              style={{ flex:1, border:"1px solid rgba(255,255,255,0.2)", background:lang===l?RA[user.role]:"none", color:lang===l?"white":"rgba(255,255,255,0.5)", borderRadius:6, padding:"5px 0", cursor:"pointer", fontSize:12, fontWeight:600 }}>
              {lbl}
            </button>
          ))}
        </div>

        <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:RA[user.role], display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14, color:"white", flexShrink:0 }}>
              {user.name.charAt(0)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"white", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.displayName||user.name}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{t[user.role]||user.role} {user.dc?"— "+user.dc:""}</div>
            </div>
          </div>
          <button onClick={onLogout}
            style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"none", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:12, padding:"8px", borderRadius:6 }}>
            {t.logout} \u2192
          </button>
        </div>
      </aside>

      {open && <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:199 }} />}

      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
        <header style={{ background:"white", padding:"14px 20px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:100, borderBottom:`3px solid ${RA[user.role]}`, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <button onClick={() => setOpen(!open)} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#374151", flexShrink:0 }}>\u2630</button>
          <div style={{ flex:1, fontWeight:800, fontSize:18, color:"#0f172a" }}>
            {cur==="invoices"&&user.role==="manager"?t.dcinvoices:t[cur]||cur}
          </div>
          {activeAlerts.length > 0 && (
            <button onClick={() => setPage("dashboard")}
              style={{ background:"#fee2e2", border:"none", borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:600, color:"#991b1b" }}>
              \ud83d\udd14 {activeAlerts.length} {t.alerts}
            </button>
          )}
          <div style={{ fontSize:12, fontWeight:700, color:"white", padding:"5px 12px", borderRadius:20, background:RA[user.role], whiteSpace:"nowrap" }}>
            {RI[user.role]} {t[user.role]||user.role}
          </div>
        </header>
        <main style={{ flex:1, padding:20, overflowY:"auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
