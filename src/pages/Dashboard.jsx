// src/pages/Dashboard.jsx
import { RC, RA } from "../data/masterData.js";

// ڈیش بورڈ کے لیے عربی اور انگلش ترجمہ
const translations = {
  en: {
    activeDrivers: "Active Drivers",
    activeVehicles: "Active Vehicles",
    inMaint: "in maint",
    inTransit: "In Transit",
    outstanding: "Outstanding",
    failed: "Failed",
    assigned: "Assigned",
    pending: "Pending",
    delivered: "Delivered",
    total: "Total",
    vehicles: "Vehicles",
    drivers: "drivers",
    deliveryRate: "delivery rate",
    alertsTitle: "System Alerts & Notifications",
    resolveBtn: "Resolve ✓",
    raised: "Raised",
    daysAgo: "days ago"
  },
  ar: {
    activeDrivers: "السائقين النشطين",
    activeVehicles: "المركبات النشطة",
    inMaint: "في الصيانة",
    inTransit: "في الطريق",
    outstanding: "معلقة",
    failed: "فاشلة",
    assigned: "تم التعيين",
    pending: "قيد الانتظار",
    delivered: "تم التسليم",
    total: "الإجمالي",
    vehicles: "المركبات",
    drivers: "السائقين",
    deliveryRate: "نسبة التسليم",
    alertsTitle: "تنبيهات النظام والإشعارات",
    resolveBtn: "حل المشكلة ✓",
    raised: "تم الرفع في",
    daysAgo: "أيام مضت"
  }
};

