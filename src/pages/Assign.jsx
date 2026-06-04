// src/components/Assign.jsx
// Dispatch Management — Section 4 spec (Handover v4 Final)
// Modes: Pending Allocations | Processed Orders

import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardTitle, Btn, OutlineBtn, SuccessMsg, ErrorMsg, Modal, EmptyState } from "../components/Shared.jsx";
import { STORAGE_CONDITIONS, CITIES } from "../data/masterData.js";
import { sendNotification } from "../notificationService.js";

// ─── i18n ──────────────────────────────────────────────────────────────────
const T = {
  en: {
    title: "Dispatch Management",
    activityType: "Activity Type",
    pendingAllocations: "Pending Allocations",
    processedOrders: "Processed Orders",
    // Pending Allocations actions
    actionLabel: "Action",
    actionPlaceholder: "Select action...",
    actionToBeAssigned: "To Be Assigned",
    actionScheduleHold: "Schedule Hold",
    actionPendingShipment: "Pending Shipment",
    actionCancelled: "Cancelled",
    originDC: "Origin DC",
    applyAction: "Apply Action",
    // Processed Orders sub-tabs
    toBeAssigned: "To Be Assigned",
    stagedForDispatch: "Staged for Dispatch",
    failed: "Failed",
    // Assignment panel
    deliveryPartnerDetails: "Delivery Partner Details",
    deliveryPartner: "Delivery Partner",
    vehicle: "Vehicle",
    city: "Delivery City",
    storage: "Storage Condition",
    deliveryType: "Delivery Type",
    inCity: "In-City",
    outCity: "Out-City",
    remarks: "Remarks (Optional)",
    assignBtn: "Assign to Delivery Partner",
    // Statuses / labels
    noInvoices: "No invoices found",
    loading: "Loading data...",
    onLeave: "Delivery Partner is on leave — cannot assign",
    inMaint: "Vehicle is under maintenance — cannot assign",
    lowFuel: "Low Fuel Warning",
    fuelAvailable: "Fuel Available",
    odometer: "Odometer",
    estDistance: "Est. Coverage",
    efficiency: "Efficiency",
    vehAlert: "Vehicle Alert",
    drvAlert: "Delivery Partner Alert",
    driverFree: "Available",
    driverLoad: "assigned",
    noDrivers: "No delivery partners found for this DC",
    noVehicles: "No vehicles found for this DC",
    assignedSuccess: "invoice(s) assigned to",
    actionSuccess: "Action applied to",
    invoices: "invoice(s)",
    moveBack: "Move to Pending Allocations",
    moveBackWarn: "Can only move Schedule Hold, Transit, or Cancelled invoices back.",
    selectAll: "Select All",
    clearAll: "Clear",
    selected: "selected",
    dateFrom: "From",
    dateTo: "To",
    filterDates: "Date Filter",
    clearFilter: "Clear Filter",
  },
  ar: {
    title: "إدارة التوزيع",
    activityType: "نوع النشاط",
    pendingAllocations: "التخصيصات المعلقة",
    processedOrders: "الطلبات المعالجة",
    actionLabel: "الإجراء",
    actionPlaceholder: "اختر الإجراء...",
    actionToBeAssigned: "للتخصيص",
    actionScheduleHold: "تعليق مجدول",
    actionPendingShipment: "شحن معلق",
    actionCancelled: "ملغي",
    originDC: "مركز التوزيع الأصلي",
    applyAction: "تطبيق الإجراء",
    toBeAssigned: "للتخصيص",
    stagedForDispatch: "مرحلة الإرسال",
    failed: "فشل",
    deliveryPartnerDetails: "تفاصيل شريك التسليم",
    deliveryPartner: "شريك التسليم",
    vehicle: "المركبة",
    city: "مدينة التسليم",
    storage: "ظروف التخزين",
    deliveryType: "نوع التسليم",
    inCity: "داخل المدينة",
    outCity: "خارج المدينة",
    remarks: "ملاحظات (اختياري)",
    assignBtn: "تخصيص لشريك التسليم",
    noInvoices: "لا توجد فواتير",
    loading: "جاري التحميل...",
    onLeave: "شريك التسليم في إجازة — لا يمكن التخصيص",
    inMaint: "المركبة تحت الصيانة — لا يمكن التخصيص",
    lowFuel: "تحذير: وقود منخفض",
    fuelAvailable: "الوقود المتاح",
    odometer: "عداد المسافة",
    estDistance: "التغطية المقدرة",
    efficiency: "الكفاءة",
    vehAlert: "تنبيه المركبة",
    drvAlert: "تنبيه شريك التسليم",
    driverFree: "متاح",
    driverLoad: "مخصص",
    noDrivers: "لا يوجد شركاء تسليم",
    noVehicles: "لا توجد مركبات",
    assignedSuccess: "تم التخصيص إلى",
    actionSuccess: "تم تطبيق الإجراء على",
    invoices: "فاتورة",
    moveBack: "نقل إلى التخصيصات المعلقة",
    moveBackWarn: "يمكن نقل التعليق المجدول والعبور والملغي فقط.",
    selectAll: "تحديد الكل",
    clearAll: "إلغاء التحديد",
    selected: "محددة",
    dateFrom: "من",
    dateTo: "إلى",
    filterDates: "فلتر التاريخ",
    clearFilter: "إلغاء الفلتر",
  }
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function FuelBar({ level, capacity }) {
  const pct = Math.round((level || 0) / (capacity || 80) * 100);
  const color = pct < 25 ? "#ef4444" : pct < 50 ? "#f59e0b" : "#10b981";
  return (
    <div style={{ background: "#e2e8f0", borderRadius: 99, height: 6, overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.4s" }} />
    </div>
  );
}

function ModeToggle({ mode, onChange, t }) {
  return (
    <div style={{ display: "flex", gap: 0, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" }}>
      {[
        ["pending", "📋", t.pendingAllocations],
        ["processed", "✅", t.processedOrders],
      ].map(([id, icon, label]) => (
        <button key={id} onClick={() => onChange(id)}
          style={{
            padding: "10px 20px", border: "none", borderRadius: 8, cursor: "pointer",
            fontSize: 13, fontWeight: 700, transition: "all 0.2s",
            background: mode === id ? "#1A3A5C" : "transparent",
            color: mode === id ? "white" : "#64748b",
            boxShadow: mode === id ? "0 2px 8px rgba(26,58,92,0.25)" : "none",
          }}>
          {icon} {label}
        </button>
      ))}
    </div>
  );
}

function ProcessedSubTabs({ tab, onChange, counts, t }) {
  const tabs = [
    ["toBeAssigned", "📤", t.toBeAssigned, counts.toBeAssigned, "#6366f1"],
    ["staged", "🚚", t.stagedForDispatch, counts.staged, "#0891b2"],
    ["failed", "❌", t.failed, counts.failed, "#ef4444"],
  ];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
      {tabs.map(([id, icon, label, count, accent]) => (
        <button key={id} onClick={() => onChange(id)}
          style={{
            padding: "10px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
            background: tab === id ? accent : "#f1f5f9",
            color: tab === id ? "white" : "#374151",
            boxShadow: tab === id ? `0 2px 8px ${accent}44` : "none",
            transition: "all 0.2s",
          }}>
          {icon} {label}
          <span style={{
            background: tab === id ? "rgba(255,255,255,0.25)" : "#e2e8f0",
            color: tab === id ? "white" : "#64748b",
            fontSize: 11, fontWeight: 800, borderRadius: 99, padding: "2px 7px", minWidth: 20, textAlign: "center"
          }}>{count}</span>
        </button>
      ))}
    </div>
  );
}

function InvoiceRow({ inv, isSelected, onToggle, showAttempts }) {
  const days = Math.floor((new Date() - new Date(inv.date)) / (1000 * 60 * 60 * 24));
  const ageBg = days <= 1 ? "#d1fae5" : days <= 3 ? "#fef3c7" : "#fee2e2";
  const ageColor = days <= 1 ? "#065f46" : days <= 3 ? "#92400e" : "#991b1b";
  const invId = inv.firestoreId || inv.id;
  return (
    <div onClick={() => onToggle(invId)}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
        border: `1.5px solid ${isSelected ? "#6366f1" : "#f1f5f9"}`,
        background: isSelected ? "#eef2ff" : "white",
        borderRadius: 8, marginBottom: 6, cursor: "pointer",
        transition: "all 0.15s",
      }}>
      <span style={{ fontSize: 18, color: "#6366f1", flexShrink: 0 }}>
        {isSelected ? "☑" : "☐"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#6366f1" }}>{inv.id}</div>
        <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inv.customer}</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>{inv.date} · {inv.inst}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 99, background: ageBg, color: ageColor }}>{days}d</span>
        {showAttempts && inv.attempts > 0 && (
          <span style={{ fontSize: 11, color: "#f97316", fontWeight: 700 }}>⚠️ {inv.attempts} attempt(s)</span>
        )}
        {inv.driverName && <span style={{ fontSize: 11, color: "#64748b" }}>👤 {inv.driverName}</span>}
      </div>
    </div>
  );
}

