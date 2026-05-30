import { useState } from "react";
import { Card, CardTitle, StatCard } from "../components/Shared.jsx";

const T = {
  en: {
    welcome:"Welcome back", adminTitle:"Operations Overview — All Distribution Centers",
    planningTitle:"Upload & Invoice Overview", todaySummary:"Today's Summary",
    totalUploaded:"Total Invoices Uploaded", totalBatches:"Total Batches Posted",
    byDC:"Distribution Center Breakdown", byInstitution:"Institution Breakdown",
    govt:"Government", priv:"Private", pending:"Pending",
    delivered:"Delivered", assigned:"Assigned", failed:"Failed",
    outstanding:"Outstanding", inTransit:"In Transit", scheduled:"Scheduled",
    total:"Total", deliveryRate:"Delivery Rate", vehicleUtil:"Vehicle Utilization",
    driverUtil:"Driver Utilization", activeVeh:"Active Vehicles",
    totalVeh:"Total Vehicles", assignedDrv:"Assigned Drivers",
    totalDrv:"Total Drivers", alerts:"Active Alerts",
    riyadhDC:"Riyadh Distribution Center", jeddahDC:"Jeddah Distribution Center",
    dammamDC:"Dammam Distribution Center", allDC:"All Distribution Centers",
    howCalc:"How calculated", uploadedBy:"Uploaded by", postedAt:"Posted at",
    invoices:"invoices", batches:"batches today"
  },
  ar: {
    welcome:"\u0645\u0631\u062d\u0628\u0627\u064b \u0628\u0639\u0648\u062f\u062a\u0643",
    adminTitle:"\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629 \u0639\u0644\u0649 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a",
    planningTitle:"\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629 \u0639\u0644\u0649 \u0627\u0644\u0631\u0641\u0639 \u0648\u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631",
    todaySummary:"\u0645\u0644\u062e\u0635 \u0627\u0644\u064a\u0648\u0645",
    totalUploaded:"\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631 \u0627\u0644\u0645\u0631\u0641\u0648\u0639\u0629",
    totalBatches:"\u0625\u062c\u0645\u0627\u0644\u064a \u062f\u0641\u0639\u0627\u062a \u0627\u0644\u062a\u0631\u062d\u064a\u0644",
    byDC:"\u062a\u0648\u0632\u064a\u0639 \u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u062a\u0648\u0632\u064a\u0639",
    byInstitution:"\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062a",
    govt:"\u062d\u0643\u0648\u0645\u064a", priv:"\u062e\u0627\u0635",
    pending:"\u0645\u0639\u0644\u0642\u0629", delivered:"\u0645\u0633\u0644\u0645\u0629",
    assigned:"\u0645\u062e\u0635\u0635\u0629", failed:"\u0641\u0627\u0634\u0644\u0629",
    outstanding:"\u0645\u062a\u0623\u062e\u0631\u0629", inTransit:"\u0641\u064a \u0627\u0644\u0637\u0631\u064a\u0642",
    scheduled:"\u0645\u062c\u062f\u0648\u0644\u0629", total:"\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a",
    deliveryRate:"\u0645\u0639\u062f\u0644 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    vehicleUtil:"\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0645\u0631\u0643\u0628\u0627\u062a",
    driverUtil:"\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0633\u0627\u0626\u0642\u064a\u0646",
    activeVeh:"\u0645\u0631\u0643\u0628\u0627\u062a \u0646\u0634\u0637\u0629",
    totalVeh:"\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0631\u0643\u0628\u0627\u062a",
    assignedDrv:"\u0633\u0627\u0626\u0642\u0648\u0646 \u0645\u062e\u0635\u0635\u0648\u0646",
    totalDrv:"\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0633\u0627\u0626\u0642\u064a\u0646",
    alerts:"\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0646\u0634\u0637\u0629",
    riyadhDC:"\u0645\u0631\u0643\u0632 \u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0631\u064a\u0627\u0636",
    jeddahDC:"\u0645\u0631\u0643\u0632 \u062a\u0648\u0632\u064a\u0639 \u062c\u062f\u0629",
    dammamDC:"\u0645\u0631\u0643\u0632 \u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u062f\u0645\u0627\u0645",
    allDC:"\u062c\u0645\u064a\u0639 \u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u062a\u0648\u0632\u064a\u0639",
    howCalc:"\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062d\u0633\u0627\u0628",
    uploadedBy:"\u0631\u0641\u0639 \u0628\u0648\u0627\u0633\u0637\u0629",
    postedAt:"\u0648\u0642\u062a \u0627\u0644\u062a\u0631\u062d\u064a\u0644",
    invoices:"\u0641\u0648\u0627\u062a\u064a\u0631", batches:"\u062f\u0641\u0639\u0627\u062a \u0627\u0644\u064a\u0648\u0645"
  }
};

