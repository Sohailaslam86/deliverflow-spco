import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import {
  Card, CardTitle, Btn, OutlineBtn, Input, Select,
  SuccessMsg, ErrorMsg, StatCard, TabBar, Modal, EmptyState, WarnBox
} from "../components/Shared.jsx";
import { genId } from "../data/masterData.js";

// ─── Translations ────────────────────────────────────────────────────────────
const T = {
  en: {
    pageTitle: "Fleet Fuel Analytics",
    busLedger: "Fuel Ledger — BUS",
    dynaLedger: "Fuel Ledger — Dyna",
    totalAvailFuel: "Total Available Fuel (Liter)",
    totalCost: "Total Cost (SAR)",
    totalCoverage: "Total Coverage (KM)",
    avgKMPL: "Average KMPL",
    addFuelEntry: "Add Fuel Entry",
    vehicle: "Vehicle",
    driver: "Delivery Partner",
    date: "Date",
    litersAdded: "Liters Added",
    costSAR: "Cost (SAR)",
    tripKM: "Trip KM",
    save: "Save",
    cancel: "Cancel",
    available: "Available",
    capacity: "Total Capacity",
    totalAfter: "Total After Filling",
    exceedsCapacity: "Exceeds capacity — check actual fuel",
    calcEff: "Calculated efficiency",
    noData: "No fuel data yet",
    allVehicles: "Vehicle-wise Fuel Overview",
    efficiency: "Efficiency",
    fuelLogs: "Fuel Logs",
    pendingApprovals: "Pending Approvals",
    approve: "Approve",
    reject: "Reject",
    pending: "Pending Approval",
    approved: "Approved",
    rejected: "Rejected",
    driverSubmit: "Submit for Approval",
    allDC: "All DCs",
    deviation: "Deviation",
    deviationAlert: "DEVIATION ALERT",
    normal: "Normal",
    expected: "Expected Fuel",
    actual: "Actual Used",
    noVehicle: "No vehicles in this category",
    noPending: "No pending fuel entries",
    submittedPending: "Fuel entry submitted — awaiting Manager approval",
  },
  ar: {
    pageTitle: "تحليلات وقود الأسطول",
    busLedger: "دفتر الوقود — BUS",
    dynaLedger: "دفتر الوقود — Dyna",
    totalAvailFuel: "إجمالي الوقود المتاح (لتر)",
    totalCost: "إجمالي التكلفة (SAR)",
    totalCoverage: "إجمالي التغطية (كم)",
    avgKMPL: "متوسط كم/لتر",
    addFuelEntry: "إضافة إدخال وقود",
    vehicle: "المركبة",
    driver: "شريك التوصيل",
    date: "التاريخ",
    litersAdded: "اللترات المضافة",
    costSAR: "التكلفة (SAR)",
    tripKM: "كيلومترات الرحلة",
    save: "حفظ",
    cancel: "إلغاء",
    available: "المتاح",
    capacity: "السعة الكلية",
    totalAfter: "الإجمالي بعد التعبئة",
    exceedsCapacity: "يتجاوز السعة — تحقق من الوقود الفعلي",
    calcEff: "الكفاءة المحسوبة",
    noData: "لا توجد بيانات وقود",
    allVehicles: "نظرة عامة على الوقود حسب المركبة",
    efficiency: "الكفاءة",
    fuelLogs: "سجلات الوقود",
    pendingApprovals: "الموافقات المعلقة",
    approve: "موافقة",
    reject: "رفض",
    pending: "بانتظار الموافقة",
    approved: "معتمد",
    rejected: "مرفوض",
    driverSubmit: "إرسال للموافقة",
    allDC: "جميع المراكز",
    deviation: "الانحراف",
    deviationAlert: "تنبيه انحراف",
    normal: "طبيعي",
    expected: "الوقود المتوقع",
    actual: "الوقود الفعلي",
    noVehicle: "لا توجد مركبات في هذه الفئة",
    noPending: "لا توجد إدخالات وقود معلقة",
    submittedPending: "تم إرسال إدخال الوقود — بانتظار موافقة المدير",
  }
};

const DC_COLORS   = { Riyadh: "#1A3A5C", Jeddah: "#0f766e", Dammam: "#7c3aed" };
const DC_LABELS   = { Riyadh: "Riyadh Distribution Center", Jeddah: "Jeddah Distribution Center", Dammam: "Dammam Distribution Center" };
const TYPE_COLORS = { BUS: "#3b82f6", Dyna: "#f59e0b" };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getUserDC(user) {
  if (!user.dc || user.dc === "Head Office") return null;
  return user.dc;
}

