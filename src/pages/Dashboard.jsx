import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardTitle, StatCard } from "../components/Shared.jsx";

// ─── TRANSLATIONS ────────────────────────────────────────────────
const T = {
  en: {
    welcome:"Welcome back",
    opsOverview:"Operations Overview",
    deliverables:"Deliverables",
    allDCs:"All Distribution Centers",
    riyadh:"Riyadh", jeddah:"Jeddah", dammam:"Dammam",
    fromDate:"From", toDate:"To",
    today:"Today", thisWeek:"This Week", thisMonth:"This Month", allTime:"All Time",
    // Left side
    deliveryRate:"Delivery Rate", vehicleUtil:"Vehicle Utilization",
    driverUtil:"Driver Utilization", alerts:"Alerts",
    activeVeh:"Active Vehicles", totalVeh:"Total Vehicles",
    activeDrivers:"Active Drivers", totalDrivers:"Total Drivers",
    howCalc:"How calculated",
    // Right side — Deliverables tabs
    unassigned:"Unassigned", toBeAssigned:"To Be Assigned",
    stagedForDispatch:"Staged for Dispatch", scheduleHold:"Schedule Hold",
    transit:"Transit", delivered:"Delivered", failed:"Failed", cancelled:"Cancelled",
    total:"Total Invoices",
    // Alerts
    agingAlert:"Aging Alert", agingDesc:"invoices unassigned for 3+ days",
    slaAlert:"SLA Breach", slaDesc:"transit trips past due date",
    noAlerts:"No active alerts",
    // Planning view
    planningTitle:"Upload & Invoice Overview",
    totalUploaded:"Total Invoices", totalBatches:"Total Batches",
    govt:"Government", priv:"Private", todaySummary:"Today's Summary",
    invoices:"invoices", uploadedBy:"Uploaded by",
    // Loading
    loading:"Loading data...",
    // Logistic view
    logisticTitle:"Fleet & Driver Overview",
  },
  ar: {
    welcome:"مرحباً بعودتك",
    opsOverview:"نظرة عامة على العمليات",
    deliverables:"المستحقات",
    allDCs:"جميع مراكز التوزيع",
    riyadh:"الرياض", jeddah:"جدة", dammam:"الدمام",
    fromDate:"من", toDate:"إلى",
    today:"اليوم", thisWeek:"هذا الأسبوع", thisMonth:"هذا الشهر", allTime:"كل الوقت",
    deliveryRate:"معدل التسليم", vehicleUtil:"استخدام المركبات",
    driverUtil:"استخدام السائقين", alerts:"التنبيهات",
    activeVeh:"مركبات نشطة", totalVeh:"إجمالي المركبات",
    activeDrivers:"سائقون نشطون", totalDrivers:"إجمالي السائقين",
    howCalc:"طريقة الحساب",
    unassigned:"غير مخصصة", toBeAssigned:"للتخصيص",
    stagedForDispatch:"مرحلة الإرسال", scheduleHold:"جدولة مؤقتة",
    transit:"عبور", delivered:"مسلمة", failed:"فاشلة", cancelled:"ملغاة",
    total:"إجمالي الفواتير",
    agingAlert:"تنبيه التقادم", agingDesc:"فواتير غير مخصصة لأكثر من 3 أيام",
    slaAlert:"خرق مستوى الخدمة", slaDesc:"رحلات عبور متأخرة",
    noAlerts:"لا توجد تنبيهات نشطة",
    planningTitle:"نظرة عامة على الرفع والفواتير",
    totalUploaded:"إجمالي الفواتير", totalBatches:"إجمالي الدفعات",
    govt:"حكومي", priv:"خاص", todaySummary:"ملخص اليوم",
    invoices:"فواتير", uploadedBy:"رفع بواسطة",
    loading:"جاري التحميل...",
    logisticTitle:"نظرة عامة على الأسطول والسائقين",
  }
};

const DC_LIST = ["Riyadh","Jeddah","Dammam"];
const DC_COLORS = { Riyadh:"#1A3A5C", Jeddah:"#0f766e", Dammam:"#7c3aed" };

