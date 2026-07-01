// src/pages/Dashboard.jsx
// Enhanced v10.0 — Role-aware KPI cards, Quick Actions, Top Drivers,
// Vehicle Doc Expiry Alerts, DC-scoped per role
import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardTitle, StatCard } from "../components/Shared.jsx";
import { RC, RA } from "../data/masterData.js";
import { ROLES } from "../roles.js";

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const T = {
  en: {
    welcome: "Welcome back",
    opsOverview: "Operations Overview",
    deliverables: "Deliverables",
    allDCs: "All Distribution Centers",
    riyadh: "Riyadh", jeddah: "Jeddah", dammam: "Dammam",
    fromDate: "From", toDate: "To",
    today: "Today", thisWeek: "This Week", thisMonth: "This Month", allTime: "All Time",
    deliveryRate: "Delivery Rate",
    vehicleUtil: "Vehicle Utilization",
    driverUtil: "Driver Utilization",
    alerts: "Alerts",
    activeVeh: "Active Vehicles", totalVeh: "Total Vehicles",
    activeDrivers: "Active Drivers", totalDrivers: "Total Drivers",
    howCalc: "How calculated",
    unassigned: "Unassigned", toBeAssigned: "To Be Assigned",
    stagedForDispatch: "Staged for Dispatch", scheduleHold: "Schedule Hold",
    transit: "Transit", delivered: "Delivered", failed: "Failed", cancelled: "Cancelled",
    total: "Total Invoices",
    agingAlert: "Aging Alert", agingDesc: "invoices unassigned for 3+ days",
    slaAlert: "SLA Breach", slaDesc: "transit trips past due date",
    noAlerts: "No active alerts",
    planningTitle: "Upload & Invoice Overview",
    totalUploaded: "Total Invoices", totalBatches: "Total Batches",
    govt: "Government", priv: "Private", todaySummary: "Today's Summary",
    invoices: "invoices", uploadedBy: "Uploaded by",
    loading: "Loading data...",
    logisticTitle: "Fleet & Fuel Overview — Riyadh DC",
    // New KPI labels
    stagedToday: "Staged for Dispatch",
    fuelPending: "Fuel Approvals Pending",
    vehiclesOnRoad: "Vehicles on Road",
    criticalAging: "Critical Aging",
    slaBreachCount: "SLA Breach",
    // Quick actions
    assignInvoice: "Assign Invoice",
    addFuel: "Add Fuel",
    calendar: "Dispatch Calendar",
    reports: "Reports",
    activeAlertsBtn: "Alerts",
    // Sections
    topDrivers: "Top Delivery Partners Today",
    docExpiry: "Vehicle Document Expiry Alerts",
    expiringSoon: "expiring soon",
    critical: "Critical",
    warning: "Warning",
    daysLeft: "days left",
    expired: "EXPIRED",
    noExpiry: "No document expiry alerts",
    noDriverActivity: "No delivery activity today",
    fahas: "Fahas", insurance: "Insurance", istimara: "Istimara",
    deliveredCount: "delivered",
  },
  ar: {
    welcome: "مرحباً بعودتك",
    opsOverview: "نظرة عامة على العمليات",
    deliverables: "المستحقات",
    allDCs: "جميع مراكز التوزيع",
    riyadh: "الرياض", jeddah: "جدة", dammam: "الدمام",
    fromDate: "من", toDate: "إلى",
    today: "اليوم", thisWeek: "هذا الأسبوع", thisMonth: "هذا الشهر", allTime: "كل الوقت",
    deliveryRate: "معدل التسليم",
    vehicleUtil: "استخدام المركبات",
    driverUtil: "استخدام السائقين",
    alerts: "التنبيهات",
    activeVeh: "مركبات نشطة", totalVeh: "إجمالي المركبات",
    activeDrivers: "سائقون نشطون", totalDrivers: "إجمالي السائقين",
    howCalc: "طريقة الحساب",
    unassigned: "غير مخصصة", toBeAssigned: "للتخصيص",
    stagedForDispatch: "مرحلة الإرسال", scheduleHold: "جدولة مؤقتة",
    transit: "عبور", delivered: "مسلمة", failed: "فاشلة", cancelled: "ملغاة",
    total: "إجمالي الفواتير",
    agingAlert: "تنبيه التقادم", agingDesc: "فواتير غير مخصصة لأكثر من 3 أيام",
    slaAlert: "خرق مستوى الخدمة", slaDesc: "رحلات عبور متأخرة",
    noAlerts: "لا توجد تنبيهات نشطة",
    planningTitle: "نظرة عامة على الرفع والفواتير",
    totalUploaded: "إجمالي الفواتير", totalBatches: "إجمالي الدفعات",
    govt: "حكومي", priv: "خاص", todaySummary: "ملخص اليوم",
    invoices: "فواتير", uploadedBy: "رفع بواسطة",
    loading: "جاري التحميل...",
    logisticTitle: "نظرة عامة على الأسطول والوقود — الرياض",
    stagedToday: "مرحلة الإرسال",
    fuelPending: "موافقات الوقود المعلقة",
    vehiclesOnRoad: "مركبات على الطريق",
    criticalAging: "تقادم حرج",
    slaBreachCount: "خرق مستوى الخدمة",
    assignInvoice: "تخصيص فاتورة",
    addFuel: "إضافة وقود",
    calendar: "تقويم الإرسال",
    reports: "التقارير",
    activeAlertsBtn: "التنبيهات",
    topDrivers: "أفضل شركاء التوصيل اليوم",
    docExpiry: "تنبيهات انتهاء وثائق المركبات",
    expiringSoon: "تنتهي قريباً",
    critical: "حرج",
    warning: "تحذير",
    daysLeft: "يوم متبقي",
    expired: "منتهية",
    noExpiry: "لا توجد تنبيهات انتهاء وثائق",
    noDriverActivity: "لا يوجد نشاط تسليم اليوم",
    fahas: "الفحص", insurance: "التأمين", istimara: "الاستمارة",
    deliveredCount: "مسلمة",
  }
};

