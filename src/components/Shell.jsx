// src/components/Shell.jsx
import { useState } from "react";
import { RC, RA, RI } from "../data/masterData.js";

const NAV = {
  admin: [
    ["dashboard","📊","Dashboard"],
    ["invoices","📋","All Invoices"],
    ["upload","📤","Upload & Post"],
    ["trips","🔄","Trips"],
    ["users","👥","User Management"],
    ["requests","📝","Access Requests"],
    ["masterdata","⚙️","Master Data"],
    ["fleet","🚗","Fleet"],
    ["fuel","⛽","Fuel Tracking"],
    ["reports","📈","Reports"],
  ],
  planning: [
    ["dashboard","📊","Dashboard"],
    ["upload","📤","Upload & Post"],
    ["invoices","📋","All Invoices"],
    ["download","📥","Download PODs"],
    ["requests","📝","Access Requests"],
  ],
  manager: [
    ["dashboard","📊","Dashboard"],
    ["invoices","📋","DC Invoices"],
    ["assign","👤","Assign Drivers"],
    ["trips","🔄","Trips"],
    ["fleet","🚗","Fleet"],
    ["fuel","⛽","Fuel Tracking"],
    ["reports","📈","Reports"],
    ["requests","📝","Access Requests"],
  ],
  driver: [
    ["mydeliveries","📦","My Deliveries"],
    ["odometer","🔢","Daily Mileage Record"],
    ["requests","📝","Access Requests"],
  ],
  viewonly: [
    ["search","🔍","Search Invoices"],
    ["dashboard","📊","Dashboard"],
    ["requests","📝","Access Requests"],
  ],
};

export default function Shell({ user, lang, setLang, page, setPage, onLogout, children, alerts }) {
  const [sidebarOpen, setSidebar] = useState(false);
  const rtl = lang === "ar";
  const navItems = NAV[user.role] || NAV.viewonly;
  const pageLabel = navItems.find(n => n[0] === page)?.[2] || "Dashboard";
  const activeAlerts = (alerts||[]).filter(a => a.status==="active" && (!user.dc || a.dc===user.dc));

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f1f5f9",
      direction:rtl?"rtl":"ltr", fontFamily:"'Segoe UI',sans-serif" }}>

      {/* Sidebar */}
      <aside style={{
        width:240, position:"fixed", height:"100vh", background:RC[user.role],
        display:"flex", flexDirection:"column", zIndex:200,
        transition:"transform 0.3s",
        transform: sidebarOpen ? "translateX(0)" : (rtl?"translateX(100%)":"translateX(-100%)"),
        [rtl?"right":"left"]:0, overflowY:"auto",
        boxShadow:"4px 0 20px rgba(0,0,0,0.3)"
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10,
          padding:"18px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontSize:22 }}>🚚</span>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:"white" }}>DeliverFlow</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:2 }}>SPCO</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"10px 8px" }}>
          {navItems.map(([id, icon, label]) => (
            <button key={id}
              onClick={() => { setPage(id); setSidebar(false); }}
              style={{
                width:"100%", background:page===id?RA[user.role]+"33":"none",
                border:`1px solid ${page===id?RA[user.role]:"transparent"}`,
                color:page===id?"white":"rgba(255,255,255,0.6)",
                padding:"10px 12px", borderRadius:8, cursor:"pointer",
                textAlign:"left", fontSize:13, display:"flex",
                alignItems:"center", gap:8, marginBottom:2,
                fontWeight:page===id?600:400
              }}>
              <span style={{ fontSize:15, width:20, textAlign:"center" }}>{icon}</span>
              <span>{label}</span>
              {id==="requests" && activeAlerts.filter(a=>a.type==="access_request").length>0 && (
                <span style={{ marginLeft:"auto", background:"#ef4444", color:"white",
                  borderRadius:"50%", width:18, height:18, fontSize:10,
                  display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>
                  {activeAlerts.filter(a=>a.type==="access_request").length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Language */}
        <div style={{ display:"flex", gap:6, padding:"8px 16px" }}>
          {[["en","EN"],["ar","عربي"]].map(([l,lbl]) => (
            <button key={l} onClick={() => setLang(l)}
              style={{ flex:1, border:"1px solid rgba(255,255,255,0.2)",
                background:lang===l?RA[user.role]:"none",
                color:lang===l?"white":"rgba(255,255,255,0.5)",
                borderRadius:6, padding:"5px 0", cursor:"pointer",
                fontSize:12, fontWeight:600 }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* User Info */}
        <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:36, height:36, borderRadius:"50%",
              background:RA[user.role], display:"flex", alignItems:"center",
              justifyContent:"center", fontWeight:700, fontSize:14,
              color:"white", flexShrink:0 }}>
              {user.name.charAt(0)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"white",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user.displayName||user.name}
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>
                {user.role} — {user.dc||user.location}
              </div>
            </div>
          </div>
          <button onClick={onLogout}
            style={{ width:"100%", background:"rgba(255,255,255,0.08)",
              border:"none", color:"rgba(255,255,255,0.5)", cursor:"pointer",
              fontSize:12, padding:"8px", borderRadius:6 }}>
            {rtl ? "← تسجيل الخروج" : "Logout →"}
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebar(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:199 }} />
      )}

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
        {/* Topbar */}
        <header style={{ background:"white", padding:"14px 20px",
          display:"flex", alignItems:"center", gap:12,
          position:"sticky", top:0, zIndex:100,
          borderBottom:`3px solid ${RA[user.role]}`,
          boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <button onClick={() => setSidebar(!sidebarOpen)}
            style={{ background:"none", border:"none", fontSize:22,
              cursor:"pointer", color:"#374151", flexShrink:0 }}>
            ☰
          </button>
          <div style={{ flex:1, fontWeight:800, fontSize:18, color:"#0f172a" }}>
            {pageLabel}
          </div>
          {/* Active alerts indicator */}
          {activeAlerts.length > 0 && (
            <button onClick={() => setPage("dashboard")}
              style={{ background:"#fee2e2", border:"none", borderRadius:8,
                padding:"5px 12px", cursor:"pointer", fontSize:12,
                fontWeight:600, color:"#991b1b" }}>
              🔔 {activeAlerts.length} Alert{activeAlerts.length>1?"s":""}
            </button>
          )}
          <div style={{ fontSize:12, fontWeight:700, color:"white",
            padding:"5px 12px", borderRadius:20, background:RA[user.role],
            whiteSpace:"nowrap" }}>
            {RI[user.role]} {user.role}
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1, padding:20, overflowY:"auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
