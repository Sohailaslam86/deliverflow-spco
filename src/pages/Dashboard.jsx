// src/pages/Dashboard.jsx - v2 Complete with Arabic
import { useState } from "react";
import { Card, CardTitle, StatCard, Badge, AgingBadge, SectionTitle, Btn, Modal, Select, Textarea } from "../components/Shared.jsx";
import { daysSince, ALERT_DISMISS_REASONS } from "../data/masterData.js";

const T = {
  en: {
    dashboard: "Dashboard",
    totalInvoices: "Total Invoices",
    delivered: "Delivered",
    pending: "Pending",
    assigned: "Assigned",
    failed: "Failed",
    outstanding: "Outstanding",
    inTransit: "In Transit",
    activeVehicles: "Active Vehicles",
    activeDrivers: "Active Drivers",
    deliveryRate: "Delivery Rate",
    vehicleUtil: "Vehicle Utilization",
    driverUtil: "Driver Utilization",
    dcOverview: "Distribution Center Overview",
    overallPerformance: "Overall Performance — All DCs",
    systemAlerts: "System Alerts & Notifications",
    alertCategories: { all:"All", vehicle:"Vehicle", driver:"Driver", delivery:"Delivery", maintenance:"Maintenance", access:"Access" },
    alertTypes: { vehicle:"🚗 Vehicle", driver:"👤 Driver", delivery:"📦 Delivery", maintenance:"🔧 Maintenance", access:"🔑 Access" },
    resolve: "Resolve",
    dismiss: "Action",
    tentativeDate: "Tentative Closure Date",
    reason: "Reason",
    submitAction: "Submit Action",
    cancel: "Cancel",
    daysAgo: "days ago",
    noAction: "No action taken",
    agingReport: "Invoice Aging Report",
    fresh: "Fresh",
    aging: "Aging",
    critical: "Critical",
    todaySummary: "Today's Summary",
    institution: "Institution Breakdown",
    government: "Government",
    private: "Private",
    howCalc: "How calculated",
    deliveryRateFormula: "Delivered ÷ Total × 100",
    vehicleUtilFormula: "Active Vehicles ÷ Total Vehicles × 100",
    driverUtilFormula: "Assigned Drivers ÷ Total Drivers × 100",
    inMaint: "in maintenance",
    onLeave: "on leave",
  },
  ar: {
    dashboard: "لوحة التحكم",
    totalInvoices: "إجمالي الفواتير",
    delivered: "تم التسليم",
    pending: "معلق",
    assigned: "تم التعيين",
    failed: "فشل",
    outstanding: "متأخر",
    inTransit: "في الطريق",
    activeVehicles: "المركبات النشطة",
    activeDrivers: "السائقون النشطون",
    deliveryRate: "معدل التسليم",
    vehicleUtil: "استخدام المركبات",
    driverUtil: "استخدام السائقين",
    dcOverview: "نظرة عامة على مراكز التوزيع",
    overallPerformance: "الأداء الإجمالي — جميع المستودعات",
    systemAlerts: "تنبيهات النظام والإشعارات",
    alertCategories: { all:"الكل", vehicle:"مركبة", driver:"سائق", delivery:"توصيل", maintenance:"صيانة", access:"وصول" },
    alertTypes: { vehicle:"🚗 مركبة", driver:"👤 سائق", delivery:"📦 توصيل", maintenance:"🔧 صيانة", access:"🔑 وصول" },
    resolve: "حل",
    dismiss: "إجراء",
    tentativeDate: "تاريخ الإغلاق المتوقع",
    reason: "السبب",
    submitAction: "تأكيد الإجراء",
    cancel: "إلغاء",
    daysAgo: "أيام مضت",
    noAction: "لم يتخذ إجراء",
    agingReport: "تقرير أعمار الفواتير",
    fresh: "جديد",
    aging: "متأخر",
    critical: "حرج",
    todaySummary: "ملخص اليوم",
    institution: "تصنيف حسب المؤسسة",
    government: "حكومي",
    private: "خاص",
    howCalc: "طريقة الحساب",
    deliveryRateFormula: "المسلّمة ÷ الإجمالي × 100",
    vehicleUtilFormula: "المركبات النشطة ÷ إجمالي المركبات × 100",
    driverUtilFormula: "السائقون المعيّنون ÷ إجمالي السائقين × 100",
    inMaint: "في الصيانة",
    onLeave: "في إجازة",
  }
};