const DC_LIST = ["Riyadh", "Jeddah", "Dammam"];
const DC_COLORS = { Riyadh: "#1A3A5C", Jeddah: "#0f766e", Dammam: "#7c3aed" };

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getToday() { return new Date().toISOString().split("T")[0]; }

function getQuickRange(q) {
  const now = new Date();
  const today = getToday();
  if (q === "today") return { from: today, to: today };
  if (q === "week") { const d = new Date(now); d.setDate(d.getDate() - 6); return { from: d.toISOString().split("T")[0], to: today }; }
  if (q === "month") { const d = new Date(now); d.setDate(1); return { from: d.toISOString().split("T")[0], to: today }; }
  const d = new Date(now); d.setFullYear(d.getFullYear() - 1);
  return { from: d.toISOString().split("T")[0], to: today };
}

function filterByDateRange(invList, from, to) {
  return invList.filter(i => {
    if (!i.date) return true;
    return i.date >= from && i.date <= to;
  });
}

function calcDeliveryRate(inv) {
  const countable = inv.filter(i => !["scheduled", "hold_await", "hold_ship", "intransit", "cancelled"].includes(i.status));
  const del = inv.filter(i => i.status === "delivered").length;
  return countable.length > 0 ? Math.round(del / countable.length * 100) : 0;
}

function rateColor(r) { return r >= 80 ? "#10b981" : r >= 50 ? "#f59e0b" : "#ef4444"; }

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function todayDate() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