// ─── HELPERS ─────────────────────────────────────────────────────
function getToday() { return new Date().toISOString().split("T")[0]; }
function getQuickRange(q) {
  const now = new Date();
  const today = getToday();
  if (q==="today") return { from:today, to:today };
  if (q==="week") { const d=new Date(now); d.setDate(d.getDate()-6); return { from:d.toISOString().split("T")[0], to:today }; }
  if (q==="month") { const d=new Date(now); d.setDate(1); return { from:d.toISOString().split("T")[0], to:today }; }
  const d=new Date(now); d.setFullYear(d.getFullYear()-1);
  return { from:d.toISOString().split("T")[0], to:today };
}

function filterByDateRange(invList, from, to) {
  return invList.filter(i => {
    if (!i.date) return true;
    return i.date >= from && i.date <= to;
  });
}

function calcDeliveryRate(inv) {
  const countable = inv.filter(i=>!["scheduled","hold_await","hold_ship","intransit","cancelled"].includes(i.status));
  const del = inv.filter(i=>i.status==="delivered").length;
  return countable.length > 0 ? Math.round(del/countable.length*100) : 0;
}

function rateColor(r) { return r>=80?"#10b981":r>=50?"#f59e0b":"#ef4444"; }

// ─── DATE RANGE PICKER ───────────────────────────────────────────
function DateRangePicker({ from, to, setFrom, setTo, t }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:14 }}>
      <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>{t.fromDate}:</span>
      <input type="date" value={from} onChange={e=>setFrom(e.target.value)}
        style={{ border:"1.5px solid #e2e8f0", borderRadius:7, padding:"5px 10px", fontSize:12, outline:"none" }} />
      <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>{t.toDate}:</span>
      <input type="date" value={to} onChange={e=>setTo(e.target.value)}
        style={{ border:"1.5px solid #e2e8f0", borderRadius:7, padding:"5px 10px", fontSize:12, outline:"none" }} />
      <div style={{ display:"flex", gap:4 }}>
        {[["today",t.today],["week",t.thisWeek],["month",t.thisMonth],["all",t.allTime]].map(([v,l])=>(
          <button key={v} onClick={()=>{ const r=getQuickRange(v); setFrom(r.from); setTo(r.to); }}
            style={{ padding:"5px 10px", borderRadius:6, border:"1.5px solid #e2e8f0", background:"#f8fafc", color:"#374151", cursor:"pointer", fontSize:11, fontWeight:600 }}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── DC HORIZONTAL TABS ──────────────────────────────────────────
function DCTabs({ active, onChange, t, userDC, color="#1A3A5C" }) {
  const tabs = userDC
    ? [[userDC, userDC]]
    : [["all", t.allDCs], ["Riyadh", t.riyadh], ["Jeddah", t.jeddah], ["Dammam", t.dammam]];
  return (
    <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
      {tabs.map(([val,label])=>(
        <button key={val} onClick={()=>onChange(val)}
          style={{ padding:"7px 16px", borderRadius:7, border:"none",
            background:active===val?color:"#f1f5f9",
            color:active===val?"white":"#374151",
            cursor:"pointer", fontSize:13, fontWeight:600 }}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── LEFT SECTION: OPERATIONS OVERVIEW ──────────────────────────
function OperationsOverview({ invoices, vehicles, users, alerts, trips, t, lang, userDC, isLogistic }) {
  const [dcTab, setDcTab] = useState(userDC||"all");
  const [from, setFrom] = useState(()=>{ const d=new Date(); d.setDate(1); return d.toISOString().split("T")[0]; });
  const [to, setTo] = useState(getToday());
  const rtl = lang==="ar";

  function getMetrics(dc) {
    const inv = filterByDateRange(
      (dc==="all" ? invoices : invoices.filter(i=>i.dc===dc)).filter(i=>i.uploadBatch),
      from, to
    );
    const veh = dc==="all" ? vehicles : vehicles.filter(v=>v.dc===dc);
    const drv = (users||[]).filter(u=>u.role==="driver"&&(dc==="all"||u.dc===dc)&&(u.status==="active"||u.status==="Active"));
    const activeV = veh.filter(v=>v.status==="Active").length;
    const activeD = drv.filter(d=>{
      return inv.some(i=>i.driverId===d.uid&&["staged","assigned"].includes(i.status));
    }).length;
    const rate = calcDeliveryRate(inv);
    const vUtil = veh.length>0?Math.round(activeV/veh.length*100):0;
    const dUtil = drv.length>0?Math.round(activeD/drv.length*100):0;
    const dcAlerts = (alerts||[]).filter(a=>a.status==="active"&&(dc==="all"||a.dc===dc));

    // Aging alert — 3+ days unassigned
    const today = new Date();
    const agingCount = inv.filter(i=>{
      if (i.status!=="pending") return false;
      if (!i.date) return false;
      const diff = Math.floor((today-new Date(i.date))/(1000*60*60*24));
      return diff>=3;
    }).length;

    // SLA breach — trips past tentative date
    const slaBreached = (trips||[]).filter(t2=>{
      if (t2.status==="delivered") return false;
      if (!t2.tentativeDate) return false;
      return t2.tentativeDate < getToday() && (dc==="all"||t2.fromDC===dc||t2.toDC===dc);
    }).length;

    return { rate, vUtil, dUtil, activeV, totalV:veh.length, activeD, totalD:drv.length, alertCount:dcAlerts.length, agingCount, slaBreached };
  }

  const m = getMetrics(dcTab);
  const color = dcTab==="all"?"#1A3A5C":(DC_COLORS[dcTab]||"#1A3A5C");

  return (
    <div style={{ background:"white", borderRadius:12, padding:"18px 20px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", direction:rtl?"rtl":"ltr" }}>
      <div style={{ fontWeight:800, fontSize:16, color:"#0f172a", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
        📊 {t.opsOverview}
      </div>

      <DCTabs active={dcTab} onChange={setDcTab} t={t} userDC={userDC} color={color} />
      <DateRangePicker from={from} to={to} setFrom={setFrom} setTo={setTo} t={t} />

      {/* Aging + SLA alerts */}
      {m.agingCount>0&&(
        <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8, padding:"8px 12px", marginBottom:10, fontSize:13, color:"#991b1b", fontWeight:600 }}>
          🚨 {m.agingCount} {t.agingAlert} — {t.agingDesc}
        </div>
      )}
      {m.slaBreached>0&&(
        <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:8, padding:"8px 12px", marginBottom:10, fontSize:13, color:"#9a3412", fontWeight:600 }}>
          ⚠️ {m.slaBreached} {t.slaAlert} — {t.slaDesc}
        </div>
      )}

      {/* Delivery Rate — hidden for Logistic */}
      {!isLogistic&&(
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>📊 {t.deliveryRate}</span>
            <span style={{ fontSize:22, fontWeight:900, color:rateColor(m.rate) }}>{m.rate}%</span>
          </div>
          <div style={{ background:"#f1f5f9", borderRadius:99, height:10, overflow:"hidden" }}>
            <div style={{ width:`${m.rate}%`, height:"100%", background:rateColor(m.rate), borderRadius:99, transition:"width 0.5s" }} />
          </div>
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>{t.howCalc}: Delivered ÷ (Total − Transit − Scheduled − Cancelled) × 100</div>
        </div>
      )}

      {/* Vehicle Utilization */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>🚗 {t.vehicleUtil}</span>
          <span style={{ fontSize:22, fontWeight:900, color:"#0891b2" }}>{m.vUtil}%</span>
        </div>
        <div style={{ background:"#f1f5f9", borderRadius:99, height:10, overflow:"hidden" }}>
          <div style={{ width:`${m.vUtil}%`, height:"100%", background:"#0891b2", borderRadius:99, transition:"width 0.5s" }} />
        </div>
        <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>{m.activeV} / {m.totalV} {t.activeVeh}</div>
      </div>

      {/* Driver Utilization */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>👤 {t.driverUtil}</span>
          <span style={{ fontSize:22, fontWeight:900, color:"#6366f1" }}>{m.dUtil}%</span>
        </div>
        <div style={{ background:"#f1f5f9", borderRadius:99, height:10, overflow:"hidden" }}>
          <div style={{ width:`${m.dUtil}%`, height:"100%", background:"#6366f1", borderRadius:99, transition:"width 0.5s" }} />
        </div>
        <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>{m.activeD} / {m.totalD} {t.activeDrivers}</div>
      </div>

      {/* Alerts */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#f8fafc", borderRadius:8, padding:"10px 14px" }}>
        <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>🔔 {t.alerts}</span>
        <span style={{ fontSize:22, fontWeight:900, color:m.alertCount>0?"#ef4444":"#10b981" }}>{m.alertCount}</span>
      </div>
    </div>
  );
}

// ─── RIGHT SECTION: DELIVERABLES ─────────────────────────────────
function Deliverables({ invoices, t, lang, userDC }) {
  const [dcTab, setDcTab] = useState(userDC||"all");
  const [from, setFrom] = useState(()=>{ const d=new Date(); d.setDate(1); return d.toISOString().split("T")[0]; });
  const [to, setTo] = useState(getToday());
  const [openStatus, setOpenStatus] = useState(null);
  const rtl = lang==="ar";

  const baseInv = (dcTab==="all" ? invoices : invoices.filter(i=>i.dc===dcTab)).filter(i=>i.uploadBatch);
  const inv = filterByDateRange(baseInv, from, to);

  const TABS = [
    { key:"unassigned",    label:t.unassigned,        status:["pending"],                              color:"#f59e0b", icon:"⏳" },
    { key:"toBeAssigned",  label:t.toBeAssigned,       status:["to_be_assigned"],                      color:"#3b82f6", icon:"📋" },
    { key:"staged",        label:t.stagedForDispatch,  status:["staged","assigned"],                   color:"#6366f1", icon:"📦" },
    { key:"scheduleHold",  label:t.scheduleHold,       status:["scheduled","hold_await"],              color:"#a855f7", icon:"📅" },
    { key:"transit",       label:t.transit,            status:["intransit","hold_ship"],               color:"#8b5cf6", icon:"🚚" },
    { key:"delivered",     label:t.delivered,          status:["delivered"],                           color:"#10b981", icon:"✅" },
    { key:"failed",        label:t.failed,             status:["failed"],                              color:"#ef4444", icon:"❌" },
    { key:"cancelled",     label:t.cancelled,          status:["cancelled"],                           color:"#475569", icon:"🚫" },
  ];

  function getCount(statuses) { return inv.filter(i=>statuses.includes(i.status)).length; }
  function getInvoices(statuses) { return inv.filter(i=>statuses.includes(i.status)); }

  return (
    <div style={{ background:"white", borderRadius:12, padding:"18px 20px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", direction:rtl?"rtl":"ltr" }}>
      <div style={{ fontWeight:800, fontSize:16, color:"#0f172a", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
        📋 {t.deliverables}
        <span style={{ marginLeft:"auto", fontSize:13, color:"#64748b", fontWeight:400 }}>{t.total}: <b style={{ color:"#6366f1" }}>{inv.length}</b></span>
      </div>

      <DCTabs active={dcTab} onChange={v=>{setDcTab(v);setOpenStatus(null);}} t={t} userDC={userDC} color="#6366f1" />
      <DateRangePicker from={from} to={to} setFrom={setFrom} setTo={setTo} t={t} />

      {/* Status Tabs */}
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {TABS.map(tab=>{
          const count = getCount(tab.status);
          const isOpen = openStatus===tab.key;
          const tabInv = getInvoices(tab.status);
          return (
            <div key={tab.key}>
              <button onClick={()=>setOpenStatus(isOpen?null:tab.key)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                  borderRadius:8, border:`1.5px solid ${isOpen?tab.color:"#e2e8f0"}`,
                  background:isOpen?tab.color+"10":"#f8fafc",
                  cursor:"pointer", transition:"all 0.15s" }}>
                <span style={{ fontSize:16 }}>{tab.icon}</span>
                <span style={{ flex:1, fontSize:13, fontWeight:600, color:"#374151", textAlign:"left" }}>{tab.label}</span>
                <span style={{ fontSize:18, fontWeight:900, color:count>0?tab.color:"#94a3b8" }}>{count}</span>
                <span style={{ fontSize:12, color:"#94a3b8" }}>{isOpen?"▲":"▼"}</span>
              </button>

              {/* Expanded Invoice List */}
              {isOpen&&tabInv.length>0&&(
                <div style={{ background:"#f8fafc", borderRadius:"0 0 8px 8px", border:`1px solid ${tab.color}30`, borderTop:"none", maxHeight:280, overflowY:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead>
                      <tr style={{ background:tab.color+"15" }}>
                        <th style={{ padding:"8px 12px", textAlign:"left", fontWeight:700, color:"#374151" }}>Invoice #</th>
                        <th style={{ padding:"8px 12px", textAlign:"left", fontWeight:700, color:"#374151" }}>Customer</th>
                        <th style={{ padding:"8px 12px", textAlign:"left", fontWeight:700, color:"#374151" }}>DC</th>
                        <th style={{ padding:"8px 12px", textAlign:"left", fontWeight:700, color:"#374151" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tabInv.map((inv2,i)=>(
                        <tr key={inv2.id||inv2.firestoreId} style={{ background:i%2===0?"white":"#f8fafc" }}>
                          <td style={{ padding:"7px 12px", fontWeight:700, color:tab.color }}>{inv2.id}</td>
                          <td style={{ padding:"7px 12px", color:"#374151" }}>{inv2.customer}</td>
                          <td style={{ padding:"7px 12px", color:"#64748b" }}>{inv2.dc}</td>
                          <td style={{ padding:"7px 12px", color:"#64748b" }}>{inv2.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {isOpen&&tabInv.length===0&&(
                <div style={{ padding:"16px", textAlign:"center", color:"#94a3b8", fontSize:13, background:"#f8fafc", borderRadius:"0 0 8px 8px" }}>
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

// ─── MAIN DASHBOARD ──────────────────────────────────────────────
export default function Dashboard({ user, lang, invoices, setInvoices, vehicles, trips, setTrips, uploads, setUploads, fuelLogs, setFuelLogs, alerts, setAlerts, users, setUsers, setPage }) {
  const [fsUsers, setFsUsers] = useState([]);
  const [fsVehicles, setFsVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const role = user.role;
  const userDC = (user.dc&&user.dc!=="Head Office") ? user.dc : null;
  const isAdmin = role==="admin";
  const isManager = role==="manager";
  const isLogistic = role==="logistic";
  const isPlanning = role==="planning";
  const isManagement = role==="management";

  useEffect(()=>{ loadAllData(); },[]);

  async function loadAllData() {
    try {
      const [invSnap,usersSnap,vehSnap,alertsSnap] = await Promise.all([
        getDocs(collection(db,"invoices")),
        getDocs(collection(db,"users")),
        getDocs(collection(db,"vehicles")),
        getDocs(collection(db,"alerts")),
      ]);
      setInvoices(invSnap.docs.map(d=>({firestoreId:d.id,...d.data()})));
      setFsUsers(usersSnap.docs.map(d=>({uid:d.id,...d.data()})));
      setFsVehicles(vehSnap.docs.map(d=>({id:d.id,...d.data()})));
      setAlerts(alertsSnap.docs.map(d=>({id:d.id,...d.data()})));
    } catch(e){ console.error("Dashboard load:",e); }
    setLoading(false);
  }

  async function clearTestData() {
    if(!window.confirm("Reset all test data? Invoices, trips, uploads, fuel logs and alerts will be cleared.")) return;
    try {
      for(const col of ["invoices","trips","uploads","fuelLogs","alerts"]){
        const snap=await getDocs(collection(db,col));
        for(const d of snap.docs) await deleteDoc(doc(db,col,d.id));
      }
      setInvoices([]); setTrips([]); setUploads([]); setFuelLogs([]); setAlerts([]);
      alert("✅ Test data cleared!");
    } catch(e){ alert("Error: "+e.message); }
  }

  const allVehicles = fsVehicles.length>0 ? fsVehicles : vehicles;
  const allUsers = fsUsers.length>0 ? fsUsers : (users||[]);
  const postedInv = invoices.filter(i=>i.uploadBatch);

  // ── PLANNING VIEW ─────────────────────────────────────────────
  if(isPlanning){
    const today = new Date().toISOString().split("T")[0];
    const todayUploads = uploads.filter(u=>u.date===today);
    return (
      <div style={{ direction:rtl?"rtl":"ltr" }}>
        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:24, fontWeight:900, color:"#0f172a", margin:"0 0 4px" }}>{t.welcome}, {user.name}!</h2>
          <p style={{ fontSize:15, color:"#64748b", margin:0 }}>{t.planningTitle}</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:16 }}>
          <StatCard icon="📋" label={t.totalUploaded} value={postedInv.length} color="#6366f1" />
          <StatCard icon="📦" label={t.totalBatches} value={uploads.length} color="#0891b2" />
          <StatCard icon="🏛️" label={t.govt} value={postedInv.filter(i=>i.inst==="Govt"||i.inst==="Government").length} color="#1A3A5C" />
          <StatCard icon="🏥" label={t.priv} value={postedInv.filter(i=>i.inst==="Private").length} color="#7c3aed" />
        </div>
        {todayUploads.length>0&&(
          <div style={{ background:"white", borderRadius:12, padding:"18px 20px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
            <div style={{ fontWeight:700, fontSize:17, marginBottom:14 }}>📅 {t.todaySummary}</div>
            {todayUploads.map(u=>(
              <div key={u.batchId} style={{ padding:"10px 0", borderBottom:"1px solid #f1f5f9", fontSize:14 }}>
                <span style={{ fontWeight:700, color:"#6366f1" }}>{u.batchId}</span>
                <span style={{ color:"#64748b", marginLeft:8 }}>{u.invoiceCount} {t.invoices}</span>
                <span style={{ color:"#94a3b8", marginLeft:8 }}>{t.uploadedBy}: {u.uploadedBy}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── LOADING ───────────────────────────────────────────────────
  if(loading){
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:200, fontSize:17, color:"#64748b" }}>
        ⏳ {t.loading}
      </div>
    );
  }

  // ── MAIN 2-SECTION LAYOUT (Admin, Manager, Logistic, Management) ──
  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {/* Header */}
      <div style={{ marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontSize:24, fontWeight:900, color:"#0f172a", margin:"0 0 4px" }}>
            {t.welcome}, {user.name}!
          </h2>
          <p style={{ fontSize:15, color:"#64748b", margin:0 }}>
            {userDC ? userDC+" Distribution Center" : t.allDCs}
          </p>
        </div>
        {isAdmin&&(
          <button onClick={clearTestData} style={{ background:"#fee2e2", border:"2px solid #ef4444", color:"#991b1b", padding:"10px 18px", borderRadius:8, cursor:"pointer", fontSize:14, fontWeight:700 }}>
            🗑️ Clear Test Data
          </button>
        )}
      </div>

      {/* 2-Section Layout */}
      <div style={{ display:"grid", gridTemplateColumns: isLogistic?"1fr":"1fr 1fr", gap:20, alignItems:"start" }}>

        {/* LEFT — Operations Overview */}
        <OperationsOverview
          invoices={postedInv}
          vehicles={allVehicles}
          users={allUsers}
          alerts={alerts}
          trips={trips}
          t={t}
          lang={lang}
          userDC={userDC}
          isLogistic={isLogistic}
        />

        {/* RIGHT — Deliverables (not for Logistic) */}
        {!isLogistic&&(
          <Deliverables
            invoices={postedInv}
            t={t}
            lang={lang}
            userDC={userDC}
          />
        )}
      </div>
    </div>
  );
}