export default function Dashboard({ user, lang, invoices, trips, alerts, setAlerts, setPage }) {
  const rtl = lang === "ar";
  const t = translations[lang] || translations.en;

  // 1. Calculate Summary Stats (Top Row)
  const totalDrivers = user.role === "manager" ? 13 : 28; // Sample context based counts
  const activeVehiclesCount = user.role === "manager" ? 6 : 20;
  
  const transitCount = invoices.filter(i => i.status === "intransit" && (!user.dc || i.dc === user.dc)).length;
  const outstandingCount = invoices.filter(i => i.status === "outstanding" && (!user.dc || i.dc === user.dc)).length;
  const failedCount = invoices.filter(i => i.status === "failed" && (!user.dc || i.dc === user.dc)).length;
  const assignedCount = invoices.filter(i => i.status === "assigned" && (!user.dc || i.dc === user.dc)).length;
  const pendingCount = invoices.filter(i => i.status === "pending" && (!user.dc || i.dc === user.dc)).length;
  const deliveredCount = invoices.filter(i => i.status === "delivered" && (!user.dc || i.dc === user.dc)).length;
  
  const totalInvoices = invoices.filter(i => !user.dc || i.dc === user.dc).length;
  const deliveryRatePercent = totalInvoices > 0 ? Math.round((deliveredCount / totalInvoices) * 100) : 0;

  // 2. DC breakdown calculations
  const dcs = ["Riyadh", "Jeddah", "Dammam"];
  const dcNamesAr = { Riyadh: "الرياض", Jeddah: "جدة", Dammam: "الدمام" };

  const getDcStats = (dcName) => {
    const dcInvs = invoices.filter(i => i.dc === dcName);
    const del = dcInvs.filter(i => i.status === "delivered").length;
    const pen = dcInvs.filter(i => i.status === "pending").length;
    const out = dcInvs.filter(i => i.status === "outstanding").length;
    const fal = dcInvs.filter(i => i.status === "failed").length;
    const rate = dcInvs.length > 0 ? Math.round((del / dcInvs.length) * 100) : 0;
    return { total: dcInvs.length, del, pen, out, fal, rate };
  };

  // Filter Alerts
  const activeAlerts = (alerts || []).filter(a => a.status === "active" && (!user.dc || a.dc === user.dc));

  const resolveAlert = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "resolved", resolvedAt: new Date().toISOString() } : a));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Top Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 16 }}>
        
        {/* Active Drivers */}
        <div style={{ background: "white", padding: 16, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", textAlign: "center", borderTop: `4px solid ${RA[user.role]}` }}>
          <span style={{ fontSize: 24 }}>👤</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", margin: "4px 0" }}>{totalDrivers}</div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{t.activeDrivers}</div>
        </div>

        {/* Active Vehicles */}
        <div style={{ background: "white", padding: 16, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", textAlign: "center", borderTop: `4px solid #06b6d4` }}>
          <span style={{ fontSize: 24 }}>🚛</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", margin: "4px 0" }}>{activeVehiclesCount}</div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{t.activeVehicles} <span style={{ fontSize: 10, color: "#94a3b8" }}>({t.inMaint} 1)</span></div>
        </div>

        {/* In Transit */}
        <div style={{ background: "white", padding: 16, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", textAlign: "center", borderTop: "4px solid #8b5cf6" }}>
          <span style={{ fontSize: 24 }}>🔄</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", margin: "4px 0" }}>{transitCount}</div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{t.inTransit}</div>
        </div>

        {/* Outstanding */}
        <div style={{ background: "white", padding: 16, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", textAlign: "center", borderTop: "4px solid #f97316" }}>
          <span style={{ fontSize: 24 }}>🟠</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", margin: "4px 0" }}>{outstandingCount}</div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{t.outstanding}</div>
        </div>

        {/* Failed */}
        <div style={{ background: "white", padding: 16, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", textAlign: "center", borderTop: "4px solid #ef4444" }}>
          <span style={{ fontSize: 24 }}>❌</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", margin: "4px 0" }}>{failedCount}</div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{t.failed}</div>
        </div>

        {/* Assigned */}
        <div style={{ background: "white", padding: 16, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", textAlign: "center", borderTop: "4px solid #3b82f6" }}>
          <span style={{ fontSize: 24 }}>🔵</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", margin: "4px 0" }}>{assignedCount}</div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{t.assigned}</div>
        </div>

        {/* Pending */}
        <div style={{ background: "white", padding: 16, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", textAlign: "center", borderTop: "4px solid #eab308" }}>
          <span style={{ fontSize: 24 }}>⏳</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", margin: "4px 0" }}>{pendingCount}</div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{t.pending}</div>
        </div>

        {/* Delivered */}
        <div style={{ background: "white", padding: 16, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", textAlign: "center", borderTop: "4px solid #22c55e" }}>
          <span style={{ fontSize: 24 }}>✅</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#22c55e", margin: "4px 0" }}>{deliveredCount} <span style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>({deliveryRatePercent}%)</span></div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{t.delivered}</div>
        </div>

      </div>

      {/* DC Breakdown Boxes Section (Only for Admin/HO or multi-DC view) */}
      {(!user.dc || user.role === "admin") && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {dcs.map(dc => {
            const stats = getDcStats(dc);
            return (
              <div key={dc} style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 2px 4px rgba(0,0,0,0.04)", borderLeft: rtl ? "none" : "4px solid #475569", borderRight: rtl ? "4px solid #475569" : "none" }}>
                <div style={{ display: "flex", justifyContent: "between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                    {rtl ? dcNamesAr[dc] : `${dc} DC`} 📍
                  </h3>
                  <span style={{ fontSize: 12, background: "#f1f5f9", padding: "4px 8px", borderRadius: 6, fontWeight: 600, color: "#475569" }}>
                    {t.deliveryRate}: {stats.rate}%
                  </span>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
                  <div style={{ background: "#f8fafc", padding: 8, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{t.pending}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#eab308" }}>{stats.pen}</div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: 8, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{t.delivered}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#22c55e" }}>{stats.del}</div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: 8, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{t.total}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{stats.total}</div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: 8, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{t.vehicles}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#06b6d4" }}>{dc === "Riyadh" ? "10" : dc === "Jeddah" ? "9" : "3"}</div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: 8, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{t.outstanding}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#f97316" }}>{stats.out}</div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: 8, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{t.failed}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>{stats.fal}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alerts Section */}
      <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 2px 4px rgba(0,0,0,0.04)" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
          🚨 {t.alertsTitle} ({activeAlerts.length})
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {activeAlerts.map(alert => (
            <div key={alert.id} style={{ display: "flex", alignItems: "center", justifyContent: "between", padding: "12px 16px", borderRadius: 8, background: "#f8fafc", borderLeft: rtl ? "none" : "4px solid #ef4444", borderRight: rtl ? "4px solid #ef4444" : "none", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                  {alert.msg}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                  {t.raised}: {alert.date || "2026-05-28"}
                </div>
              </div>
              <button onClick={() => resolveAlert(alert.id)} style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                {t.resolveBtn}
              </button>
            </div>
          ))}
          {activeAlerts.length === 0 && (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0", fontSize: 13 }}>
              ✓ No Active Alerts
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