// ─── DATE RANGE PICKER ────────────────────────────────────────────────────────
function DateRangePicker({ from, to, setFrom, setTo, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{t.fromDate}:</span>
      <input type="date" value={from} onChange={e => setFrom(e.target.value)}
        style={{ border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "5px 10px", fontSize: 12, outline: "none" }} />
      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{t.toDate}:</span>
      <input type="date" value={to} onChange={e => setTo(e.target.value)}
        style={{ border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "5px 10px", fontSize: 12, outline: "none" }} />
      <div style={{ display: "flex", gap: 4 }}>
        {[["today", t.today], ["week", t.thisWeek], ["month", t.thisMonth], ["all", t.allTime]].map(([v, l]) => (
          <button key={v} onClick={() => { const r = getQuickRange(v); setFrom(r.from); setTo(r.to); }}
            style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#374151", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── DC TABS ──────────────────────────────────────────────────────────────────
function DCTabs({ active, onChange, t, userDC, color = "#1A3A5C" }) {
  const tabs = userDC
    ? [[userDC, userDC]]
    : [["all", t.allDCs], ["Riyadh", t.riyadh], ["Jeddah", t.jeddah], ["Dammam", t.dammam]];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
      {tabs.map(([val, label]) => (
        <button key={val} onClick={() => onChange(val)}
          style={{
            padding: "7px 16px", borderRadius: 7, border: "none",
            background: active === val ? color : "#f1f5f9",
            color: active === val ? "white" : "#374151",
            cursor: "pointer", fontSize: 13, fontWeight: 600
          }}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── QUICK ACTIONS BAR ────────────────────────────────────────────────────────
function QuickActions({ user, alerts, setPage, t, accentColor }) {
  const role = user.role;
  const activeAlerts = (alerts || []).filter(a => a.status === "active").length;

  const actions = [];
  if ([ROLES.ADMIN, ROLES.MANAGER].includes(role)) {
    actions.push({ label: t.assignInvoice, icon: "🚚", page: "assign", color: accentColor });
  }
  if ([ROLES.ADMIN, ROLES.MANAGER, ROLES.LOGISTIC].includes(role)) {
    actions.push({ label: t.addFuel, icon: "⛽", page: "fuel", color: "#f59e0b" });
  }
  if ([ROLES.ADMIN, ROLES.MANAGER].includes(role)) {
    actions.push({ label: t.calendar, icon: "📅", page: "calendar", color: "#6366f1" });
  }
  if ([ROLES.ADMIN, ROLES.MANAGER, ROLES.LOGISTIC, ROLES.MANAGEMENT].includes(role)) {
    actions.push({ label: t.reports, icon: "📊", page: "reports", color: "#0891b2" });
  }

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
      {actions.map(a => (
        <button key={a.page} onClick={() => setPage(a.page)}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "white", border: `1.5px solid ${a.color}33`,
            borderRadius: 8, padding: "9px 16px", cursor: "pointer",
            fontSize: 13, fontWeight: 700, color: a.color,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
          }}>
          <span style={{ fontSize: 16 }}>{a.icon}</span> {a.label}
        </button>
      ))}
      {activeAlerts > 0 && (
        <button onClick={() => setPage("dashboard")}
          style={{
            display: "flex", alignItems: "center", gap: 7, marginLeft: "auto",
            background: "#fee2e2", border: "1.5px solid #fca5a5",
            borderRadius: 8, padding: "9px 16px", cursor: "pointer",
            fontSize: 13, fontWeight: 700, color: "#991b1b"
          }}>
          🔔 {activeAlerts} {t.activeAlertsBtn}
        </button>
      )}
    </div>
  );
}

// ─── KPI CARDS ROW ────────────────────────────────────────────────────────────
function KpiCards({ invoices, vehicles, fuelLogs, trips, userDC, role, t }) {
  const today = getToday();

  // Scope by DC
  const scopedInv = userDC ? invoices.filter(i => i.dc === userDC) : invoices;
  const scopedVeh = userDC ? vehicles.filter(v => v.dc === userDC) : vehicles;
  const scopedFuel = userDC ? fuelLogs.filter(l => l.dc === userDC) : fuelLogs;

  const deliveryRate = calcDeliveryRate(filterByDateRange(scopedInv.filter(i => i.uploadBatch), getQuickRange("month").from, today));
  const stagedToday = scopedInv.filter(i => ["assigned", "staged"].includes(i.status)).length;
  const fuelPending = scopedFuel.filter(l => l.status === "pending_approval").length;
  const vehiclesOnRoad = scopedVeh.filter(v => v.status === "Active").length;
  const criticalAging = scopedInv.filter(i => {
    if (!["pending", "outstanding"].includes(i.status)) return false;
    if (!i.date) return false;
    return Math.floor((new Date() - new Date(i.date)) / (1000 * 60 * 60 * 24)) >= 3;
  }).length;
  const slaBreached = (trips || []).filter(t2 => {
    if (t2.status === "delivered") return false;
    if (!t2.tentativeDate) return false;
    return t2.tentativeDate < today && (!userDC || t2.fromDC === userDC || t2.toDC === userDC);
  }).length;

  // Role-based KPI visibility
  const isLogistic = role === ROLES.LOGISTIC;

  const kpis = [
    {
      show: !isLogistic,
      icon: "📊", label: t.deliveryRate,
      value: deliveryRate + "%",
      color: rateColor(deliveryRate),
      sub: deliveryRate >= 80 ? "On target ✅" : deliveryRate >= 50 ? "Needs attention" : "Critical ⚠️"
    },
    {
      show: true,
      icon: "📦", label: t.stagedToday,
      value: stagedToday,
      color: "#3b82f6",
      sub: "Ready for dispatch"
    },
    {
      show: [ROLES.ADMIN, ROLES.MANAGER, ROLES.LOGISTIC].includes(role),
      icon: "⛽", label: t.fuelPending,
      value: fuelPending,
      color: fuelPending > 0 ? "#f59e0b" : "#10b981",
      sub: fuelPending > 0 ? "Awaiting approval" : "All clear"
    },
    {
      show: true,
      icon: "🚗", label: t.vehiclesOnRoad,
      value: vehiclesOnRoad,
      color: "#6366f1",
      sub: `of ${scopedVeh.length} total`
    },
    {
      show: !isLogistic,
      icon: "⏱️", label: t.criticalAging,
      value: criticalAging,
      color: criticalAging > 0 ? "#ef4444" : "#10b981",
      sub: "3+ days unassigned"
    },
    {
      show: [ROLES.ADMIN, ROLES.MANAGER].includes(role),
      icon: "🚨", label: t.slaBreachCount,
      value: slaBreached,
      color: slaBreached > 0 ? "#ef4444" : "#10b981",
      sub: "Trips overdue"
    },
  ].filter(k => k.show);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 18 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{
          background: "white", borderRadius: 10, padding: "14px 14px",
          borderLeft: `4px solid ${k.color}`,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
        }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>{k.icon} {k.label}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: k.color, lineHeight: 1.1 }}>{k.value}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── VEHICLE DOCUMENT EXPIRY ALERTS ──────────────────────────────────────────
function DocExpiryAlerts({ vehicles, userDC, t, accentColor }) {
  const scopedVeh = userDC ? vehicles.filter(v => v.dc === userDC) : vehicles;

  const expiryItems = [];
  scopedVeh.forEach(v => {
    [
      { label: t.fahas, date: v.fahas },
      { label: t.insurance, date: v.insurance },
      { label: t.istimara, date: v.istimara },
    ].forEach(({ label, date }) => {
      if (!date) return;
      const days = daysUntil(date);
      if (days !== null && days <= 60) {
        expiryItems.push({ plate: v.plate, type: v.type, dc: v.dc, docLabel: label, date, days });
      }
    });
  });

  expiryItems.sort((a, b) => a.days - b.days);

  if (expiryItems.length === 0) return (
    <div style={{ background: "white", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginTop: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 10 }}>📄 {t.docExpiry}</div>
      <div style={{ textAlign: "center", padding: "18px 0", color: "#10b981", fontWeight: 600, fontSize: 14 }}>
        ✅ {t.noExpiry}
      </div>
    </div>
  );

  return (
    <div style={{ background: "white", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>📄 {t.docExpiry}</div>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
          background: "#fee2e2", color: "#991b1b"
        }}>
          {expiryItems.length} {t.expiringSoon}
        </span>
      </div>
      {expiryItems.slice(0, 8).map((item, i) => {
        const isCritical = item.days < 0 || item.days <= 14;
        const isWarning = !isCritical && item.days <= 30;
        const badgeBg = isCritical ? "#fee2e2" : isWarning ? "#fef3c7" : "#f0fdf4";
        const badgeColor = isCritical ? "#991b1b" : isWarning ? "#92400e" : "#065f46";
        const badgeLabel = item.days < 0 ? t.expired : isCritical ? t.critical : t.warning;
        const subText = item.days < 0
          ? `${Math.abs(item.days)} days ago`
          : `${item.days} ${t.daysLeft} — ${item.date}`;
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 0", borderBottom: i < expiryItems.length - 1 ? "1px solid #f1f5f9" : "none",
            flexWrap: "wrap", gap: 6
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                🚗 {item.plate}
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 400, marginLeft: 8 }}>
                  {item.type} · {item.dc}
                </span>
              </div>
              <div style={{ fontSize: 12, color: isCritical ? "#991b1b" : "#92400e", marginTop: 2 }}>
                {item.docLabel} — {subText}
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: badgeBg, color: badgeColor }}>
              {badgeLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── TOP DRIVERS TODAY ────────────────────────────────────────────────────────
function TopDriversToday({ invoices, users, userDC, t }) {
  const today = getToday();
  const scopedInv = userDC ? invoices.filter(i => i.dc === userDC) : invoices;
  const todayInv = scopedInv.filter(i => i.date === today && i.driverId);

  const driverMap = {};
  todayInv.forEach(i => {
    if (!driverMap[i.driverId]) driverMap[i.driverId] = { name: i.driverName || i.driverId, delivered: 0, failed: 0, total: 0 };
    driverMap[i.driverId].total++;
    if (i.status === "delivered") driverMap[i.driverId].delivered++;
    if (i.status === "failed") driverMap[i.driverId].failed++;
  });

  const ranked = Object.values(driverMap).sort((a, b) => b.delivered - a.delivered).slice(0, 5);

  const avatarColors = ["#2471A3", "#0d9488", "#7c3aed", "#b45309", "#dc2626"];

  if (ranked.length === 0) return (
    <div style={{ textAlign: "center", padding: "18px 0", color: "#94a3b8", fontSize: 13 }}>
      📦 {t.noDriverActivity}
    </div>
  );

  return (
    <div>
      {ranked.map((d, i) => {
        const initials = (d.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
        const rate = d.total > 0 ? Math.round(d.delivered / d.total * 100) : 0;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < ranked.length - 1 ? "1px solid #f1f5f9" : "none" }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: avatarColors[i % avatarColors.length],
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: 13, flexShrink: 0
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{d.delivered} {t.deliveredCount} · {rate}% rate</div>
            </div>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
              background: rate >= 80 ? "#d1fae5" : rate >= 60 ? "#fef3c7" : "#fee2e2",
              color: rate >= 80 ? "#065f46" : rate >= 60 ? "#92400e" : "#991b1b"
            }}>
              {d.delivered} ✅
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── OPERATIONS OVERVIEW (left panel) ────────────────────────────────────────
function OperationsOverview({ invoices, vehicles, users, alerts, trips, t, lang, userDC, isLogistic }) {
  const [dcTab, setDcTab] = useState(userDC || "all");
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; });
  const [to, setTo] = useState(getToday());
  const rtl = lang === "ar";

  function getMetrics(dc) {
    const inv = filterByDateRange(
      (dc === "all" ? invoices : invoices.filter(i => i.dc === dc)).filter(i => i.uploadBatch),
      from, to
    );
    const veh = dc === "all" ? vehicles : vehicles.filter(v => v.dc === dc);
    const drv = (users || []).filter(u => u.role === "driver" && (dc === "all" || u.dc === dc) && (u.status === "active" || u.status === "Active"));
    const activeV = veh.filter(v => v.status === "Active").length;
    const activeD = drv.filter(d => inv.some(i => i.driverId === d.uid && ["staged", "assigned"].includes(i.status))).length;
    const rate = calcDeliveryRate(inv);
    const vUtil = veh.length > 0 ? Math.round(activeV / veh.length * 100) : 0;
    const dUtil = drv.length > 0 ? Math.round(activeD / drv.length * 100) : 0;
    const dcAlerts = (alerts || []).filter(a => a.status === "active" && (dc === "all" || a.dc === dc));
    const today = new Date();
    const agingCount = inv.filter(i => {
      if (i.status !== "pending") return false;
      if (!i.date) return false;
      return Math.floor((today - new Date(i.date)) / (1000 * 60 * 60 * 24)) >= 3;
    }).length;
    const slaBreached = (trips || []).filter(t2 => {
      if (t2.status === "delivered") return false;
      if (!t2.tentativeDate) return false;
      return t2.tentativeDate < getToday() && (dc === "all" || t2.fromDC === dc || t2.toDC === dc);
    }).length;
    return { rate, vUtil, dUtil, activeV, totalV: veh.length, activeD, totalD: drv.length, alertCount: dcAlerts.length, agingCount, slaBreached };
  }

  const m = getMetrics(dcTab);
  const color = dcTab === "all" ? "#1A3A5C" : (DC_COLORS[dcTab] || "#1A3A5C");

  return (
    <div style={{ background: "white", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", direction: rtl ? "rtl" : "ltr" }}>
      <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", marginBottom: 14 }}>📊 {t.opsOverview}</div>
      <DCTabs active={dcTab} onChange={setDcTab} t={t} userDC={userDC} color={color} />
      <DateRangePicker from={from} to={to} setFrom={setFrom} setTo={setTo} t={t} />

      {m.agingCount > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 13, color: "#991b1b", fontWeight: 600 }}>
          🚨 {m.agingCount} {t.agingAlert} — {t.agingDesc}
        </div>
      )}
      {m.slaBreached > 0 && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 13, color: "#9a3412", fontWeight: 600 }}>
          ⚠️ {m.slaBreached} {t.slaAlert} — {t.slaDesc}
        </div>
      )}

      {!isLogistic && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>📊 {t.deliveryRate}</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: rateColor(m.rate) }}>{m.rate}%</span>
          </div>
          <div style={{ background: "#f1f5f9", borderRadius: 99, height: 10, overflow: "hidden" }}>
            <div style={{ width: `${m.rate}%`, height: "100%", background: rateColor(m.rate), borderRadius: 99, transition: "width 0.5s" }} />
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{t.howCalc}: Delivered ÷ (Total − Transit − Scheduled − Cancelled) × 100</div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>🚗 {t.vehicleUtil}</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#0891b2" }}>{m.vUtil}%</span>
        </div>
        <div style={{ background: "#f1f5f9", borderRadius: 99, height: 10, overflow: "hidden" }}>
          <div style={{ width: `${m.vUtil}%`, height: "100%", background: "#0891b2", borderRadius: 99, transition: "width 0.5s" }} />
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{m.activeV} / {m.totalV} {t.activeVeh}</div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>👤 {t.driverUtil}</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#6366f1" }}>{m.dUtil}%</span>
        </div>
        <div style={{ background: "#f1f5f9", borderRadius: 99, height: 10, overflow: "hidden" }}>
          <div style={{ width: `${m.dUtil}%`, height: "100%", background: "#6366f1", borderRadius: 99, transition: "width 0.5s" }} />
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{m.activeD} / {m.totalD} {t.activeDrivers}</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderRadius: 8, padding: "10px 14px" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>🔔 {t.alerts}</span>
        <span style={{ fontSize: 22, fontWeight: 900, color: m.alertCount > 0 ? "#ef4444" : "#10b981" }}>{m.alertCount}</span>
      </div>
    </div>
  );
}

// ─── DELIVERABLES (right panel) ───────────────────────────────────────────────
function Deliverables({ invoices, users, t, lang, userDC }) {
  const [dcTab, setDcTab] = useState(userDC || "all");
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; });
  const [to, setTo] = useState(getToday());
  const [openStatus, setOpenStatus] = useState(null);
  const rtl = lang === "ar";

  const baseInv = (dcTab === "all" ? invoices : invoices.filter(i => i.dc === dcTab)).filter(i => i.uploadBatch);
  const inv = filterByDateRange(baseInv, from, to);

  const TABS = [
    { key: "unassigned", label: t.unassigned, status: ["pending"], color: "#f59e0b", icon: "⏳" },
    { key: "toBeAssigned", label: t.toBeAssigned, status: ["to_be_assigned"], color: "#3b82f6", icon: "📋" },
    { key: "staged", label: t.stagedForDispatch, status: ["staged", "assigned"], color: "#6366f1", icon: "📦" },
    { key: "scheduleHold", label: t.scheduleHold, status: ["scheduled", "hold_await"], color: "#a855f7", icon: "📅" },
    { key: "transit", label: t.transit, status: ["intransit", "hold_ship"], color: "#8b5cf6", icon: "🚚" },
    { key: "delivered", label: t.delivered, status: ["delivered"], color: "#10b981", icon: "✅" },
    { key: "failed", label: t.failed, status: ["failed"], color: "#ef4444", icon: "❌" },
    { key: "cancelled", label: t.cancelled, status: ["cancelled"], color: "#475569", icon: "🚫" },
  ];

  function getCount(statuses) { return inv.filter(i => statuses.includes(i.status)).length; }
  function getInvoices(statuses) { return inv.filter(i => statuses.includes(i.status)); }

  return (
    <div style={{ background: "white", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", direction: rtl ? "rtl" : "ltr" }}>
      <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        📋 {t.deliverables}
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#64748b", fontWeight: 400 }}>
          {t.total}: <b style={{ color: "#6366f1" }}>{inv.length}</b>
        </span>
      </div>
      <DCTabs active={dcTab} onChange={v => { setDcTab(v); setOpenStatus(null); }} t={t} userDC={userDC} color="#6366f1" />
      <DateRangePicker from={from} to={to} setFrom={setFrom} setTo={setTo} t={t} />

      {/* Top Drivers Today */}
      <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 10 }}>🏆 {t.topDrivers}</div>
        <TopDriversToday invoices={inv} users={users} userDC={userDC} t={t} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {TABS.map(tab => {
          const count = getCount(tab.status);
          const isOpen = openStatus === tab.key;
          const tabInv = getInvoices(tab.status);
          return (
            <div key={tab.key}>
              <button onClick={() => setOpenStatus(isOpen ? null : tab.key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 8,
                  border: `1.5px solid ${isOpen ? tab.color : "#e2e8f0"}`,
                  background: isOpen ? tab.color + "10" : "#f8fafc",
                  cursor: "pointer", transition: "all 0.15s"
                }}>
                <span style={{ fontSize: 16 }}>{tab.icon}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#374151", textAlign: "left" }}>{tab.label}</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: count > 0 ? tab.color : "#94a3b8" }}>{count}</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && tabInv.length > 0 && (
                <div style={{ background: "#f8fafc", borderRadius: "0 0 8px 8px", border: `1px solid ${tab.color}30`, borderTop: "none", maxHeight: 280, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: tab.color + "15" }}>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#374151" }}>Invoice #</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#374151" }}>Customer</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#374151" }}>DC</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#374151" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tabInv.map((inv2, i) => (
                        <tr key={inv2.id || inv2.firestoreId} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                          <td style={{ padding: "7px 12px", fontWeight: 700, color: tab.color }}>{inv2.id}</td>
                          <td style={{ padding: "7px 12px", color: "#374151" }}>{inv2.customer}</td>
                          <td style={{ padding: "7px 12px", color: "#64748b" }}>{inv2.dc}</td>
                          <td style={{ padding: "7px 12px", color: "#64748b" }}>{inv2.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {isOpen && tabInv.length === 0 && (
                <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: 13, background: "#f8fafc", borderRadius: "0 0 8px 8px" }}>
                  No invoices in this category
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PLANNING VIEW ────────────────────────────────────────────────────────────
function PlanningDashboard({ user, invoices, uploads, t, rtl }) {
  const today = new Date().toISOString().split("T")[0];
  const todayUploads = uploads.filter(u => u.date === today);
  const postedInv = invoices.filter(i => i.uploadBatch);
  return (
    <div style={{ direction: rtl ? "rtl" : "ltr" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>{t.welcome}, {user.name}!</h2>
        <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>{t.planningTitle}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
        <StatCard icon="📋" label={t.totalUploaded} value={postedInv.length} color="#6366f1" />
        <StatCard icon="📦" label={t.totalBatches} value={uploads.length} color="#0891b2" />
        <StatCard icon="🏛️" label={t.govt} value={postedInv.filter(i => i.inst === "Govt" || i.inst === "Government").length} color="#1A3A5C" />
        <StatCard icon="🏥" label={t.priv} value={postedInv.filter(i => i.inst === "Private").length} color="#7c3aed" />
      </div>
      {todayUploads.length > 0 && (
        <div style={{ background: "white", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 14 }}>📅 {t.todaySummary}</div>
          {todayUploads.map(u => (
            <div key={u.batchId} style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9", fontSize: 14 }}>
              <span style={{ fontWeight: 700, color: "#6366f1" }}>{u.batchId}</span>
              <span style={{ color: "#64748b", marginLeft: 8 }}>{u.invoiceCount} {t.invoices}</span>
              <span style={{ color: "#94a3b8", marginLeft: 8 }}>{t.uploadedBy}: {u.uploadedBy}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LOGISTIC VIEW ────────────────────────────────────────────────────────────
function LogisticDashboard({ user, invoices, vehicles, fuelLogs, trips, alerts, users, t, lang, setPage }) {
  // Logistic = Riyadh DC only
  const userDC = "Riyadh";
  const accentColor = "#dc2626";
  const rtl = lang === "ar";
  return (
    <div style={{ direction: rtl ? "rtl" : "ltr" }}>
      <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 3px" }}>{t.welcome}, {user.name}!</h2>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>{t.logisticTitle}</p>
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>{todayDate()}</div>
      </div>
      <QuickActions user={user} alerts={alerts} setPage={setPage} t={t} accentColor={accentColor} />
      <KpiCards invoices={invoices} vehicles={vehicles} fuelLogs={fuelLogs} trips={trips} userDC={userDC} role={user.role} t={t} />
      <OperationsOverview invoices={invoices.filter(i => i.uploadBatch)} vehicles={vehicles} users={users} alerts={alerts} trips={trips} t={t} lang={lang} userDC={userDC} isLogistic={true} />
      <DocExpiryAlerts vehicles={vehicles} userDC={userDC} t={t} accentColor={accentColor} />
    </div>
  );
}

// ─── MANAGEMENT VIEW ──────────────────────────────────────────────────────────
function ManagementDashboard({ user, invoices, vehicles, fuelLogs, trips, alerts, users, t, lang }) {
  const rtl = lang === "ar";
  const postedInv = invoices.filter(i => i.uploadBatch);
  return (
    <div style={{ direction: rtl ? "rtl" : "ltr" }}>
      <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 3px" }}>{t.welcome}, {user.name}!</h2>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>{t.allDCs} — Read Only</p>
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>{todayDate()}</div>
      </div>
      <KpiCards invoices={postedInv} vehicles={vehicles} fuelLogs={fuelLogs} trips={trips} userDC={null} role={user.role} t={t} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        <OperationsOverview invoices={postedInv} vehicles={vehicles} users={users} alerts={alerts} trips={trips} t={t} lang={lang} userDC={null} isLogistic={false} />
        <div style={{ background: "white", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 14 }}>📊 DC Summary</div>
          {["Riyadh", "Jeddah", "Dammam"].map(dc => {
            const dcInv = postedInv.filter(i => i.dc === dc);
            const rate = calcDeliveryRate(dcInv);
            const color = DC_COLORS[dc];
            return (
              <div key={dc} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>📍 {dc}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: rateColor(rate) }}>{rate}%</span>
                </div>
                <div style={{ background: "#f1f5f9", borderRadius: 99, height: 8, overflow: "hidden" }}>
                  <div style={{ width: `${rate}%`, height: "100%", background: color, borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                  {dcInv.filter(i => i.status === "delivered").length} delivered · {dcInv.length} total
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <DocExpiryAlerts vehicles={vehicles} userDC={null} t={t} accentColor="#1e3a5f" />
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard({ user, lang, invoices, setInvoices, vehicles, trips, setTrips, uploads, setUploads, fuelLogs, setFuelLogs, alerts, setAlerts, users, setUsers, setPage }) {
  const [fsUsers, setFsUsers] = useState([]);
  const [fsVehicles, setFsVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const rtl = lang === "ar";
  const t = T[lang] || T.en;
  const role = user.role;
  const userDC = (user.dc && user.dc !== "Head Office") ? user.dc : null;
  const isAdmin = role === ROLES.ADMIN;
  const isManager = role === ROLES.MANAGER;
  const isLogistic = role === ROLES.LOGISTIC;
  const isPlanning = role === ROLES.PLANNING;
  const isManagement = role === ROLES.MANAGEMENT;

  const accentColor = RC[role] || "#1A3A5C";

  useEffect(() => { loadAllData(); }, []);

  async function loadAllData() {
    try {
      const [invSnap, usersSnap, vehSnap, alertsSnap] = await Promise.all([
        getDocs(collection(db, "invoices")),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "vehicles")),
        getDocs(collection(db, "alerts")),
      ]);
      setInvoices(invSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
      setFsUsers(usersSnap.docs.map(d => ({ uid: d.id, ...d.data() })));
      setFsVehicles(vehSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAlerts(alertsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error("Dashboard load:", e); }
    setLoading(false);
  }

  async function clearTestData() {
    if (!window.confirm("Reset all test data? Invoices, trips, uploads, fuel logs and alerts will be cleared.")) return;
    try {
      for (const col of ["invoices", "trips", "uploads", "fuelLogs", "alerts"]) {
        const snap = await getDocs(collection(db, col));
        for (const d of snap.docs) await deleteDoc(doc(db, col, d.id));
      }
      setInvoices([]); setTrips([]); setUploads([]); setFuelLogs([]); setAlerts([]);
      alert("✅ Test data cleared!");
    } catch (e) { alert("Error: " + e.message); }
  }

  const allVehicles = fsVehicles.length > 0 ? fsVehicles : vehicles;
  const allUsers = fsUsers.length > 0 ? fsUsers : (users || []);
  const postedInv = invoices.filter(i => i.uploadBatch);

  // ── PLANNING ──
  if (isPlanning) return <PlanningDashboard user={user} invoices={invoices} uploads={uploads} t={t} rtl={rtl} />;

  // ── LOGISTIC (Riyadh only) ──
  if (isLogistic) return (
    <LogisticDashboard
      user={user} invoices={postedInv} vehicles={allVehicles}
      fuelLogs={fuelLogs} trips={trips} alerts={alerts} users={allUsers}
      t={t} lang={lang} setPage={setPage}
    />
  );

  // ── MANAGEMENT (read-only, all DCs) ──
  if (isManagement) {
    if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, fontSize: 17, color: "#64748b" }}>⏳ {t.loading}</div>;
    return (
      <ManagementDashboard
        user={user} invoices={postedInv} vehicles={allVehicles}
        fuelLogs={fuelLogs} trips={trips} alerts={alerts} users={allUsers}
        t={t} lang={lang}
      />
    );
  }

  // ── LOADING ──
  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, fontSize: 17, color: "#64748b" }}>
      ⏳ {t.loading}
    </div>
  );

  // ── ADMIN + MANAGER — main 2-column layout ──
  return (
    <div style={{ direction: rtl ? "rtl" : "ltr" }}>
      {/* Header */}
      <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>
            {t.welcome}, {user.name}!
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            {userDC ? `${userDC} Distribution Center` : t.allDCs} · {todayDate()}
          </p>
        </div>
        {isAdmin && (
          <button onClick={clearTestData} style={{ background: "#fee2e2", border: "2px solid #ef4444", color: "#991b1b", padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
            🗑️ Clear Test Data
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions user={user} alerts={alerts} setPage={setPage} t={t} accentColor={accentColor} />

      {/* KPI Cards */}
      <KpiCards
        invoices={postedInv} vehicles={allVehicles}
        fuelLogs={fuelLogs} trips={trips}
        userDC={userDC} role={role} t={t}
      />

      {/* 2-Column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        <OperationsOverview
          invoices={postedInv} vehicles={allVehicles}
          users={allUsers} alerts={alerts} trips={trips}
          t={t} lang={lang} userDC={userDC} isLogistic={false}
        />
        <Deliverables
          invoices={postedInv} users={allUsers}
          t={t} lang={lang} userDC={userDC}
        />
      </div>

      {/* Vehicle Doc Expiry Alerts */}
      <DocExpiryAlerts vehicles={allVehicles} userDC={userDC} t={t} accentColor={accentColor} />
    </div>
  );
}
