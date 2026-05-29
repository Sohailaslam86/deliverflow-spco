import { useState } from "react";
import { Card, CardTitle, Badge, AgingBadge, Btn, StatCard } from "../components/Shared.jsx";
import { STATUS_STYLES, daysSince } from "../data/masterData.js";

const T = {
  en: {
    allInvoices: "All Invoices",
    overallPerformance: "Overall Performance — All Distribution Centers",
    distributionCenter: "Distribution Center",
    total: "Total", delivered: "Delivered", pending: "Pending",
    assigned: "Assigned", failed: "Failed", outstanding: "Outstanding", inTransit: "In Transit",
    deliveryRate: "Delivery Rate", backToAll: "← Back to All Invoices",
    showing: "Showing", invoices: "invoices", allStatus: "All Status",
    searchPlaceholder: "Search invoice # or customer...",
    howCalc: "Formula: Delivered ÷ Total × 100",
    noInvoices: "No invoices found",
    changeStatus: "Change Status (Admin)",
    institution: "Institution", storage: "Storage", vehicle: "Vehicle",
    attempts: "Attempts", assignedAt: "Assigned", deliveredAt: "Delivered",
    failReason: "Fail Reason", remarks: "Remarks", viewGPS: "View GPS Location →",
    age: "Age", days: "days",
  },
  ar: {
    allInvoices: "جميع الفواتير",
    overallPerformance: "الأداء الإجمالي — جميع مراكز التوزيع",
    distributionCenter: "مركز التوزيع",
    total: "الإجمالي", delivered: "تم التسليم", pending: "معلق",
    assigned: "تم التعيين", failed: "فشل", outstanding: "متأخر", inTransit: "في الطريق",
    deliveryRate: "معدل التسليم", backToAll: "→ العودة لجميع الفواتير",
    showing: "عرض", invoices: "فواتير", allStatus: "كل الحالات",
    searchPlaceholder: "بحث برقم الفاتورة أو اسم العميل...",
    howCalc: "المعادلة: المسلّمة ÷ الإجمالي × 100",
    noInvoices: "لا توجد فواتير",
    changeStatus: "تغيير الحالة (المدير)",
    institution: "المؤسسة", storage: "التخزين", vehicle: "المركبة",
    attempts: "المحاولات", assignedAt: "تاريخ التعيين", deliveredAt: "تاريخ التسليم",
    failReason: "سبب الفشل", remarks: "ملاحظات", viewGPS: "← عرض موقع التسليم",
    age: "العمر", days: "أيام",
  }
};