export default function Dashboard({ user, invoices, vehicles, alerts, setAlerts, users, lang }) {
  const t = T[lang] || T.en;
  const rtl = lang === "ar";
  const dc = user.dc;

  const myInvoices = dc ? invoices.filter(i => i.dc === dc) : invoices;
  const myVehicles = dc ? vehicles.filter(v => v.dc === dc) : vehicles;
  const myAlerts   = dc ? alerts.filter(a => a.dc === dc && a.status === "active") : alerts.filter(a => a.status === "active");
  const myDrivers  = users.filter(u => u.role === "driver" && (!dc || u.dc === dc));

  const stats = {
    total:       myInvoices.length,
    delivered:   myInvoices.filter(i => i.status === "delivered").length,
    pending:     myInvoices.filter(i => i.status === "pending").length,
    assigned:    myInvoices.filter(i => i.status === "assigned").length,
    failed:      myInvoices.filter(i => i.status === "failed").length,
    outstanding: myInvoices.filter(i => i.status === "outstanding").length,
    intransit:   myInvoices.filter(i => i.status === "intransit").length,
  };

  const activeVehicles = myVehicles.filter(v => v.status === "Active").length;
  const maintVehicles  = myVehicles.filter(v => v.status === "Maintenance").length;
  const assignedDrivers = myDrivers.filter(u => u.status === "Active").length;

  const deliveryRate = stats.total > 0 ? Math.round(stats.delivered / stats.total * 100) : 0;
  const vehicleUtil  = myVehicles.length > 0 ? Math.round(activeVehicles / myVehicles.length * 100) : 0;
  const driverUtil   = myDrivers.length > 0 ? Math.round(assignedDrivers / myDrivers.length * 100) : 0;

  // DC breakdown
  const dcStats = ["Riyadh", "Jeddah", "Dammam"].map(d => {
    const di = invoices.filter(i => i.dc === d);
    const dv = vehicles.filter(v => v.dc === d);
    const dd = users.filter(u => u.role === "driver" && u.dc === d);
    const del = di.filter(i => i.status === "delivered").length;
    const activeV = dv.filter(v => v.status === "Active").length;
    const activeD = dd.filter(u => u.status === "Active").length;
    return {
      dc: d,
      color: d === "Riyadh" ? "#ef4444" : d === "Jeddah" ? "#3b82f6" : "#10b981",
      total: di.length,
      delivered: del,
      pending: di.filter(i => i.status === "pending").length,
      assigned: di.filter(i => i.status === "assigned").length,
      failed: di.filter(i => i.status === "failed").length,
      outstanding: di.filter(i => i.status === "outstanding").length,
      intransit: di.filter(i => i.status === "intransit").length,
      deliveryRate: di.length > 0 ? Math.round(del / di.length * 100) : 0,
      activeVehicles: activeV,
      totalVehicles: dv.length,
      maintVehicles: dv.filter(v => v.status === "Maintenance").length,
      vehicleUtil: dv.length > 0 ? Math.round(activeV / dv.length * 100) : 0,
      totalDrivers: dd.length,
      activeDrivers: activeD,
      driverUtil: dd.length > 0 ? Math.round(activeD / dd.length * 100) : 0,
      dcAlerts: alerts.filter(a => a.dc === d && a.status === "active").length,
    };
  });

  const agingInvoices = myInvoices
    .filter(i => ["pending", "assigned", "outstanding"].includes(i.status))
    .map(i => ({ ...i, days: daysSince(i.date) }))
    .sort((a, b) => b.days - a.days);

  return (
    <div dir={rtl ? "rtl" : "ltr"}>
      {/* Overall Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10, marginBottom:16 }}>
        <StatCard icon="📋" label={t.totalInvoices}   value={stats.total}       color="#6366f1" />
        <StatCard icon="✅" label={t.delivered}       value={stats.delivered}   color="#10b981" sub={deliveryRate + "%"} />
        <StatCard icon="⏳" label={t.pending}         value={stats.pending}     color="#f59e0b" />
        <StatCard icon="🔵" label={t.assigned}        value={stats.assigned}    color="#3b82f6" />
        <StatCard icon="❌" label={t.failed}          value={stats.failed}      color="#ef4444" />
        <StatCard icon="🟠" label={t.outstanding}     value={stats.outstanding} color="#f97316" />
        <StatCard icon="🔄" label={t.inTransit}       value={stats.intransit}   color="#8b5cf6" />
        <StatCard icon="🚗" label={t.activeVehicles}  value={activeVehicles}    color="#0891b2" sub={maintVehicles > 0 ? maintVehicles + " " + t.inMaint : ""} />
        <StatCard icon="👤" label={t.activeDrivers}   value={assignedDrivers}   color="#059669" />
      </div>

      {/* Performance KPIs */}
      <Card>
        <CardTitle>📊 {t.overallPerformance}</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
          {[
            { label: t.deliveryRate,  value: deliveryRate,  formula: t.deliveryRateFormula,  color:"#10b981", icon:"📦" },
            { label: t.vehicleUtil,   value: vehicleUtil,   formula: t.vehicleUtilFormula,   color:"#0891b2", icon:"🚗" },
            { label: t.driverUtil,    value: driverUtil,    formula: t.driverUtilFormula,    color:"#6366f1", icon:"👤" },
          ].map(kpi => (
            <div key={kpi.label} style={{ background:"#f8fafc", borderRadius:10, padding:14, borderTop:`3px solid ${kpi.color}` }}>
              <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>{kpi.icon} {kpi.label}</div>
              <div style={{ fontWeight:900, fontSize:28, color:kpi.color, marginBottom:6 }}>{kpi.value}%</div>
              <div style={{ background:"#e2e8f0", borderRadius:99, height:6, overflow:"hidden", marginBottom:6 }}>
                <div style={{ width:`${kpi.value}%`, height:"100%", background:kpi.color, borderRadius:99 }} />
              </div>
              <div style={{ fontSize:10, color:"#94a3b8" }}>
                <span style={{ fontWeight:600 }}>📐 {t.howCalc}:</span> {kpi.formula}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* DC Breakdown - Admin Only */}
      {user.role === "admin" && (
        <>
          <SectionTitle>📍 {t.dcOverview}</SectionTitle>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:12, marginBottom:16 }}>
            {dcStats.map(d => (
              <DCCard key={d.dc} d={d} t={t} rtl={rtl} />
            ))}
          </div>
        </>
      )}

      {/* Alerts Panel */}
      {myAlerts.length > 0 && (
        <AlertsPanel alerts={myAlerts} setAlerts={setAlerts} user={user} t={t} rtl={rtl} />
      )}

      {/* Invoice Aging */}
      {agingInvoices.length > 0 && (
        <Card>
          <CardTitle>⏱️ {t.agingReport}</CardTitle>
          <div style={{ display:"flex", gap:16, marginBottom:12, flexWrap:"wrap" }}>
            {[
              { label: `🟢 ${t.fresh} (≤1d)`,  count: agingInvoices.filter(i => i.days <= 1).length,              color:"#10b981" },
              { label: `🟡 ${t.aging} (2-3d)`, count: agingInvoices.filter(i => i.days > 1 && i.days <= 3).length, color:"#f59e0b" },
              { label: `🔴 ${t.critical} (4+d)`,count: agingInvoices.filter(i => i.days > 3).length,               color:"#ef4444" },
            ].map(s => (
              <div key={s.label} style={{ fontSize:13, fontWeight:600, color:s.color }}>{s.label}: <b>{s.count}</b></div>
            ))}
          </div>
          {agingInvoices.slice(0, 8).map(inv => (
            <div key={inv.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
              <span style={{ fontWeight:700, fontSize:13, color:"#6366f1", minWidth:130 }}>{inv.id}</span>
              <span style={{ flex:1, fontSize:13, minWidth:140 }}>{inv.customer}</span>
              <span style={{ fontSize:12, color:"#64748b" }}>{inv.dc} DC</span>
              <Badge status={inv.status} />
              <AgingBadge days={inv.days} />
            </div>
          ))}
        </Card>
      )}

      {/* Today Summary + Institution */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:12 }}>
        <Card>
          <CardTitle>📊 {t.todaySummary}</CardTitle>
          {[
            { icon:"📋", text: `${myInvoices.length} ${lang === "ar" ? "فاتورة إجمالية" : "total invoices"}` },
            { icon:"✅", text: `${stats.delivered} ${lang === "ar" ? "تم تسليمها" : "delivered"} (${deliveryRate}%)` },
            { icon:"🔄", text: `${stats.intransit} ${lang === "ar" ? "في الطريق" : "in transit"}` },
            { icon:"⏳", text: `${stats.pending} ${lang === "ar" ? "بانتظار التعيين" : "awaiting assignment"}` },
            { icon:"🚗", text: `${activeVehicles} ${lang === "ar" ? "مركبة نشطة" : "vehicles active"}, ${maintVehicles} ${t.inMaint}` },
          ].map((s, i) => (
            <div key={i} style={{ display:"flex", gap:8, padding:"7px 0", borderBottom:"1px solid #f1f5f9", fontSize:13, color:"#374151" }}>
              <span>{s.icon}</span><span>{s.text}</span>
            </div>
          ))}
        </Card>
        <Card>
          <CardTitle>🏭 {t.institution}</CardTitle>
          {[
            { label: t.government, key:"Government", color:"#1e40af" },
            { label: t.private,    key:"Private",    color:"#6d28d9" },
          ].map(inst => {
            const n = myInvoices.filter(i => i.inst === inst.key).length;
            const d = myInvoices.filter(i => i.inst === inst.key && i.status === "delivered").length;
            const rate = n > 0 ? Math.round(d / n * 100) : 0;
            return (
              <div key={inst.key} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:13 }}>
                  <span style={{ fontWeight:600 }}>{inst.key === "Government" ? "🏛️" : "🏥"} {inst.label}</span>
                  <span style={{ color:"#64748b" }}>{d}/{n} — {rate}%</span>
                </div>
                <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
                  <div style={{ width:`${rate}%`, height:"100%", background:inst.color, borderRadius:99 }} />
                </div>
                <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>
                  📐 {t.howCalc}: {lang === "ar" ? "المسلّمة ÷ الإجمالي × 100" : "Delivered ÷ Total × 100"}
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

// ── DC Card ──────────────────────────────────────────────
function DCCard({ d, t, rtl }) {
  const [showFormula, setShowFormula] = useState(false);
  return (
    <Card style={{ borderLeft: rtl ? "none" : `4px solid ${d.color}`, borderRight: rtl ? `4px solid ${d.color}` : "none", marginBottom:0 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontWeight:700, fontSize:15 }}>📍 {d.dc} DC</div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {d.dcAlerts > 0 && <span style={{ background:"#fee2e2", color:"#991b1b", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99 }}>🔔 {d.dcAlerts}</span>}
          <button onClick={() => setShowFormula(!showFormula)} style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:6, padding:"3px 8px", cursor:"pointer", fontSize:11, color:"#64748b" }}>
            📐 {t.howCalc}
          </button>
        </div>
      </div>

      {showFormula && (
        <div style={{ background:"#f0f9ff", borderRadius:8, padding:"10px 12px", fontSize:11, color:"#0369a1", marginBottom:10 }}>
          <div>📦 {t.deliveryRateFormula}: {d.delivered}/{d.total} = <b>{d.deliveryRate}%</b></div>
          <div>🚗 {t.vehicleUtilFormula}: {d.activeVehicles}/{d.totalVehicles} = <b>{d.vehicleUtil}%</b></div>
          <div>👤 {t.driverUtilFormula}: {d.activeDrivers}/{d.totalDrivers} = <b>{d.driverUtil}%</b></div>
        </div>
      )}

      {/* Delivery Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:10 }}>
        {[
          { label: t.delivered,    value: d.delivered,   color:"#10b981" },
          { label: t.pending,      value: d.pending,     color:"#f59e0b" },
          { label: t.assigned,     value: d.assigned,    color:"#3b82f6" },
          { label: t.failed,       value: d.failed,      color:"#ef4444" },
          { label: t.outstanding,  value: d.outstanding, color:"#f97316" },
          { label: t.inTransit,    value: d.intransit,   color:"#8b5cf6" },
        ].map(s => (
          <div key={s.label} style={{ textAlign:"center", background:"#f8fafc", borderRadius:6, padding:"6px 4px" }}>
            <div style={{ fontWeight:800, fontSize:16, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:9, color:"#94a3b8" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Delivery Rate Bar */}
      <div style={{ marginBottom:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748b", marginBottom:3 }}>
          <span>📦 {t.deliveryRate}</span>
          <span style={{ fontWeight:700, color: d.deliveryRate >= 80 ? "#10b981" : d.deliveryRate >= 60 ? "#f59e0b" : "#ef4444" }}>{d.deliveryRate}%</span>
        </div>
        <div style={{ background:"#f1f5f9", borderRadius:99, height:6, overflow:"hidden" }}>
          <div style={{ width:`${d.deliveryRate}%`, height:"100%", background: d.deliveryRate >= 80 ? "#10b981" : d.deliveryRate >= 60 ? "#f59e0b" : "#ef4444", borderRadius:99 }} />
        </div>
      </div>

      {/* Vehicle Utilization */}
      <div style={{ marginBottom:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748b", marginBottom:3 }}>
          <span>🚗 {t.vehicleUtil} ({d.activeVehicles}/{d.totalVehicles})</span>
          <span style={{ fontWeight:700, color:"#0891b2" }}>{d.vehicleUtil}%</span>
        </div>
        <div style={{ background:"#f1f5f9", borderRadius:99, height:6, overflow:"hidden" }}>
          <div style={{ width:`${d.vehicleUtil}%`, height:"100%", background:"#0891b2", borderRadius:99 }} />
        </div>
        {d.maintVehicles > 0 && <div style={{ fontSize:10, color:"#f59e0b", marginTop:2 }}>🔧 {d.maintVehicles} {t.inMaint}</div>}
      </div>

      {/* Driver Utilization */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748b", marginBottom:3 }}>
          <span>👤 {t.driverUtil} ({d.activeDrivers}/{d.totalDrivers})</span>
          <span style={{ fontWeight:700, color:"#6366f1" }}>{d.driverUtil}%</span>
        </div>
        <div style={{ background:"#f1f5f9", borderRadius:99, height:6, overflow:"hidden" }}>
          <div style={{ width:`${d.driverUtil}%`, height:"100%", background:"#6366f1", borderRadius:99 }} />
        </div>
      </div>
    </Card>
  );
}

// ── Alerts Panel ─────────────────────────────────────────────
function AlertsPanel({ alerts, setAlerts, user, t, rtl }) {
  const [activeTab, setActiveTab]     = useState("all");
  const [dismissing, setDismissing]   = useState(null);
  const [dismissForm, setDismissForm] = useState({ reason:"", manualReason:"", tentativeDate:"" });

  const categories = ["all", "vehicle", "driver", "delivery", "maintenance", "access"];

  const alertTypeMap = {
    undelivered:      "delivery",
    license_expiry:   "driver",
    fahas:            "vehicle",
    istimara:         "vehicle",
    insurance:        "vehicle",
    oil_change:       "maintenance",
    access_request:   "access",
    fuel_discrepancy: "vehicle",
  };

  const alertIcon = {
    undelivered:"📦", license_expiry:"🪪", fahas:"🔧",
    istimara:"📋", insurance:"🛡️", oil_change:"🔩",
    access_request:"👤", fuel_discrepancy:"⛽"
  };

  const alertColor = {
    delivery:"#ef4444", vehicle:"#f59e0b",
    driver:"#3b82f6", maintenance:"#f97316",
    access:"#8b5cf6"
  };

  const filtered = activeTab === "all" ? alerts : alerts.filter(a => alertTypeMap[a.type] === activeTab);

  function submitDismiss(alt) {
    setAlerts(prev => prev.map(a => a.id === alt.id ? {
      ...a,
      status: user.role === "admin" ? "resolved" : "pending_approval",
      dismissedBy: user.name,
      dismissReason: dismissForm.reason,
      manualReason: dismissForm.manualReason,
      tentativeDate: dismissForm.tentativeDate,
      dismissedAt: new Date().toLocaleString(),
      adminApproved: user.role === "admin" ? "approved" : "pending"
    } : a));
    setDismissing(null);
    setDismissForm({ reason:"", manualReason:"", tentativeDate:"" });
  }

  return (
    <Card style={{ border:"1px solid #fbbf24", marginBottom:16 }}>
      <CardTitle>⚠️ {t.systemAlerts} ({alerts.length})</CardTitle>

      {/* Category Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {categories.map(cat => {
          const count = cat === "all" ? alerts.length : alerts.filter(a => alertTypeMap[a.type] === cat).length;
          return (
            <button key={cat} onClick={() => setActiveTab(cat)}
              style={{ padding:"5px 12px", borderRadius:99, border:"none",
                background: activeTab === cat ? (alertColor[cat] || "#1A3A5C") : "#f1f5f9",
                color: activeTab === cat ? "white" : "#374151",
                cursor:"pointer", fontSize:12, fontWeight:600 }}>
              {t.alertCategories[cat]} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>
          {lang === "ar" ? "لا توجد تنبيهات في هذه الفئة" : "No alerts in this category"}
        </div>
      )}

      {filtered.map(alt => {
        const cat = alertTypeMap[alt.type] || "delivery";
        const daysOld = daysSince(alt.raisedAt?.split(" ")[0] || new Date().toISOString().split("T")[0]);
        return (
          <div key={alt.id} style={{ border:`1px solid ${alertColor[cat]}33`, borderRadius:8,
            padding:"10px 14px", marginBottom:8, borderLeft:`4px solid ${alertColor[cat]}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:6 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <span style={{ background: alertColor[cat] + "22", color: alertColor[cat], fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99 }}>
                    {alertIcon[alt.type] || "🔔"} {t.alertTypes[cat]}
                  </span>
                  {alt.dc && <span style={{ fontSize:11, color:"#64748b" }}>📍 {alt.dc} DC</span>}
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:"#0f172a", marginBottom:2 }}>{alt.message}</div>
                <div style={{ fontSize:11, color:"#94a3b8" }}>
                  🕐 {alt.raisedAt} •
                  <span style={{ color: daysOld > 2 ? "#ef4444" : "#f59e0b", fontWeight:600 }}> {daysOld} {t.daysAgo}</span>
                  {daysOld > 1 && <span style={{ color:"#ef4444" }}> — {t.noAction}</span>}
                </div>
                {alt.tentativeDate && (
                  <div style={{ fontSize:11, color:"#6366f1", fontWeight:600, marginTop:2 }}>
                    📅 {t.tentativeDate}: {alt.tentativeDate}
                  </div>
                )}
                {alt.dismissedBy && (
                  <div style={{ fontSize:11, color:"#10b981", marginTop:2 }}>
                    ✅ {alt.dismissedBy} — {alt.dismissReason}
                    {alt.adminApproved === "pending" && <span style={{ color:"#f59e0b" }}> (Pending Admin Approval)</span>}
                  </div>
                )}
              </div>
              <Btn small onClick={() => { setDismissing(alt); setDismissForm({ reason:"", manualReason:"", tentativeDate:"" }); }}
                color={user.role === "admin" ? "#10b981" : "#6366f1"}>
                {user.role === "admin" ? t.resolve : t.dismiss}
              </Btn>
            </div>
          </div>
        );
      })}

      {dismissing && (
        <Modal title={`${t.dismiss} — ${dismissing.message?.slice(0, 40)}...`} onClose={() => setDismissing(null)}>
          <Select label={t.reason} value={dismissForm.reason}
            onChange={v => setDismissForm({ ...dismissForm, reason:v })}
            options={ALERT_DISMISS_REASONS} required />
          {dismissForm.reason === "Other (Manual Reason)" && (
            <Textarea label={rtl ? "السبب يدوياً" : "Manual Reason"} value={dismissForm.manualReason}
              onChange={v => setDismissForm({ ...dismissForm, manualReason:v })} required />
          )}
          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:5 }}>
              📅 {t.tentativeDate}
            </label>
            <input type="date" value={dismissForm.tentativeDate}
              onChange={e => setDismissForm({ ...dismissForm, tentativeDate:e.target.value })}
              style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", boxSizing:"border-box" }} />
          </div>
          {user.role !== "admin" && (
            <div style={{ background:"#fef3c7", padding:"8px 12px", borderRadius:6, fontSize:12, color:"#92400e", marginBottom:12 }}>
              ⚠️ {rtl ? "سيتم إرسال هذا الإجراء للمدير للموافقة النهائية." : "This action will be sent to Admin for final approval."}
            </div>
          )}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Btn onClick={() => setDismissing(null)} color="#64748b">{t.cancel}</Btn>
            <Btn onClick={() => submitDismiss(dismissing)}
              disabled={!dismissForm.reason || (dismissForm.reason === "Other (Manual Reason)" && !dismissForm.manualReason)}
              color="#10b981">{t.submitAction}</Btn>
          </div>
        </Modal>
      )}
    </Card>
  );
}