function DateFilter({ dateFrom, dateTo, setDateFrom, setDateTo, onClear, t }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 14, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>📅 {t.filterDates}</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{t.dateFrom}</span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ border: "1.5px solid #e2e8f0", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none" }} />
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{t.dateTo}</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ border: "1.5px solid #e2e8f0", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none" }} />
      </div>
      {(dateFrom || dateTo) && (
        <button onClick={onClear} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
          ✕ {t.clearFilter}
        </button>
      )}
    </div>
  );
}

function VehiclePanel({ selVehicle, t }) {
  if (!selVehicle) return null;
  const fuelLevel = selVehicle.fuelLevel || 0;
  const fuelCap = selVehicle.fuelCapacity || 80;
  const fuelPct = Math.round(fuelLevel / fuelCap * 100);
  const efficiency = selVehicle.mileage || 12;
  const estDist = Math.round(fuelLevel * efficiency);
  const odometer = selVehicle.totalKM || 0;

  const alerts = [
    selVehicle.status === "Maintenance" && t.inMaint,
    fuelLevel < 20 && `${t.lowFuel}: ${fuelLevel}L (${fuelPct}%)`,
    selVehicle.fahas && Math.ceil((new Date(selVehicle.fahas) - new Date()) / 86400000) <= 30 && `Fahas expiring: ${selVehicle.fahas}`,
    selVehicle.insurance && Math.ceil((new Date(selVehicle.insurance) - new Date()) / 86400000) <= 30 && `Insurance expiring: ${selVehicle.insurance}`,
  ].filter(Boolean);

  return (
    <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#0369a1", marginBottom: 10 }}>
        🚗 {selVehicle.plate} — {selVehicle.type} {selVehicle.brand}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, marginBottom: alerts.length ? 10 : 0 }}>
        {[
          { label: `⛽ ${t.fuelAvailable}`, value: `${fuelLevel}L`, sub: `${fuelLevel}/${fuelCap}L (${fuelPct}%)`, color: fuelPct < 25 ? "#ef4444" : fuelPct < 50 ? "#f59e0b" : "#10b981", bar: true },
          { label: `🛣️ ${t.odometer}`, value: odometer.toLocaleString(), sub: "km total", color: "#6366f1" },
          { label: `📍 ${t.estDistance}`, value: `~${estDist}`, sub: "km on fuel", color: "#0891b2" },
          { label: `📊 ${t.efficiency}`, value: efficiency, sub: "km / L", color: "#7c3aed" },
        ].map((item, i) => (
          <div key={i} style={{ background: "white", borderRadius: 8, padding: "8px 10px", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: item.bar ? 4 : 0 }}>{item.sub}</div>
            {item.bar && <FuelBar level={fuelLevel} capacity={fuelCap} />}
          </div>
        ))}
      </div>
      {alerts.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#991b1b", marginBottom: 4 }}>⚠️ {t.vehAlert}</div>
          {alerts.map((a, i) => (
            <div key={i} style={{ fontSize: 12, color: "#991b1b", background: "#fee2e2", borderRadius: 6, padding: "5px 10px", marginBottom: 3, fontWeight: 600 }}>🔴 {a}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Assign({ user, invoices, setInvoices, lang }) {
  const [mode, setMode] = useState("pending"); // "pending" | "processed"
  const [processedTab, setProcessedTab] = useState("toBeAssigned");

  // Pending Allocations state
  const [pendingSelected, setPendingSelected] = useState([]);
  const [pendingAction, setPendingAction] = useState("");
  const [pendingOriginDC, setPendingOriginDC] = useState("");

  // Assignment panel state (used in Processed → To Be Assigned)
  const [selected, setSelected] = useState([]);
  const [driver, setDriver] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [city, setCity] = useState("");
  const [dtype, setDtype] = useState("");
  const [storage, setStorage] = useState("");
  const [remarks, setRemarks] = useState("");

  // Data
  const [fsDrivers, setFsDrivers] = useState([]);
  const [fsVehicles, setFsVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Feedback
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Date filter
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const rtl = lang === "ar";
  const t = T[lang] || T.en;
  const userDC = (user.dc && user.dc !== "Head Office") ? user.dc : "Riyadh";
  const canMoveBack = ["admin", "manager", "planning"].includes(user.role);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const uSnap = await getDocs(collection(db, "users"));
      const allUsers = uSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
      // Delivery partners: active drivers, on-leave shown as greyed/disabled
      setFsDrivers(allUsers.filter(u => u.role === "driver" && u.dc === userDC));

      const vSnap = await getDocs(collection(db, "vehicles"));
      const allVehicles = vSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFsVehicles(allVehicles.filter(v => v.dc === userDC));
    } catch (e) { console.error("Dispatch load error:", e); }
    setLoading(false);
  }

  // ── Invoice buckets ──────────────────────────────────────────────────────
  function applyDateFilter(list) {
    return list.filter(inv => {
      const d = new Date(inv.date);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }

  // Pending Allocations: unassigned + failed-returned + transit-received for this DC
  const pendingInvoices = applyDateFilter(invoices.filter(i =>
    i.dc === userDC && i.uploadBatch &&
    ["pending", "outstanding", "unassigned"].includes(i.status)
  ));

  // Processed Orders buckets
  const toBeAssignedInvoices = applyDateFilter(invoices.filter(i =>
    i.dc === userDC && i.status === "to_be_assigned"
  ));
  const stagedInvoices = applyDateFilter(invoices.filter(i =>
    i.dc === userDC && i.status === "assigned"
  ));
  const failedInvoices = applyDateFilter(invoices.filter(i =>
    i.dc === userDC && i.status === "failed"
  ));

  const processedCounts = {
    toBeAssigned: toBeAssignedInvoices.length,
    staged: stagedInvoices.length,
    failed: failedInvoices.length,
  };

  // Driver workload
  const driverLoad = {};
  invoices.filter(i => i.dc === userDC && i.status === "assigned").forEach(i => {
    if (i.driverId) driverLoad[i.driverId] = (driverLoad[i.driverId] || 0) + 1;
  });

  const selVehicle = fsVehicles.find(v => v.plate === vehicle);
  const selDriverUser = fsDrivers.find(d => d.name === driver);
  const storageOptions = STORAGE_CONDITIONS.map(s => `${s.name} (${s.range})`);
  const dcOptions = ["Riyadh", "Jeddah", "Dammam"].filter(dc => dc !== userDC);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function showSuccess(msg) {
    setSuccess(msg); setError("");
    setTimeout(() => setSuccess(""), 3500);
  }
  function showError(msg) {
    setError(msg);
    setTimeout(() => setError(""), 4000);
  }
  function toggleSelect(id, list, setList, all) {
    setList(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  function selectAll(invoiceList, setList) {
    setList(invoiceList.map(i => i.firestoreId || i.id));
  }
  function clearSel(setList) { setList([]); }

  // ── Apply Action (Pending Allocations) ───────────────────────────────────
  async function applyPendingAction() {
    setError("");
    if (!pendingAction || !pendingSelected.length) return;
    if (pendingAction === "pendingShipment" && !pendingOriginDC) {
      showError("Please select Origin DC for Pending Shipment."); return;
    }

    const statusMap = {
      toBeAssigned: "to_be_assigned",
      scheduleHold: "hold_await",
      pendingShipment: "hold_ship",
      cancelled: "cancelled",
    };
    const newStatus = statusMap[pendingAction];
    const updateData = { status: newStatus, ...(pendingAction === "pendingShipment" ? { originDC: pendingOriginDC } : {}) };

    for (const invId of pendingSelected) {
      const inv = invoices.find(i => (i.id === invId || i.firestoreId === invId));
      if (inv?.firestoreId) {
        try { await updateDoc(doc(db, "invoices", inv.firestoreId), updateData); } catch (e) { console.error(e); }
      }
    }
    setInvoices(prev => prev.map(i =>
      pendingSelected.includes(i.id) || pendingSelected.includes(i.firestoreId)
        ? { ...i, ...updateData } : i
    ));

    showSuccess(`${t.actionSuccess} ${pendingSelected.length} ${t.invoices}.`);
    setPendingSelected([]); setPendingAction(""); setPendingOriginDC("");
  }

  // ── Assign to Delivery Partner ───────────────────────────────────────────
  async function assignToPartner() {
    setError("");
    if (selVehicle?.status === "Maintenance") { showError(t.inMaint); return; }
    if (selDriverUser?.status === "On Leave") { showError(t.onLeave); return; }
    if (!driver || !vehicle || !city || !dtype || !storage || !selected.length) return;

    const updateData = {
      status: "assigned",
      driverId: selDriverUser?.uid || driver,
      driverName: driver,
      vehicle, city, dtype, storage, remarks,
      assignedAt: new Date().toLocaleString(),
    };

    for (const invId of selected) {
      const inv = invoices.find(i => i.id === invId || i.firestoreId === invId);
      if (inv?.firestoreId) {
        try { await updateDoc(doc(db, "invoices", inv.firestoreId), updateData); } catch (e) { console.error(e); }
      }
    }
    setInvoices(prev => prev.map(i =>
      selected.includes(i.id) || selected.includes(i.firestoreId)
        ? { ...i, ...updateData } : i
    ));

    if (selDriverUser?.uid) {
      await sendNotification({
        toUserId: selDriverUser.uid,
        type: "invoice_assigned",
        title: "New Deliveries Assigned",
        message: `${selected.length} new invoice${selected.length > 1 ? "s have" : " has"} been assigned to you by ${user.name}. Please check your Staged for Dispatch tab.`,
      });
    }

    showSuccess(`${selected.length} ${t.assignedSuccess} ${driver}!`);
    setSelected([]); setDriver(""); setVehicle(""); setCity(""); setDtype(""); setStorage(""); setRemarks("");
  }

  // ── Move back to Pending Allocations ────────────────────────────────────
  async function moveBackToPending(invId) {
    const inv = invoices.find(i => i.id === invId || i.firestoreId === invId);
    if (!inv) return;
    const movable = ["hold_await", "hold_ship", "intransit", "cancelled"].includes(inv.status);
    if (!movable) { showError(t.moveBackWarn); return; }
    const updateData = { status: "pending" };
    if (inv.firestoreId) {
      try { await updateDoc(doc(db, "invoices", inv.firestoreId), updateData); } catch (e) { console.error(e); }
    }
    setInvoices(prev => prev.map(i =>
      (i.id === invId || i.firestoreId === invId) ? { ...i, ...updateData } : i
    ));
    showSuccess("Invoice moved back to Pending Allocations.");
  }

  const canAssign = driver && vehicle && city && dtype && storage && selected.length > 0;

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, fontSize: 15, color: "#64748b" }}>⏳ {t.loading}</div>
  );

  return (
    <div style={{ direction: rtl ? "rtl" : "ltr", padding: "0 0 40px" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 22, color: "#0f172a", marginBottom: 4 }}>
          🚚 {t.title}
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>{userDC} Distribution Center</div>
      </div>

      {/* Feedback */}
      {success && <SuccessMsg msg={success} onClose={() => setSuccess("")} />}
      {error && <ErrorMsg msg={error} />}

      {/* Mode Toggle */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{t.activityType}:</div>
        <ModeToggle mode={mode} onChange={m => { setMode(m); setPendingSelected([]); setSelected([]); }} t={t} />
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MODE A: PENDING ALLOCATIONS
         ════════════════════════════════════════════════════════════════════ */}
      {mode === "pending" && (
        <>
          {/* Date Filter */}
          <DateFilter dateFrom={dateFrom} dateTo={dateTo}
            setDateFrom={setDateFrom} setDateTo={setDateTo}
            onClear={() => { setDateFrom(""); setDateTo(""); }} t={t} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", marginBottom: 10 }}>
            <CardTitle style={{ margin: 0 }}>
              📋 {t.pendingAllocations}
              {pendingSelected.length > 0 && (
                <span style={{ background: "#6366f1", color: "white", fontSize: 12, borderRadius: 99, padding: "2px 10px", marginLeft: 8 }}>
                  {pendingSelected.length} {t.selected}
                </span>
              )}
            </CardTitle>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => selectAll(pendingInvoices, setPendingSelected)}
                style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: "#374151", fontWeight: 600 }}>
                {t.selectAll}
              </button>
              <button onClick={() => clearSel(setPendingSelected)}
                style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: "#94a3b8", fontWeight: 600 }}>
                {t.clearAll}
              </button>
            </div>
          </div>

          <Card style={{ marginBottom: 16 }}>
            {pendingInvoices.length === 0
              ? <EmptyState icon="📭" title={t.noInvoices} sub={`${userDC} DC — no pending allocations`} />
              : pendingInvoices.map(inv => {
                const invId = inv.firestoreId || inv.id;
                return (
                  <InvoiceRow key={invId} inv={inv}
                    isSelected={pendingSelected.includes(invId)}
                    onToggle={id => toggleSelect(id, pendingSelected, setPendingSelected)}
                    showAttempts />
                );
              })
            }
          </Card>

          {/* Action Panel */}
          <Card>
            <CardTitle>⚡ {t.actionLabel}</CardTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
              {[
                ["toBeAssigned", "📤", t.actionToBeAssigned, "#6366f1"],
                ["scheduleHold", "📅", t.actionScheduleHold, "#7c3aed"],
                ["pendingShipment", "🚢", t.actionPendingShipment, "#0891b2"],
                ["cancelled", "🚫", t.actionCancelled, "#ef4444"],
              ].map(([val, icon, label, color]) => (
                <button key={val} onClick={() => setPendingAction(val)}
                  style={{
                    border: `2px solid ${pendingAction === val ? color : "#e2e8f0"}`,
                    background: pendingAction === val ? color + "12" : "white",
                    borderRadius: 8, padding: "12px 10px", cursor: "pointer",
                    fontSize: 13, fontWeight: 700, color: pendingAction === val ? color : "#374151",
                    textAlign: "center", transition: "all 0.15s",
                  }}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {pendingAction === "pendingShipment" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                  🏭 {t.originDC} <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select value={pendingOriginDC} onChange={e => setPendingOriginDC(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", background: "white" }}>
                  <option value="">Select origin DC...</option>
                  {dcOptions.map(dc => <option key={dc} value={dc}>{dc}</option>)}
                </select>
              </div>
            )}

            {pendingAction === "cancelled" && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#991b1b", fontWeight: 600 }}>
                ⚠️ Cancelled is permanent. This action cannot be undone.
              </div>
            )}

            <Btn onClick={applyPendingAction}
              disabled={!pendingAction || !pendingSelected.length}
              color={pendingAction === "cancelled" ? "#ef4444" : "#1A3A5C"}
              style={{ width: "100%", padding: 13, fontSize: 14 }}>
              ⚡ {t.applyAction} ({pendingSelected.length} {t.invoices})
            </Btn>
          </Card>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODE B: PROCESSED ORDERS
         ════════════════════════════════════════════════════════════════════ */}
      {mode === "processed" && (
        <>
          {/* Date Filter */}
          <DateFilter dateFrom={dateFrom} dateTo={dateTo}
            setDateFrom={setDateFrom} setDateTo={setDateTo}
            onClear={() => { setDateFrom(""); setDateTo(""); }} t={t} />

          {/* Sub-tabs */}
          <ProcessedSubTabs tab={processedTab} onChange={tab => { setProcessedTab(tab); setSelected([]); }} counts={processedCounts} t={t} />

          {/* ── To Be Assigned tab ─────────────────────────────────────── */}
          {processedTab === "toBeAssigned" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

              {/* Left: Invoice List */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
                    📤 {t.toBeAssigned}
                    {selected.length > 0 && (
                      <span style={{ background: "#6366f1", color: "white", fontSize: 12, borderRadius: 99, padding: "2px 10px", marginLeft: 8 }}>
                        {selected.length} {t.selected}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => selectAll(toBeAssignedInvoices, setSelected)}
                      style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer", color: "#374151", fontWeight: 600 }}>
                      {t.selectAll}
                    </button>
                    <button onClick={() => clearSel(setSelected)}
                      style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer", color: "#94a3b8", fontWeight: 600 }}>
                      {t.clearAll}
                    </button>
                  </div>
                </div>
                <Card style={{ maxHeight: 520, overflowY: "auto" }}>
                  {toBeAssignedInvoices.length === 0
                    ? <EmptyState icon="📭" title={t.noInvoices} />
                    : toBeAssignedInvoices.map(inv => {
                      const invId = inv.firestoreId || inv.id;
                      return (
                        <InvoiceRow key={invId} inv={inv}
                          isSelected={selected.includes(invId)}
                          onToggle={id => toggleSelect(id, selected, setSelected)} />
                      );
                    })
                  }
                </Card>
              </div>

              {/* Right: Delivery Partner Details */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 10 }}>
                  ⚙️ {t.deliveryPartnerDetails}
                </div>
                <Card>
                  {/* Delivery Partner */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                      👤 {t.deliveryPartner} <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    {fsDrivers.length === 0
                      ? <div style={{ padding: "10px 14px", fontSize: 13, color: "#ef4444", background: "#fee2e2", borderRadius: 8 }}>⚠️ {t.noDrivers}</div>
                      : <select value={driver} onChange={e => setDriver(e.target.value)}
                        style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", background: "white", boxSizing: "border-box" }}>
                        <option value="">Select delivery partner...</option>
                        {fsDrivers.map(d => (
                          <option key={d.uid} value={d.name} disabled={d.status === "On Leave"}>
                            {d.name} {d.status === "On Leave" ? "— (On Leave)" : driverLoad[d.uid] ? `— ${driverLoad[d.uid]} ${t.driverLoad}` : `— ${t.driverFree}`}
                          </option>
                        ))}
                      </select>
                    }
                  </div>

                  {/* Driver alert */}
                  {selDriverUser && (() => {
                    const alerts = [
                      selDriverUser.status === "On Leave" && t.onLeave,
                      selDriverUser.licExp && Math.ceil((new Date(selDriverUser.licExp) - new Date()) / 86400000) <= 30 && `License expiring: ${selDriverUser.licExp}`,
                      selDriverUser.driverCardExp && Math.ceil((new Date(selDriverUser.driverCardExp) - new Date()) / 86400000) <= 30 && `Driver card expiring: ${selDriverUser.driverCardExp}`,
                    ].filter(Boolean);
                    return alerts.length > 0 ? (
                      <div style={{ background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: "#92400e", marginBottom: 4 }}>⚠️ {t.drvAlert}: {selDriverUser.name}</div>
                        {alerts.map((a, i) => <div key={i} style={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>🟡 {a}</div>)}
                      </div>
                    ) : null;
                  })()}

                  {/* Vehicle */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                      🚗 {t.vehicle} <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    {fsVehicles.length === 0
                      ? <div style={{ padding: "10px 14px", fontSize: 13, color: "#ef4444", background: "#fee2e2", borderRadius: 8 }}>⚠️ {t.noVehicles}</div>
                      : <select value={vehicle} onChange={e => setVehicle(e.target.value)}
                        style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", background: "white", boxSizing: "border-box" }}>
                        <option value="">Select vehicle...</option>
                        {fsVehicles.map(v => {
                          const pct = Math.round((v.fuelLevel || 0) / (v.fuelCapacity || 80) * 100);
                          return (
                            <option key={v.plate || v.id} value={v.plate} disabled={v.status === "Maintenance"}>
                              {v.plate} — {v.fuelLevel || 0}L ({pct}%){v.status === "Maintenance" ? " [MAINTENANCE]" : ""}
                            </option>
                          );
                        })}
                      </select>
                    }
                  </div>

                  {/* Vehicle detail panel */}
                  <VehiclePanel selVehicle={selVehicle} t={t} />

                  {/* City */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                      📍 {t.city} <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select value={city} onChange={e => setCity(e.target.value)}
                      style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", background: "white", boxSizing: "border-box" }}>
                      <option value="">Select city...</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Storage */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                      🌡️ {t.storage} <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select value={storage} onChange={e => setStorage(e.target.value)}
                      style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", background: "white", boxSizing: "border-box" }}>
                      <option value="">Select storage condition...</option>
                      {storageOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  {/* Delivery Type */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                      🚛 {t.deliveryType} <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[["incity", "🏙️", t.inCity], ["outcity", "🛣️", t.outCity]].map(([v, icon, label]) => (
                        <button key={v} onClick={() => setDtype(v)}
                          style={{
                            flex: 1, border: `2px solid ${dtype === v ? "#6366f1" : "#e2e8f0"}`,
                            background: dtype === v ? "#eef2ff" : "white", borderRadius: 8,
                            padding: "10px 8px", cursor: "pointer", fontSize: 13, fontWeight: 700,
                            color: dtype === v ? "#4338ca" : "#64748b", transition: "all 0.15s",
                          }}>
                          {icon} {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Remarks */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                      💬 {t.remarks}
                    </label>
                    <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
                      placeholder="Add any dispatch notes..."
                      rows={2}
                      style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
                  </div>

                  <Btn onClick={assignToPartner} disabled={!canAssign} style={{ width: "100%", padding: 13, fontSize: 14 }}>
                    🚚 {t.assignBtn} ({selected.length})
                  </Btn>
                </Card>
              </div>
            </div>
          )}

          {/* ── Staged for Dispatch tab ────────────────────────────────── */}
          {processedTab === "staged" && (
            <Card>
              <CardTitle>🚚 {t.stagedForDispatch}</CardTitle>
              {stagedInvoices.length === 0
                ? <EmptyState icon="🚚" title={t.noInvoices} sub="No invoices staged for dispatch" />
                : stagedInvoices.map(inv => {
                  const invId = inv.firestoreId || inv.id;
                  return (
                    <div key={invId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1.5px solid #f1f5f9", borderRadius: 8, marginBottom: 6, background: "white" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#0891b2" }}>{inv.id}</div>
                        <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{inv.customer}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{inv.date} · 👤 {inv.driverName} · 🚗 {inv.vehicle}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>📍 {inv.city} · {inv.dtype === "incity" ? "🏙️ In-City" : "🛣️ Out-City"} · 🌡️ {inv.storage}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "#dbeafe", color: "#1e40af" }}>🚚 Staged</span>
                        {canMoveBack && (
                          <button onClick={() => moveBackToPending(invId)}
                            style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>
                            ↩ {t.moveBack}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              }
            </Card>
          )}

          {/* ── Failed tab ────────────────────────────────────────────── */}
          {processedTab === "failed" && (
            <Card>
              <CardTitle>❌ {t.failed}</CardTitle>
              {failedInvoices.length === 0
                ? <EmptyState icon="✅" title={t.noInvoices} sub="No failed deliveries" />
                : failedInvoices.map(inv => {
                  const invId = inv.firestoreId || inv.id;
                  return (
                    <div key={invId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1.5px solid #fecaca", borderRadius: 8, marginBottom: 6, background: "#fef2f2" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#ef4444" }}>{inv.id}</div>
                        <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{inv.customer}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{inv.date} · {inv.driverName}</div>
                        {inv.failReason && <div style={{ fontSize: 12, color: "#991b1b", fontWeight: 600, marginTop: 2 }}>Reason: {inv.failReason}</div>}
                        {inv.attempts > 0 && <div style={{ fontSize: 12, color: "#f97316", fontWeight: 600 }}>⚠️ {inv.attempts} attempt(s)</div>}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "#fee2e2", color: "#991b1b", flexShrink: 0 }}>❌ Failed</div>
                    </div>
                  );
                })
              }
              {failedInvoices.length > 0 && (
                <div style={{ background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: 8, padding: "10px 14px", marginTop: 12, fontSize: 13, color: "#92400e" }}>
                  ℹ️ {t.moveBackWarn} Failed invoices remain in this history. To re-assign, move them via Pending Allocations → To Be Assigned.
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