export default function Invoices({ user, invoices, setInvoices, lang }) {
  const t = T[lang] || T.en;
  const rtl = lang === "ar";
  const [search, setSearch]     = useState("");
  const [statusF, setStatusF]   = useState("all");
  const [expanded, setExpanded] = useState(null);
  // For drill-down: { dc, status }
  const [drillDown, setDrillDown] = useState(null);

  const managerDC = user.role === "manager" ? user.dc : null;

  // Overall stats
  const allInv = managerDC ? invoices.filter(i => i.dc === managerDC) : invoices;
  const overallStats = {
    total:       allInv.length,
    delivered:   allInv.filter(i => i.status === "delivered").length,
    pending:     allInv.filter(i => i.status === "pending").length,
    assigned:    allInv.filter(i => i.status === "assigned").length,
    failed:      allInv.filter(i => i.status === "failed").length,
    outstanding: allInv.filter(i => i.status === "outstanding").length,
    intransit:   allInv.filter(i => i.status === "intransit").length,
  };
  const overallRate = overallStats.total > 0 ? Math.round(overallStats.delivered / overallStats.total * 100) : 0;

  // DC breakdown stats
  const dcList = managerDC ? [managerDC] : ["Riyadh", "Jeddah", "Dammam"];
  const dcStats = dcList.map(dc => {
    const di = invoices.filter(i => i.dc === dc);
    const del = di.filter(i => i.status === "delivered").length;
    return {
      dc,
      color: dc === "Riyadh" ? "#ef4444" : dc === "Jeddah" ? "#3b82f6" : "#10b981",
      total: di.length,
      delivered: del,
      pending:     di.filter(i => i.status === "pending").length,
      assigned:    di.filter(i => i.status === "assigned").length,
      failed:      di.filter(i => i.status === "failed").length,
      outstanding: di.filter(i => i.status === "outstanding").length,
      intransit:   di.filter(i => i.status === "intransit").length,
      rate: di.length > 0 ? Math.round(del / di.length * 100) : 0,
    };
  });

  // Drill-down view
  if (drillDown) {
    const drillInvoices = invoices.filter(i => {
      const mDC = i.dc === drillDown.dc;
      const mS  = drillDown.status === "all" || i.status === drillDown.status;
      return mDC && mS;
    });
    const dcColor = drillDown.dc === "Riyadh" ? "#ef4444" : drillDown.dc === "Jeddah" ? "#3b82f6" : "#10b981";

    return (
      <div dir={rtl ? "rtl" : "ltr"}>
        {/* Back Button */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <button onClick={() => setDrillDown(null)}
            style={{ background:"#1A3A5C", color:"white", border:"none", padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600 }}>
            {t.backToAll}
          </button>
          <div style={{ fontWeight:700, fontSize:16, color:"#0f172a" }}>
            📍 {drillDown.dc} {t.distributionCenter}
            {drillDown.status !== "all" && (
              <span style={{ marginLeft:8 }}>
                <Badge status={drillDown.status} />
              </span>
            )}
          </div>
          <div style={{ fontSize:13, color:"#64748b" }}>{drillInvoices.length} {t.invoices}</div>
        </div>

        {drillInvoices.length === 0 && (
          <Card><div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>{t.noInvoices}</div></Card>
        )}

        {drillInvoices.map(inv => (
          <InvoiceRow key={inv.id} inv={inv} invoices={invoices} setInvoices={setInvoices} user={user} t={t} expanded={expanded} setExpanded={setExpanded} lang={lang} />
        ))}
      </div>
    );
  }

  // Main view — filter for list below
  const filtered = allInv.filter(i => {
    const mS = statusF === "all" || i.status === statusF;
    const mQ = !search || i.id.toLowerCase().includes(search.toLowerCase()) || i.customer.toLowerCase().includes(search.toLowerCase());
    return mS && mQ;
  });

  return (
    <div dir={rtl ? "rtl" : "ltr"}>
      {/* Overall Performance Box */}
      <Card style={{ borderTop:"4px solid #6366f1", marginBottom:16 }}>
        <CardTitle>📊 {t.overallPerformance}</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(90px,1fr))", gap:8, marginBottom:12 }}>
          {[
            { label:t.total,       value:overallStats.total,       color:"#6366f1", status:"all" },
            { label:t.delivered,   value:overallStats.delivered,   color:"#10b981", status:"delivered" },
            { label:t.pending,     value:overallStats.pending,     color:"#f59e0b", status:"pending" },
            { label:t.assigned,    value:overallStats.assigned,    color:"#3b82f6", status:"assigned" },
            { label:t.failed,      value:overallStats.failed,      color:"#ef4444", status:"failed" },
            { label:t.outstanding, value:overallStats.outstanding, color:"#f97316", status:"outstanding" },
            { label:t.inTransit,   value:overallStats.intransit,   color:"#8b5cf6", status:"intransit" },
          ].map(s => (
            <div key={s.label}
              onClick={() => setStatusF(s.status)}
              style={{ textAlign:"center", background: statusF === s.status ? s.color + "22" : "#f8fafc",
                border: statusF === s.status ? `1.5px solid ${s.color}` : "1.5px solid transparent",
                borderRadius:8, padding:"8px 4px", cursor:"pointer", transition:"all 0.2s" }}>
              <div style={{ fontWeight:800, fontSize:18, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:10, color:"#94a3b8" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ flex:1, background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
            <div style={{ width:`${overallRate}%`, height:"100%", background: overallRate >= 80 ? "#10b981" : overallRate >= 60 ? "#f59e0b" : "#ef4444", borderRadius:99 }} />
          </div>
          <span style={{ fontWeight:800, fontSize:16, color: overallRate >= 80 ? "#10b981" : overallRate >= 60 ? "#f59e0b" : "#ef4444" }}>{overallRate}%</span>
          <span style={{ fontSize:11, color:"#94a3b8" }}>{t.deliveryRate}</span>
        </div>
        <div style={{ fontSize:10, color:"#94a3b8", marginTop:4 }}>📐 {t.howCalc}</div>
      </Card>

      {/* Per Distribution Center Boxes — Clickable */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:12, marginBottom:16 }}>
        {dcStats.map(d => (
          <Card key={d.dc} style={{ borderLeft: rtl ? "none" : `4px solid ${d.color}`, borderRight: rtl ? `4px solid ${d.color}` : "none", marginBottom:0 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:10 }}>
              📍 {d.dc} {t.distributionCenter} — {d.total} {t.total}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:10 }}>
              {[
                { label:t.delivered,   value:d.delivered,   color:"#10b981", status:"delivered" },
                { label:t.pending,     value:d.pending,     color:"#f59e0b", status:"pending" },
                { label:t.assigned,    value:d.assigned,    color:"#3b82f6", status:"assigned" },
                { label:t.failed,      value:d.failed,      color:"#ef4444", status:"failed" },
                { label:t.outstanding, value:d.outstanding, color:"#f97316", status:"outstanding" },
                { label:t.inTransit,   value:d.intransit,   color:"#8b5cf6", status:"intransit" },
              ].map(s => (
                <div key={s.label}
                  onClick={() => setDrillDown({ dc:d.dc, status:s.status })}
                  style={{ textAlign:"center", background:"#f8fafc", borderRadius:6, padding:"8px 4px",
                    cursor:"pointer", border:"1px solid transparent",
                    transition:"all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.border = `1px solid ${s.color}`}
                  onMouseLeave={e => e.currentTarget.style.border = "1px solid transparent"}>
                  <div style={{ fontWeight:800, fontSize:18, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:9, color:"#94a3b8" }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Rate bar */}
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ flex:1, background:"#f1f5f9", borderRadius:99, height:6, overflow:"hidden" }}>
                <div style={{ width:`${d.rate}%`, height:"100%", background:d.color, borderRadius:99 }} />
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:d.color }}>{d.rate}%</span>
            </div>
            <div style={{ textAlign:"center", marginTop:8 }}>
              <button onClick={() => setDrillDown({ dc:d.dc, status:"all" })}
                style={{ background:"none", border:`1px solid ${d.color}`, color:d.color, borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                {lang === "ar" ? "عرض الكل ←" : "View All →"}
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          style={{ flex:1, minWidth:180, border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none" }} />
        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:13, outline:"none", background:"white" }}>
          <option value="all">{t.allStatus}</option>
          {Object.entries(STATUS_STYLES).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
      </div>

      <div style={{ fontSize:13, color:"#94a3b8", marginBottom:10 }}>{filtered.length} {t.invoices}</div>

      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>{t.noInvoices}</div>
      )}

      {filtered.map(inv => (
        <InvoiceRow key={inv.id} inv={inv} invoices={invoices} setInvoices={setInvoices} user={user} t={t} expanded={expanded} setExpanded={setExpanded} lang={lang} />
      ))}
    </div>
  );
}

function InvoiceRow({ inv, invoices, setInvoices, user, t, expanded, setExpanded, lang }) {
  const rtl = lang === "ar";
  const days = daysSince(inv.date);

  function updateStatus(id, status) {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  }

  return (
    <Card style={{ marginBottom:8, cursor:"pointer" }}>
      <div onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}
        style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ fontWeight:700, fontSize:13, color:"#6366f1" }}>{inv.id}</span>
            <Badge status={inv.status} />
            <AgingBadge days={days} />
            {inv.uploadBatch && <span style={{ fontSize:10, color:"#94a3b8", background:"#f1f5f9", padding:"2px 6px", borderRadius:4 }}>{inv.uploadBatch}</span>}
          </div>
          <div style={{ fontWeight:600, fontSize:14, color:"#0f172a", marginBottom:2 }}>{inv.customer}</div>
          <div style={{ fontSize:12, color:"#64748b" }}>
            📍 {inv.dc} {t.distributionCenter} → {inv.city} |
            📅 {inv.date} |
            <span style={{ color: inv.inst === "Government" ? "#1e40af" : "#6d28d9" }}>
              {" "}{inv.inst === "Government" ? "🏛️ Govt" : "🏥 Private"}
            </span>
            {inv.dtype && <span> | {inv.dtype === "incity" ? "🏙️ In-City" : "🛣️ Out-City"}</span>}
          </div>
        </div>
        <span style={{ fontSize:18, color:"#94a3b8" }}>{expanded === inv.id ? "▲" : "▼"}</span>
      </div>

      {expanded === inv.id && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid #f1f5f9" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:8, fontSize:13, color:"#374151", marginBottom:12 }}>
            <div>🌡️ <b>{t.storage}:</b> {inv.storage}</div>
            <div>🚗 <b>{t.vehicle}:</b> {inv.vehicle || (lang === "ar" ? "غير محدد" : "Not assigned")}</div>
            <div>⏱️ <b>{t.age}:</b> {days} {t.days}</div>
            {inv.attempts > 0 && <div>🔄 <b>{t.attempts}:</b> {inv.attempts}</div>}
            {inv.assignedAt && <div>🕐 <b>{t.assignedAt}:</b> {inv.assignedAt}</div>}
            {inv.deliveredAt && <div>✅ <b>{t.deliveredAt}:</b> {inv.deliveredAt}</div>}
            {inv.failReason && <div>❌ <b>{t.failReason}:</b> {inv.failReason}</div>}
            {inv.remarks && <div>💬 <b>{t.remarks}:</b> {inv.remarks}</div>}
          </div>
          {inv.podImage && inv.podImage !== "demo_pod" && (
            <img src={inv.podImage} alt="POD" style={{ display:"block", marginBottom:12, width:140, height:100, objectFit:"cover", borderRadius:8, border:"2px solid #e2e8f0" }} />
          )}
          {inv.gps && (
            <a href={`https://maps.google.com/?q=${inv.gps.lat},${inv.gps.lng}`} target="_blank" rel="noreferrer"
              style={{ display:"inline-block", marginBottom:12, fontSize:12, color:"#6366f1", fontWeight:600 }}>
              📍 {t.viewGPS}
            </a>
          )}
          {user.role === "admin" && (
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>{t.changeStatus}:</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {Object.entries(STATUS_STYLES).map(([k, v]) => (
                  <button key={k} onClick={() => updateStatus(inv.id, k)}
                    style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${v.c}`,
                      background: inv.status === k ? v.bg : "white",
                      color:v.c, cursor:"pointer", fontSize:12, fontWeight:600 }}>
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