function dcLabel(dc, t) {
  if (dc === "Riyadh") return t.riyadhDC;
  if (dc === "Jeddah") return t.jeddahDC;
  if (dc === "Dammam") return t.dammamDC;
  return dc;
}

function DCBox({ dc, invoices, vehicles, t, color }) {
  const inv = invoices.filter(i => i.dc === dc);
  const countable = inv.filter(i => !["scheduled","hold_await","hold_ship","intransit"].includes(i.status));
  const del = inv.filter(i => i.status === "delivered").length;
  const rate = countable.length > 0 ? Math.round(del / countable.length * 100) : 0;
  const veh = vehicles.filter(v => v.dc === dc);
  const activeV = veh.filter(v => v.status === "Active").length;

  return (
    <Card style={{ borderTop:`4px solid ${color}` }}>
      <CardTitle style={{ color }}>{dcLabel(dc, t)}</CardTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:12 }}>
        {[
          { icon:"\ud83d\udccb", label:t.total, value:inv.length, color:"#6366f1" },
          { icon:"\u2705", label:t.delivered, value:del, color:"#10b981" },
          { icon:"\u23f3", label:t.pending, value:inv.filter(i=>i.status==="pending").length, color:"#f59e0b" },
          { icon:"\ud83d\ude9a", label:t.activeVeh, value:activeV, color:"#0891b2" },
        ].map((s,i) => <StatCard key={i} {...s} />)}
      </div>
      <div style={{ marginBottom:4, fontSize:13, display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontWeight:600 }}>{t.deliveryRate}</span>
        <span style={{ fontWeight:800, color:rate>=80?"#10b981":rate>=50?"#f59e0b":"#ef4444" }}>{rate}%</span>
      </div>
      <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
        <div style={{ width:`${rate}%`, height:"100%", background:rate>=80?"#10b981":rate>=50?"#f59e0b":"#ef4444", borderRadius:99 }} />
      </div>
      <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>{t.howCalc}: Delivered \u00f7 (Total - Scheduled) \u00d7 100</div>
    </Card>
  );
}