function canApprove(role) {
  return ["admin", "manager", "logistic"].includes(role);
}

function canSubmitDirect(role) {
  // Admin, Logistic, DC Manager — direct add (no approval needed)
  // Driver — submits request, Manager or Logistic approves
  return ["admin", "logistic", "manager"].includes(role);
}

// ─── Fleet Summary Card (BUS or Dyna) ────────────────────────────────────────
function FleetTypeCard({ type, vehicles, fuelLogs, t }) {
  const color = TYPE_COLORS[type] || "#64748b";
  const vList = vehicles.filter(v => v.type === type);
  const logs  = fuelLogs.filter(l => vList.some(v => v.plate === l.vehicle) && l.status !== "pending_approval" && l.status !== "rejected");
  const tL    = logs.reduce((s, l) => s + (l.liters || 0), 0);
  const tKM   = logs.reduce((s, l) => s + (l.tripKM || 0), 0);
  const tSAR  = logs.reduce((s, l) => s + (l.sar || 0), 0);
  const avail = vList.reduce((s, v) => s + (v.fuelLevel || 0), 0);

  return (
    <Card style={{ borderTop: `4px solid ${color}`, marginBottom: 16 }}>
      <CardTitle style={{ color }}>
        {type === "BUS" ? "🚌" : "🚛"} {type === "BUS" ? t.busLedger : t.dynaLedger}
        <span style={{ fontSize: 13, fontWeight: 400, color: "#64748b", marginLeft: 8 }}>
          ({vList.length} vehicles)
        </span>
      </CardTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        <StatCard icon="⛽" label={t.totalAvailFuel} value={avail + "L"}  color={color} />
        <StatCard icon="💰" label={t.totalCost}      value={"SAR " + tSAR} color="#ef4444" />
        <StatCard icon="🛣️" label={t.totalCoverage}  value={tKM + " km"}  color="#6366f1" />
        <StatCard icon="📊" label={t.avgKMPL}        value={tL > 0 ? (tKM / tL).toFixed(1) + " km/L" : "-"} color="#10b981" />
      </div>
    </Card>
  );
}

// ─── Vehicle Row in "Vehicle Wise" tab ───────────────────────────────────────
function VehicleRow({ v, logs }) {
  const vLogs = logs.filter(l => l.vehicle === v.plate && l.status !== "pending_approval" && l.status !== "rejected");
  const tL    = vLogs.reduce((s, l) => s + (l.liters || 0), 0);
  const tKM   = vLogs.reduce((s, l) => s + (l.tripKM || 0), 0);
  const tSAR  = vLogs.reduce((s, l) => s + (l.sar || 0), 0);
  const eff   = tL > 0 ? (tKM / tL).toFixed(1) : "-";
  const last  = [...vLogs].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const pct   = Math.round(((v.fuelLevel || 0) / (v.fuelCapacity || 80)) * 100);
  const effColor = Number(eff) >= 10 ? "#10b981" : Number(eff) >= 7 ? "#f59e0b" : "#ef4444";

  return (
    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
      <td style={{ padding: "12px 14px" }}>
        <span style={{ fontWeight: 700, color: TYPE_COLORS[v.type] || "#6366f1" }}>{v.plate}</span>
        <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 6 }}>{v.type}</span>
      </td>
      <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 13 }}>{DC_LABELS[v.dc] || v.dc}</td>
      <td style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 99, height: 8, overflow: "hidden", minWidth: 60 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct < 25 ? "#ef4444" : "#10b981" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{v.fuelLevel || 0}L / {v.fuelCapacity || 80}L</span>
        </div>
      </td>
      <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 13 }}>{last ? last.date + " (" + last.liters + "L)" : "—"}</td>
      <td style={{ padding: "12px 14px", fontWeight: 700, color: effColor }}>{eff} km/L</td>
      <td style={{ padding: "12px 14px", fontSize: 13, color: "#64748b" }}>{tSAR > 0 ? "SAR " + tSAR : "—"}</td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Fuel({ user, fuelLogs, setFuelLogs, vehicles, setVehicles, lang }) {
  const [dcTab,    setDcTab]    = useState("all");
  const [tab,      setTab]      = useState("vehicleWise");
  const [showForm, setShowForm] = useState(false);
  const [done,     setDone]     = useState("");
  const [errMsg,   setErrMsg]   = useState("");

  // Firestore data
  const [fsVehicles, setFsVehicles] = useState([]);
  const [fsDrivers,  setFsDrivers]  = useState([]);

  // Form state
  const emptyForm = {
    date: new Date().toISOString().split("T")[0],
    vehicle: "", driver: "", liters: "", sar: "", tripKM: ""
  };
  const [form, setForm] = useState(emptyForm);

  const rtl   = lang === "ar";
  const t     = T[lang] || T.en;
  const role  = user.role;
  const userDC = getUserDC(user);
  const isDriver  = role === "driver";
  const isApprover = canApprove(role);
  const isDirect   = canSubmitDirect(role);

  // ── DC tab options ──────────────────────────────────────────────────────────
  const showAllDCTabs = !userDC; // admin, management (no DC)
  const dcTabs = showAllDCTabs
    ? [["all", "🌐", t.allDC], ["Riyadh", "📍", "Riyadh"], ["Jeddah", "📍", "Jeddah"], ["Dammam", "📍", "Dammam"]]
    : [[userDC, "📍", userDC]];

  // ── Load Firestore ──────────────────────────────────────────────────────────
  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const vSnap = await getDocs(collection(db, "vehicles"));
      setFsVehicles(vSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const uSnap = await getDocs(collection(db, "users"));
      setFsDrivers(uSnap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(u => u.role === "driver"));
    } catch (e) { console.error(e); }
  }

  const allVehicles = fsVehicles.length > 0 ? fsVehicles : vehicles;
  const allDrivers  = fsDrivers;

  // ── Active DC filter ────────────────────────────────────────────────────────
  const activeDC = userDC || (dcTab === "all" ? null : dcTab);

  const myVehicles = activeDC ? allVehicles.filter(v => v.dc === activeDC) : allVehicles;
  const myDrivers  = activeDC ? allDrivers.filter(d => d.dc === activeDC)  : allDrivers;
  const myLogs     = activeDC ? fuelLogs.filter(l => l.dc === activeDC)     : fuelLogs;

  const approvedLogs = myLogs.filter(l => l.status !== "pending_approval" && l.status !== "rejected");
  const pendingLogs  = fuelLogs.filter(l => l.status === "pending_approval" &&
    (isApprover ? (activeDC ? l.dc === activeDC : true) : l.driver === user.name));

  // ── Capacity check ──────────────────────────────────────────────────────────
  const selVehicle = myVehicles.find(v => v.plate === form.vehicle);
  const available  = selVehicle ? (selVehicle.fuelLevel || 0) : 0;
  const capacity   = selVehicle ? (selVehicle.fuelCapacity || 80) : 0;
  const space      = capacity - available;
  const afterFill  = available + Number(form.liters || 0);
  const overCap    = form.liters && Number(form.liters) > space;
  const calcEff    = form.liters && form.tripKM ? (Number(form.tripKM) / Number(form.liters)).toFixed(1) : null;

  // ── Add Fuel Entry ──────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!form.vehicle || !form.liters) return;
    if (overCap) { setErrMsg(t.exceedsCapacity); return; }
    setErrMsg("");

    const dc = activeDC || selVehicle?.dc || "Riyadh";
    const status = isDriver ? "pending_approval" : "approved";
    const entry = {
      id: genId("FUEL"),
      ...form,
      liters:  Number(form.liters),
      sar:     Number(form.sar),
      tripKM:  Number(form.tripKM),
      dc,
      status,
      submittedBy: user.name,
      submittedRole: role,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "fuelLogs"), entry);
    } catch (e) { /* offline fallback */ }

    setFuelLogs(prev => [...prev, entry]);

    // Only update vehicle fuel if approved immediately
    if (!isDriver) {
      setVehicles(prev => prev.map(v =>
        v.plate === form.vehicle
          ? { ...v, fuelLevel: Math.min((v.fuelLevel || 0) + Number(form.liters), v.fuelCapacity || 80), totalKM: (v.totalKM || 0) + Number(form.tripKM) }
          : v
      ));
    }

    setDone(isDriver ? t.submittedPending : entry.id + " added!");
    setShowForm(false);
    setForm(emptyForm);
    setTimeout(() => setDone(""), 4000);
  }

  // ── Approve / Reject ────────────────────────────────────────────────────────
  async function handleApproval(logId, action) {
    const log = fuelLogs.find(l => l.id === logId);
    if (!log) return;

    const newStatus = action === "approve" ? "approved" : "rejected";
    setFuelLogs(prev => prev.map(l => l.id === logId ? { ...l, status: newStatus, approvedBy: user.name } : l));

    if (action === "approve") {
      setVehicles(prev => prev.map(v =>
        v.plate === log.vehicle
          ? { ...v, fuelLevel: Math.min((v.fuelLevel || 0) + log.liters, v.fuelCapacity || 80), totalKM: (v.totalKM || 0) + log.tripKM }
          : v
      ));
    }

    try {
      const snap = await getDocs(collection(db, "fuelLogs"));
      const docRef = snap.docs.find(d => d.data().id === logId);
      if (docRef) await updateDoc(doc(db, "fuelLogs", docRef.id), { status: newStatus, approvedBy: user.name });
    } catch (e) { /* offline */ }

    setDone(action === "approve" ? "✅ Fuel entry approved!" : "❌ Fuel entry rejected.");
    setTimeout(() => setDone(""), 3000);
  }

  // ── Efficiency stats per vehicle ────────────────────────────────────────────
  function vStats(vList) {
    return vList.map(v => {
      const logs = approvedLogs.filter(l => l.vehicle === v.plate).sort((a, b) => new Date(b.date) - new Date(a.date));
      const tL   = logs.reduce((s, l) => s + (l.liters || 0), 0);
      const tKM  = logs.reduce((s, l) => s + (l.tripKM || 0), 0);
      const tSAR = logs.reduce((s, l) => s + (l.sar || 0), 0);
      const eff  = tL > 0 ? (tKM / tL).toFixed(1) : "-";
      const expectedFuel = tKM > 0 && v.mileage ? (tKM / v.mileage).toFixed(1) : "-";
      const deviation    = tL > 0 && expectedFuel !== "-" ? (tL - Number(expectedFuel)).toFixed(1) : null;
      return { v, logs, tL, tKM, tSAR, eff, expectedFuel, deviation };
    });
  }

  const busVehicles  = myVehicles.filter(v => v.type === "BUS");
  const dynaVehicles = myVehicles.filter(v => v.type === "Dyna");
  const busStats     = vStats(busVehicles);
  const dynaStats    = vStats(dynaVehicles);

  const mainTabs = [
    ["vehicleWise", "🚗", t.allVehicles],
    ["logs",        "📋", t.fuelLogs],
    ["efficiency",  "📊", t.efficiency],
    ...(isApprover && pendingLogs.length > 0
      ? [["approvals", "⏳", t.pendingApprovals + " (" + pendingLogs.length + ")"]]
      : []),
  ];

  // ── Status badge inline ─────────────────────────────────────────────────────
  function StatusPill({ status }) {
    const map = {
      approved:         { bg: "#d1fae5", c: "#065f46", label: "✅ Approved" },
      pending_approval: { bg: "#fef3c7", c: "#92400e", label: "⏳ Pending" },
      rejected:         { bg: "#fee2e2", c: "#991b1b", label: "❌ Rejected" },
    };
    const s = map[status] || map.approved;
    return (
      <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: s.bg, color: s.c }}>
        {s.label}
      </span>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ direction: rtl ? "rtl" : "ltr" }}>

      {/* Page title */}
      <div style={{ fontWeight: 800, fontSize: 20, color: "#0f172a", marginBottom: 16 }}>
        ⛽ {t.pageTitle}
      </div>

      {done   && <SuccessMsg msg={done} onClose={() => setDone("")} />}
      {errMsg && <ErrorMsg msg={errMsg} />}

      {/* DC Tabs — Admin / Management */}
      {showAllDCTabs && (
        <TabBar tabs={dcTabs} active={dcTab} onChange={v => { setDcTab(v); setForm(emptyForm); }} />
      )}

      {/* ── BUS Ledger ── */}
      <FleetTypeCard type="BUS"  vehicles={myVehicles} fuelLogs={myLogs} t={t} />
      {/* ── Dyna Ledger ── */}
      <FleetTypeCard type="Dyna" vehicles={myVehicles} fuelLogs={myLogs} t={t} />

      {/* ── Top Bar: main tabs + Add button ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <TabBar tabs={mainTabs} active={tab} onChange={setTab} />
        {isDirect && (
          <Btn small onClick={() => { setShowForm(!showForm); setErrMsg(""); }}>
            ⛽ {t.addFuelEntry}
          </Btn>
        )}
      </div>

      {/* ── Add Fuel Entry Form ── */}
      {showForm && (
        <Card>
          <CardTitle>⛽ {t.addFuelEntry}</CardTitle>

          {isDriver && (
            <WarnBox>Your entry will be sent for Manager/Logistic approval before being saved.</WarnBox>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>

            {/* Date */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                📅 {t.date}
              </label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "11px 14px", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Vehicle */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                🚗 {t.vehicle} *
              </label>
              <select value={form.vehicle} onChange={e => { setForm({ ...form, vehicle: e.target.value, liters: "" }); setErrMsg(""); }}
                style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "11px 14px", fontSize: 15, outline: "none", background: "white", boxSizing: "border-box" }}>
                <option value="">Select vehicle...</option>
                {myVehicles.map(v => (
                  <option key={v.plate || v.id} value={v.plate}>
                    {v.plate} ({v.type}) — {v.fuelLevel || 0}L / {v.fuelCapacity || 80}L
                  </option>
                ))}
              </select>
            </div>

            {/* Driver */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                👤 {t.driver}
              </label>
              {isDriver ? (
                <input value={user.name} readOnly
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "11px 14px", fontSize: 15, outline: "none", boxSizing: "border-box", background: "#f8fafc", color: "#64748b" }} />
              ) : (
                <select value={form.driver} onChange={e => setForm({ ...form, driver: e.target.value })}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "11px 14px", fontSize: 15, outline: "none", background: "white", boxSizing: "border-box" }}>
                  <option value="">Select delivery partner...</option>
                  {myDrivers.map(d => <option key={d.uid} value={d.name}>{d.name}</option>)}
                </select>
              )}
            </div>

            {/* Liters */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                ⛽ {t.litersAdded} *
              </label>
              <input type="number" value={form.liters}
                onChange={e => { setForm({ ...form, liters: e.target.value }); setErrMsg(""); }}
                placeholder={selVehicle ? `Max ${space}L` : "45"}
                style={{ width: "100%", border: `1.5px solid ${overCap ? "#ef4444" : "#e2e8f0"}`, borderRadius: 8, padding: "11px 14px", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Cost */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                💰 {t.costSAR}
              </label>
              <input type="number" value={form.sar} onChange={e => setForm({ ...form, sar: e.target.value })} placeholder="90"
                style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "11px 14px", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Trip KM */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                🛣️ {t.tripKM}
              </label>
              <input type="number" value={form.tripKM} onChange={e => setForm({ ...form, tripKM: e.target.value })} placeholder="350"
                style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "11px 14px", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

          {/* Capacity preview */}
          {selVehicle && (
            <div style={{ background: overCap ? "#fee2e2" : "#f0fdf4", padding: "12px 16px", borderRadius: 8, fontSize: 14, marginBottom: 14, display: "flex", gap: 24, flexWrap: "wrap" }}>
              <span>⛽ {t.available}: <b>{available}L</b></span>
              <span>🏷️ {t.capacity}: <b>{capacity}L</b></span>
              {form.liters && (
                <span style={{ fontWeight: 700, color: overCap ? "#991b1b" : "#065f46" }}>
                  {overCap ? "⚠️ " + t.exceedsCapacity : "✅ " + t.totalAfter + ": " + afterFill + "L"}
                </span>
              )}
            </div>
          )}

          {/* Efficiency preview */}
          {calcEff && !overCap && (
            <div style={{ background: "#eff6ff", padding: "10px 14px", borderRadius: 8, fontSize: 14, marginBottom: 14 }}>
              📊 {t.calcEff}: <b>{calcEff} km/L</b>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={handleSubmit} color="#10b981"
              disabled={!form.vehicle || !form.liters || !!overCap}>
              {isDriver ? `📨 ${t.driverSubmit}` : `✅ ${t.save}`}
            </Btn>
            <Btn onClick={() => { setShowForm(false); setErrMsg(""); form.vehicle && setForm(emptyForm); }} color="#64748b">
              {t.cancel}
            </Btn>
          </div>
        </Card>
      )}

      {/* ────── TAB: Vehicle Wise ────── */}
      {tab === "vehicleWise" && (
        <div>
          {/* BUS section */}
          <Card>
            <CardTitle style={{ color: TYPE_COLORS.BUS }}>🚌 BUS — {t.allVehicles}</CardTitle>
            {busVehicles.length === 0
              ? <EmptyState icon="🚌" title={t.noVehicle} />
              : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {[t.vehicle, "DC", t.totalAvailFuel, "Last Refill", t.avgKMPL, t.totalCost].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>{busStats.map(s => <VehicleRow key={s.v.plate || s.v.id} v={s.v} logs={approvedLogs} />)}</tbody>
                  </table>
                </div>
              )
            }
          </Card>

          {/* Dyna section */}
          <Card>
            <CardTitle style={{ color: TYPE_COLORS.Dyna }}>🚛 Dyna — {t.allVehicles}</CardTitle>
            {dynaVehicles.length === 0
              ? <EmptyState icon="🚛" title={t.noVehicle} />
              : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {[t.vehicle, "DC", t.totalAvailFuel, "Last Refill", t.avgKMPL, t.totalCost].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>{dynaStats.map(s => <VehicleRow key={s.v.plate || s.v.id} v={s.v} logs={approvedLogs} />)}</tbody>
                  </table>
                </div>
              )
            }
          </Card>
        </div>
      )}

      {/* ────── TAB: Fuel Logs ────── */}
      {tab === "logs" && (
        <Card>
          <CardTitle>📋 {t.fuelLogs} ({myLogs.length})</CardTitle>
          {myLogs.length === 0
            ? <EmptyState icon="📋" title={t.noData} />
            : [...myLogs].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)).map(log => (
              <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: TYPE_COLORS[myVehicles.find(v=>v.plate===log.vehicle)?.type] || "#6366f1", minWidth: 90 }}>{log.vehicle}</span>
                <span style={{ fontSize: 13, color: "#94a3b8", minWidth: 80 }}>{myVehicles.find(v=>v.plate===log.vehicle)?.type || ""}</span>
                <span style={{ fontSize: 14, flex: 1, minWidth: 100 }}>{log.driver || "—"}</span>
                <span>⛽ {log.liters}L</span>
                <span>💰 SAR {log.sar}</span>
                <span>🛣️ {log.tripKM}km</span>
                <span style={{ fontWeight: 700, color: "#10b981" }}>
                  {log.liters > 0 && log.tripKM > 0 ? (log.tripKM / log.liters).toFixed(1) : "—"} km/L
                </span>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>📅 {log.date}</span>
                <StatusPill status={log.status || "approved"} />
              </div>
            ))
          }
        </Card>
      )}

      {/* ────── TAB: Efficiency ────── */}
      {tab === "efficiency" && (
        <div>
          {/* BUS efficiency */}
          <Card>
            <CardTitle style={{ color: TYPE_COLORS.BUS }}>🚌 BUS — {t.efficiency}</CardTitle>
            {busStats.filter(s => s.tL > 0).length === 0
              ? <EmptyState icon="📊" title={t.noData} />
              : busStats.filter(s => s.tL > 0).map(({ v, tL, tKM, tSAR, eff, expectedFuel, deviation }) => (
                <div key={v.plate || v.id} style={{ padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>
                      {v.plate}
                      <span style={{ fontSize: 13, color: "#64748b", fontWeight: 400, marginLeft: 6 }}>
                        {DC_LABELS[v.dc] || v.dc}
                      </span>
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 20, color: Number(eff) >= 10 ? "#10b981" : Number(eff) >= 7 ? "#f59e0b" : "#ef4444" }}>
                      {eff} km/L
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 14, color: "#64748b", flexWrap: "wrap", marginBottom: 8 }}>
                    <span>⛽ {t.actual}: {tL}L</span>
                    <span>🛣️ {tKM}km</span>
                    <span>💰 SAR {tSAR}</span>
                    <span>📊 {t.expected}: {expectedFuel}L</span>
                  </div>
                  {deviation !== null && (
                    <div style={{ fontSize: 13, fontWeight: 600, padding: "8px 12px", borderRadius: 8,
                      background: Math.abs(Number(deviation)) > 5 ? "#fee2e2" : "#d1fae5",
                      color: Math.abs(Number(deviation)) > 5 ? "#991b1b" : "#065f46" }}>
                      {Math.abs(Number(deviation)) > 5
                        ? "⚠️ " + t.deviationAlert + ": " + Number(deviation).toFixed(1) + "L difference"
                        : "✅ " + t.normal + " (" + t.deviation + ": " + Number(deviation).toFixed(1) + "L)"}
                    </div>
                  )}
                </div>
              ))
            }
          </Card>

          {/* Dyna efficiency */}
          <Card>
            <CardTitle style={{ color: TYPE_COLORS.Dyna }}>🚛 Dyna — {t.efficiency}</CardTitle>
            {dynaStats.filter(s => s.tL > 0).length === 0
              ? <EmptyState icon="📊" title={t.noData} />
              : dynaStats.filter(s => s.tL > 0).map(({ v, tL, tKM, tSAR, eff, expectedFuel, deviation }) => (
                <div key={v.plate || v.id} style={{ padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>
                      {v.plate}
                      <span style={{ fontSize: 13, color: "#64748b", fontWeight: 400, marginLeft: 6 }}>
                        {DC_LABELS[v.dc] || v.dc}
                      </span>
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 20, color: Number(eff) >= 10 ? "#10b981" : Number(eff) >= 7 ? "#f59e0b" : "#ef4444" }}>
                      {eff} km/L
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 14, color: "#64748b", flexWrap: "wrap", marginBottom: 8 }}>
                    <span>⛽ {t.actual}: {tL}L</span>
                    <span>🛣️ {tKM}km</span>
                    <span>💰 SAR {tSAR}</span>
                    <span>📊 {t.expected}: {expectedFuel}L</span>
                  </div>
                  {deviation !== null && (
                    <div style={{ fontSize: 13, fontWeight: 600, padding: "8px 12px", borderRadius: 8,
                      background: Math.abs(Number(deviation)) > 5 ? "#fee2e2" : "#d1fae5",
                      color: Math.abs(Number(deviation)) > 5 ? "#991b1b" : "#065f46" }}>
                      {Math.abs(Number(deviation)) > 5
                        ? "⚠️ " + t.deviationAlert + ": " + Number(deviation).toFixed(1) + "L difference"
                        : "✅ " + t.normal + " (" + t.deviation + ": " + Number(deviation).toFixed(1) + "L)"}
                    </div>
                  )}
                </div>
              ))
            }
          </Card>
        </div>
      )}

      {/* ────── TAB: Pending Approvals ────── */}
      {tab === "approvals" && isApprover && (
        <Card>
          <CardTitle>⏳ {t.pendingApprovals}</CardTitle>
          {pendingLogs.length === 0
            ? <EmptyState icon="✅" title={t.noPending} />
            : pendingLogs.map(log => {
              const veh = allVehicles.find(v => v.plate === log.vehicle);
              return (
                <div key={log.id} style={{
                  border: "1.5px solid #fde68a", borderRadius: 10, padding: "16px 18px",
                  marginBottom: 12, background: "#fffbeb"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#92400e" }}>{log.vehicle}</span>
                      {veh && <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>{veh.type}</span>}
                      <span style={{ fontSize: 13, color: "#64748b", marginLeft: 12 }}>👤 {log.driver || log.submittedBy}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>📅 {log.date}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 14, color: "#78350f", flexWrap: "wrap", marginBottom: 12 }}>
                    <span>⛽ {log.liters}L added</span>
                    {log.sar > 0 && <span>💰 SAR {log.sar}</span>}
                    {log.tripKM > 0 && <span>🛣️ {log.tripKM}km</span>}
                    {log.liters && log.tripKM ? <span>📊 {(log.tripKM / log.liters).toFixed(1)} km/L</span> : null}
                  </div>
                  {veh && (
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                      Current tank: {veh.fuelLevel || 0}L / {veh.fuelCapacity || 80}L
                      → After approval: {Math.min((veh.fuelLevel || 0) + log.liters, veh.fuelCapacity || 80)}L
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn small onClick={() => handleApproval(log.id, "approve")} color="#10b981">✅ {t.approve}</Btn>
                    <Btn small onClick={() => handleApproval(log.id, "reject")} color="#ef4444">❌ {t.reject}</Btn>
                  </div>
                </div>
              );
            })
          }
        </Card>
      )}
    </div>
  );
}