export default function Dashboard({ user, lang, invoices, vehicles, alerts, uploads }) {
  const rtl = lang === "ar";
  const t = T[lang] || T.en;
  const role = user.role;

  // ── PLANNING DASHBOARD ──
  if (role === "planning") {
    const today = new Date().toISOString().split("T")[0];
    const todayUploads = (uploads||[]).filter(u => u.date === today);
    const todayInvoices = invoices.filter(i => i.date === today);
    const totalInvoices = invoices.length;
    const totalBatches = (uploads||[]).length;

    const govTotal = invoices.filter(i => i.inst === "Government").length;
    const govDel = invoices.filter(i => i.inst === "Government" && i.status === "delivered").length;
    const privTotal = invoices.filter(i => i.inst === "Private").length;
    const privDel = invoices.filter(i => i.inst === "Private" && i.status === "delivered").length;

    return (
      <div style={{ direction: rtl ? "rtl" : "ltr" }}>
        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:22, fontWeight:900, color:"#0f172a", margin:"0 0 4px" }}>{t.welcome}, {user.displayName||user.name}!</h2>
          <p style={{ fontSize:14, color:"#64748b", margin:0 }}>{t.planningTitle}</p>
        </div>

        {/* Overall KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12, marginBottom:16 }}>
          <StatCard icon="\ud83d\udccb" label={t.totalUploaded} value={totalInvoices} color="#6366f1" />
          <StatCard icon="\ud83d\udce4" label={t.totalBatches} value={totalBatches} color="#7c3aed" />
          <StatCard icon="\ud83d\udcc5" label="Today Invoices" value={todayInvoices.length} color="#0891b2" />
          <StatCard icon="\ud83d\udce6" label={t.batches} value={todayUploads.length} color="#10b981" />
        </div>

        {/* Today's Summary */}
        <Card>
          <CardTitle>\ud83d\udcc5 {t.todaySummary}</CardTitle>
          {todayUploads.length === 0 && <div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>No uploads today yet</div>}
          {todayUploads.map(u => (
            <div key={u.batchId} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#6366f1" }}>{u.batchId}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{t.uploadedBy}: {u.uploadedBy} | {t.postedAt}: {u.postedAt}</div>
              </div>
              <span style={{ fontWeight:700, color:"#10b981" }}>{u.invoiceCount} {t.invoices}</span>
              <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99, background:"#d1fae5", color:"#065f46" }}>POSTED</span>
            </div>
          ))}
        </Card>

        {/* DC Breakdown */}
        <Card>
          <CardTitle>\ud83c\udfe2 {t.byDC}</CardTitle>
          {["Riyadh","Jeddah","Dammam"].map(dc => {
            const dcInv = invoices.filter(i => i.dc === dc);
            const dcDel = dcInv.filter(i => i.status === "delivered").length;
            return (
              <div key={dc} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:13 }}>
                  <span style={{ fontWeight:600 }}>\ud83d\udccd {dcLabel(dc, t)}</span>
                  <span style={{ color:"#64748b" }}>{dcDel}/{dcInv.length} {t.invoices}</span>
                </div>
                <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
                  <div style={{ width:`${dcInv.length>0?Math.round(dcDel/dcInv.length*100):0}%`, height:"100%", background:"#6366f1", borderRadius:99 }} />
                </div>
              </div>
            );
          })}
        </Card>

        {/* Institution Breakdown */}
        <Card>
          <CardTitle>\ud83c\udfe5 {t.byInstitution}</CardTitle>
          {[["Government","\ud83c\udfd9\ufe0f "+t.govt,"#1e40af",govTotal,govDel],["Private","\ud83c\udfe5 "+t.priv,"#6d28d9",privTotal,privDel]].map(([key,label,color,total,del]) => (
            <div key={key} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:13 }}>
                <span style={{ fontWeight:600 }}>{label}</span>
                <span style={{ color:"#64748b" }}>{del}/{total}</span>
              </div>
              <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
                <div style={{ width:`${total>0?Math.round(del/total*100):0}%`, height:"100%", background:color, borderRadius:99 }} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  // ── DRIVER DASHBOARD — redirect to deliveries ──
  if (role === "driver") {
    return (
      <div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>\ud83d\ude9a</div>
        <div style={{ fontSize:18, fontWeight:700, color:"#0f172a", marginBottom:8 }}>
          {t.welcome}, {user.displayName||user.name}!
        </div>
        <div style={{ fontSize:14 }}>Go to My Deliveries to start your route.</div>
      </div>
    );
  }

  // ── ADMIN / DC MANAGER DASHBOARD ──
  const dc = user.dc;
  const myInv = dc ? invoices.filter(i => i.dc === dc) : invoices;
  const myVeh = dc ? vehicles.filter(v => v.dc === dc) : vehicles;
  const myAlerts = (alerts||[]).filter(a => a.status === "active" && (!dc || a.dc === dc));

  const countable = myInv.filter(i => !["scheduled","hold_await","hold_ship","intransit"].includes(i.status));
  const del = myInv.filter(i => i.status === "delivered").length;
  const deliveryRate = countable.length > 0 ? Math.round(del / countable.length * 100) : 0;
  const activeV = myVeh.filter(v => v.status === "Active").length;
  const assignedD = myInv.filter(i => i.status === "assigned").length;

  return (
    <div style={{ direction: rtl ? "rtl" : "ltr" }}>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:"#0f172a", margin:"0 0 4px" }}>{t.welcome}, {user.displayName||user.name}!</h2>
        <p style={{ fontSize:14, color:"#64748b", margin:0 }}>{dc ? dcLabel(dc,t) : t.adminTitle}</p>
      </div>

      {/* Overall KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:12, marginBottom:16 }}>
        {[
          { icon:"\ud83d\udccb", label:t.total, value:myInv.length, color:"#6366f1" },
          { icon:"\u2705", label:t.delivered, value:del, color:"#10b981" },
          { icon:"\u23f3", label:t.pending, value:myInv.filter(i=>i.status==="pending").length, color:"#f59e0b" },
          { icon:"\ud83d\udc64", label:t.assigned, value:myInv.filter(i=>i.status==="assigned").length, color:"#3b82f6" },
          { icon:"\u274c", label:t.failed, value:myInv.filter(i=>i.status==="failed").length, color:"#ef4444" },
          { icon:"\u26a0\ufe0f", label:t.outstanding, value:myInv.filter(i=>i.status==="outstanding").length, color:"#f97316" },
          { icon:"\ud83d\ude9a", label:t.inTransit, value:myInv.filter(i=>i.status==="intransit").length, color:"#8b5cf6" },
          { icon:"\ud83d\udcc5", label:t.scheduled, value:myInv.filter(i=>["scheduled","hold_await","hold_ship"].includes(i.status)).length, color:"#a855f7" },
          { icon:"\ud83d\udd14", label:t.alerts, value:myAlerts.length, color:"#ef4444" },
        ].map((s,i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Overall Performance Box */}
      <Card style={{ borderTop:"4px solid #1A3A5C" }}>
        <CardTitle>\ud83d\udcca {t.allDC} — {t.deliveryRate}</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16 }}>
          <div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:4 }}>{t.deliveryRate}</div>
            <div style={{ fontSize:36, fontWeight:900, color:deliveryRate>=80?"#10b981":deliveryRate>=50?"#f59e0b":"#ef4444" }}>{deliveryRate}%</div>
            <div style={{ background:"#f1f5f9", borderRadius:99, height:10, overflow:"hidden", marginTop:6 }}>
              <div style={{ width:`${deliveryRate}%`, height:"100%", background:deliveryRate>=80?"#10b981":deliveryRate>=50?"#f59e0b":"#ef4444", borderRadius:99 }} />
            </div>
            <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>{t.howCalc}: Delivered \u00f7 (Total - Scheduled) \u00d7 100</div>
          </div>
          <div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:4 }}>{t.vehicleUtil}</div>
            <div style={{ fontSize:36, fontWeight:900, color:"#0891b2" }}>{myVeh.length>0?Math.round(activeV/myVeh.length*100):0}%</div>
            <div style={{ fontSize:12, color:"#64748b" }}>{activeV} / {myVeh.length} {t.activeVeh}</div>
            <div style={{ fontSize:11, color:"#94a3b8" }}>{t.howCalc}: Active \u00f7 Total \u00d7 100</div>
          </div>
          <div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:4 }}>{t.driverUtil}</div>
            <div style={{ fontSize:36, fontWeight:900, color:"#6366f1" }}>
              {myInv.filter(i=>i.driverId).length > 0 ? Math.min(100, Math.round(assignedD / Math.max(myInv.filter(i=>i.driverId).length,1) * 100)) : 0}%
            </div>
            <div style={{ fontSize:12, color:"#64748b" }}>{assignedD} {t.assignedDrv}</div>
            <div style={{ fontSize:11, color:"#94a3b8" }}>{t.howCalc}: Assigned \u00f7 Total Drivers \u00d7 100</div>
          </div>
        </div>
      </Card>

      {/* DC Boxes — Admin only */}
      {!dc && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
          <DCBox dc="Riyadh" invoices={invoices} vehicles={vehicles} t={t} color="#1A3A5C" />
          <DCBox dc="Jeddah" invoices={invoices} vehicles={vehicles} t={t} color="#0f766e" />
          <DCBox dc="Dammam" invoices={invoices} vehicles={vehicles} t={t} color="#7c3aed" />
        </div>
      )}

      {/* Alerts */}
      {myAlerts.length > 0 && (
        <Card style={{ borderLeft:"4px solid #ef4444" }}>
          <CardTitle>\ud83d\udd14 {t.alerts} ({myAlerts.length})</CardTitle>
          {myAlerts.slice(0,5).map(a => (
            <div key={a.id} style={{ padding:"8px 0", borderBottom:"1px solid #f1f5f9", fontSize:13 }}>
              <span style={{ fontWeight:600, color:"#ef4444" }}>{a.title}</span>
              <span style={{ color:"#64748b", marginLeft:8 }}>{a.desc}</span>
              <span style={{ color:"#94a3b8", fontSize:11, marginLeft:8 }}>{a.days}d ago</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
