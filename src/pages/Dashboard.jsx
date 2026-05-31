import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardTitle, StatCard } from "../components/Shared.jsx";

const T = {
  en: {
    welcome:"Welcome back", adminTitle:"Operations Overview — All Distribution Centers",
    planningTitle:"Upload & Invoice Overview", todaySummary:"Today's Summary",
    totalUploaded:"Total Invoices Uploaded", totalBatches:"Total Batches Posted",
    byDC:"Distribution Center Breakdown", byInstitution:"Institution Breakdown",
    govt:"Government", priv:"Private", pending:"Pending", delivered:"Delivered",
    assigned:"Assigned", failed:"Failed", outstanding:"Outstanding",
    inTransit:"In Transit", scheduled:"Scheduled", total:"Total",
    deliveryRate:"Delivery Rate", vehicleUtil:"Vehicle Utilization",
    driverUtil:"Driver Utilization", activeVeh:"Active Vehicles",
    alerts:"Active Alerts", allDC:"All Distribution Centers",
    howCalc:"How calculated", uploadedBy:"Uploaded by", postedAt:"Posted at",
    invoices:"invoices", batches:"batches today",
    riyadhDC:"Riyadh Distribution Center", jeddahDC:"Jeddah Distribution Center",
    dammamDC:"Dammam Distribution Center", assignedDrv:"Assigned Drivers",
    idleVehicles:"Unassigned Vehicles Today", idleDrivers:"Unassigned Drivers Today",
    noIdle:"None — All assigned", loading:"Loading data..."
  },
  ar: {
    welcome:"مرحباً بعودتك", adminTitle:"نظرة عامة على العمليات",
    planningTitle:"نظرة عامة على الرفع والفواتير", todaySummary:"ملخص اليوم",
    totalUploaded:"إجمالي الفواتير المرفوعة", totalBatches:"إجمالي دفعات الترحيل",
    byDC:"توزيع مراكز التوزيع", byInstitution:"توزيع المؤسسات",
    govt:"حكومي", priv:"خاص", pending:"معلقة", delivered:"مسلمة",
    assigned:"مخصصة", failed:"فاشلة", outstanding:"متأخرة",
    inTransit:"في الطريق", scheduled:"مجدولة", total:"الإجمالي",
    deliveryRate:"معدل التسليم", vehicleUtil:"استخدام المركبات",
    driverUtil:"استخدام السائقين", activeVeh:"مركبات نشطة",
    alerts:"تنبيهات نشطة", allDC:"جميع مراكز التوزيع",
    howCalc:"طريقة الحساب", uploadedBy:"رفع بواسطة", postedAt:"وقت الترحيل",
    invoices:"فواتير", batches:"دفعات اليوم",
    riyadhDC:"مركز توزيع الرياض", jeddahDC:"مركز توزيع جدة",
    dammamDC:"مركز توزيع الدمام", assignedDrv:"سائقون مخصصون",
    idleVehicles:"مركبات غير مخصصة اليوم", idleDrivers:"سائقون غير مخصصين اليوم",
    noIdle:"لا يوجد — جميعهم مخصصون", loading:"جاري التحميل..."
  }
};

const DC_COLORS = { Riyadh:"#1A3A5C", Jeddah:"#0f766e", Dammam:"#7c3aed" };
const ALERT_COLORS = { vehicle:"#f59e0b", driver:"#6366f1", delivery:"#ef4444", maintenance:"#f97316", access:"#8b5cf6" };

function dcLabel(dc, t) {
  if (dc==="Riyadh") return t.riyadhDC;
  if (dc==="Jeddah") return t.jeddahDC;
  return t.dammamDC;
}

function DCBox({ dc, invoices, vehicles, users, alerts, t }) {
  const color = DC_COLORS[dc];
  const inv = invoices.filter(i=>i.dc===dc);
  const countable = inv.filter(i=>!["scheduled","hold_await","hold_ship","intransit"].includes(i.status));
  const del = inv.filter(i=>i.status==="delivered").length;
  const rate = countable.length>0?Math.round(del/countable.length*100):0;
  const veh = vehicles.filter(v=>v.dc===dc);
  const activeV = veh.filter(v=>v.status==="Active").length;
  const dcAlerts = (alerts||[]).filter(a=>a.status==="active"&&a.dc===dc);
  const assignedInv = inv.filter(i=>i.status==="assigned").length;
  const assignedVehicles = new Set(inv.filter(i=>i.status==="assigned"&&i.vehicle).map(i=>i.vehicle));
  const idleVeh = veh.filter(v=>v.status==="Active"&&!assignedVehicles.has(v.plate));
  const dcDrivers = (users||[]).filter(u=>u.role==="driver"&&u.dc===dc&&u.status==="active");
  const assignedDriverNames = new Set(inv.filter(i=>i.status==="assigned"&&i.driverName).map(i=>i.driverName));
  const idleDrv = dcDrivers.filter(d=>!assignedDriverNames.has(d.name));

  return (
    <Card style={{ borderTop:`4px solid ${color}` }}>
      <CardTitle style={{ color }}>📍 {dcLabel(dc,t)}</CardTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:8 }}>
        <StatCard icon="📋" label={t.total} value={inv.length} color={color} />
        <StatCard icon="✅" label={t.delivered} value={del} color="#10b981" />
        <StatCard icon="⏳" label={t.pending} value={inv.filter(i=>i.status==="pending").length} color="#f59e0b" />
        <StatCard icon="👤" label={t.assigned} value={assignedInv} color="#3b82f6" />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:12 }}>
        <StatCard icon="❌" label={t.failed} value={inv.filter(i=>i.status==="failed").length} color="#ef4444" />
        <StatCard icon="⚠️" label={t.outstanding} value={inv.filter(i=>i.status==="outstanding").length} color="#f97316" />
        <StatCard icon="🚚" label={t.inTransit} value={inv.filter(i=>i.status==="intransit").length} color="#8b5cf6" />
        <StatCard icon="📅" label={t.scheduled} value={inv.filter(i=>["scheduled","hold_await","hold_ship"].includes(i.status)).length} color="#a855f7" />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
        <StatCard icon="🚗" label={t.activeVeh} value={activeV+"/"+veh.length} color="#0891b2" />
        <StatCard icon="🔔" label={t.alerts} value={dcAlerts.length} color="#ef4444" />
        <StatCard icon="👥" label={t.assignedDrv} value={assignedInv} color="#6366f1" />
      </div>
      <div style={{ marginBottom:8 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
          <span style={{ fontWeight:600 }}>{t.deliveryRate}</span>
          <span style={{ fontWeight:800, color:rate>=80?"#10b981":rate>=50?"#f59e0b":"#ef4444" }}>{rate}%</span>
        </div>
        <div style={{ background:"#f1f5f9", borderRadius:99, height:6, overflow:"hidden" }}>
          <div style={{ width:`${rate}%`, height:"100%", background:rate>=80?"#10b981":rate>=50?"#f59e0b":"#ef4444", borderRadius:99 }} />
        </div>
      </div>
      <div style={{ background:"#f8fafc", borderRadius:8, padding:"8px 10px", marginBottom:6 }}>
        <div style={{ fontWeight:600, fontSize:12, color:"#64748b", marginBottom:4 }}>🚗 {t.idleVehicles}:</div>
        {idleVeh.length===0
          ? <div style={{ fontSize:11, color:"#10b981" }}>✅ {t.noIdle}</div>
          : idleVeh.map(v=><div key={v.plate} style={{ fontSize:11, color:"#f97316", fontWeight:600 }}>⚪ Unassigned: {v.plate}</div>)
        }
      </div>
      <div style={{ background:"#f8fafc", borderRadius:8, padding:"8px 10px" }}>
        <div style={{ fontWeight:600, fontSize:12, color:"#64748b", marginBottom:4 }}>👤 {t.idleDrivers}:</div>
        {idleDrv.length===0
          ? <div style={{ fontSize:11, color:"#10b981" }}>✅ {t.noIdle}</div>
          : idleDrv.map(d=><div key={d.uid} style={{ fontSize:11, color:"#6366f1", fontWeight:600 }}>⚪ Unassigned: {d.name}</div>)
        }
      </div>
    </Card>
  );
}

export default function Dashboard({ user, lang, invoices, setInvoices, vehicles, trips, setTrips, uploads, setUploads, fuelLogs, setFuelLogs, alerts, setAlerts, users, setUsers, setPage }) {
  const [fsUsers, setFsUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const dc = user.dc==="Head Office" ? null : user.dc;
  const role = user.role;

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      // Load invoices
      const invSnap = await getDocs(collection(db, "invoices"));
      setInvoices(invSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));

      // Load users/drivers from Firestore
      const usersSnap = await getDocs(collection(db, "users"));
      setFsUsers(usersSnap.docs.map(d => ({ uid: d.id, ...d.data() })));

      // Load alerts
      const alertsSnap = await getDocs(collection(db, "alerts"));
      setAlerts(alertsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch(e) { console.error("Dashboard load error:", e); }
    setLoading(false);
  }

  async function clearTestData() {
    if (!window.confirm("Reset all test data? This will clear all invoices, trips, uploads, fuel logs and alerts. Users and vehicles will be kept.")) return;
    try {
      const collections = ["invoices","trips","uploads","fuelLogs","alerts"];
      for (const col of collections) {
        const snap = await getDocs(collection(db, col));
        for (const d of snap.docs) { await deleteDoc(doc(db, col, d.id)); }
      }
      setInvoices([]); setTrips([]); setUploads([]); setFuelLogs([]); setAlerts([]);
      alert("✅ Test data cleared! Ready for fresh UAT.");
    } catch(e) { alert("Error: "+e.message); }
  }

  const myInv = dc ? invoices.filter(i=>i.dc===dc) : invoices;
  const myVeh = dc ? vehicles.filter(v=>v.dc===dc) : vehicles;
  const myAlerts = dc ? (alerts||[]).filter(a=>a.dc===dc&&a.status==="active") : (alerts||[]).filter(a=>a.status==="active");
  const allUsers = fsUsers.length > 0 ? fsUsers : (users||[]);

  const countable = myInv.filter(i=>!["scheduled","hold_await","hold_ship","intransit"].includes(i.status));
  const del = myInv.filter(i=>i.status==="delivered").length;
  const deliveryRate = countable.length>0?Math.round(del/countable.length*100):0;
  const activeV = myVeh.filter(v=>v.status==="Active").length;
  const assignedD = myInv.filter(i=>i.status==="assigned").length;
  const alertByType = {};
  myAlerts.forEach(a=>{ alertByType[a.type]=(alertByType[a.type]||0)+1; });

  const dcDrivers = dc?(allUsers).filter(u=>u.role==="driver"&&u.dc===dc&&u.status==="active"):[];
  const assignedDriverNames = new Set(myInv.filter(i=>i.status==="assigned"&&i.driverName).map(i=>i.driverName));
  const assignedVehicles = new Set(myInv.filter(i=>i.status==="assigned"&&i.vehicle).map(i=>i.vehicle));
  const idleVeh = myVeh.filter(v=>v.status==="Active"&&!assignedVehicles.has(v.plate));
  const idleDrv = dcDrivers.filter(d=>!assignedDriverNames.has(d.name));

  // Planning view
  if (role==="planning") {
    const today = new Date().toISOString().split("T")[0];
    const todayUploads = uploads.filter(u=>u.date===today);
    const govCount = myInv.filter(i=>i.inst==="Government").length;
    const privCount = myInv.filter(i=>i.inst==="Private").length;
    return (
      <div style={{ direction:rtl?"rtl":"ltr" }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:"#0f172a", marginBottom:4 }}>{t.welcome}, {user.name}!</h2>
        <p style={{ fontSize:14, color:"#64748b", marginBottom:20 }}>{t.planningTitle}</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:16 }}>
          <StatCard icon="📋" label={t.totalUploaded} value={myInv.length} color="#6366f1" />
          <StatCard icon="📦" label={t.totalBatches} value={uploads.length} color="#0891b2" />
          <StatCard icon="🏛️" label={t.govt} value={govCount} color="#1A3A5C" />
          <StatCard icon="🏢" label={t.priv} value={privCount} color="#7c3aed" />
        </div>
        {todayUploads.length>0&&(
          <Card>
            <CardTitle>📅 {t.todaySummary}</CardTitle>
            {todayUploads.map(u=>(
              <div key={u.batchId} style={{ padding:"8px 0", borderBottom:"1px solid #f1f5f9", fontSize:13 }}>
                <span style={{ fontWeight:700, color:"#6366f1" }}>{u.batchId}</span>
                <span style={{ color:"#64748b", marginLeft:8 }}>{u.invoiceCount} {t.invoices}</span>
                <span style={{ color:"#94a3b8", marginLeft:8 }}>{t.uploadedBy}: {u.uploadedBy}</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:200, fontSize:16, color:"#64748b" }}>
        ⏳ {t.loading}
      </div>
    );
  }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      <div style={{ marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:900, color:"#0f172a", margin:"0 0 4px" }}>{t.welcome}, {user.name}!</h2>
          <p style={{ fontSize:14, color:"#64748b", margin:0 }}>{dc?dcLabel(dc,t):t.adminTitle}</p>
        </div>
        {!dc&&(
          <button onClick={clearTestData} style={{ background:"#fee2e2", border:"2px solid #ef4444", color:"#991b1b", padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700 }}>
            🗑️ Clear Test Data
          </button>
        )}
      </div>

      {/* Overall KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:12, marginBottom:16 }}>
        <StatCard icon="📋" label={t.total} value={myInv.length} color="#6366f1" />
        <StatCard icon="✅" label={t.delivered} value={del} color="#10b981" />
        <StatCard icon="⏳" label={t.pending} value={myInv.filter(i=>i.status==="pending").length} color="#f59e0b" />
        <StatCard icon="👤" label={t.assigned} value={assignedD} color="#3b82f6" />
        <StatCard icon="❌" label={t.failed} value={myInv.filter(i=>i.status==="failed").length} color="#ef4444" />
        <StatCard icon="⚠️" label={t.outstanding} value={myInv.filter(i=>i.status==="outstanding").length} color="#f97316" />
        <StatCard icon="🚚" label={t.inTransit} value={myInv.filter(i=>i.status==="intransit").length} color="#8b5cf6" />
        <StatCard icon="📅" label={t.scheduled} value={myInv.filter(i=>["scheduled","hold_await","hold_ship"].includes(i.status)).length} color="#a855f7" />
        <StatCard icon="🔔" label={t.alerts} value={myAlerts.length} color="#ef4444" />
      </div>

      {/* Overall Performance Box */}
      <Card style={{ borderTop:"4px solid #1A3A5C" }}>
        <CardTitle>📊 {t.allDC} — {t.deliveryRate}</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16 }}>
          <div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:4 }}>{t.deliveryRate}</div>
            <div style={{ fontSize:36, fontWeight:900, color:deliveryRate>=80?"#10b981":deliveryRate>=50?"#f59e0b":"#ef4444" }}>{deliveryRate}%</div>
            <div style={{ background:"#f1f5f9", borderRadius:99, height:10, overflow:"hidden", marginTop:6 }}>
              <div style={{ width:`${deliveryRate}%`, height:"100%", background:deliveryRate>=80?"#10b981":deliveryRate>=50?"#f59e0b":"#ef4444", borderRadius:99 }} />
            </div>
            <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>{t.howCalc}: Delivered ÷ (Total - Scheduled) × 100</div>
          </div>
          <div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:4 }}>🚗 {t.vehicleUtil}</div>
            <div style={{ fontSize:36, fontWeight:900, color:"#0891b2" }}>{myVeh.length>0?Math.round(activeV/myVeh.length*100):0}%</div>
            <div style={{ fontSize:12, color:"#64748b" }}>{activeV}/{myVeh.length} {t.activeVeh}</div>
          </div>
          <div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:4 }}>👤 {t.driverUtil}</div>
            <div style={{ fontSize:36, fontWeight:900, color:"#6366f1" }}>{assignedD}</div>
            <div style={{ fontSize:12, color:"#64748b" }}>{t.assignedDrv}</div>
          </div>
        </div>
      </Card>

      {/* DC Manager Idle section */}
      {dc&&(
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16, marginTop:16 }}>
          <Card style={{ borderLeft:"4px solid #f97316" }}>
            <CardTitle>⚪ {t.idleVehicles}</CardTitle>
            {idleVeh.length===0
              ? <div style={{ fontSize:13, color:"#10b981", fontWeight:600 }}>✅ {t.noIdle}</div>
              : idleVeh.map(v=>(
                <div key={v.plate} style={{ fontSize:13, fontWeight:600, color:"#f97316", padding:"4px 0", borderBottom:"1px solid #f1f5f9" }}>
                  ⚪ {v.plate} <span style={{ color:"#94a3b8", fontWeight:400 }}>({v.type})</span>
                </div>
              ))
            }
          </Card>
          <Card style={{ borderLeft:"4px solid #6366f1" }}>
            <CardTitle>⚪ {t.idleDrivers}</CardTitle>
            {idleDrv.length===0
              ? <div style={{ fontSize:13, color:"#10b981", fontWeight:600 }}>✅ {t.noIdle}</div>
              : idleDrv.map(d=>(
                <div key={d.uid} style={{ fontSize:13, fontWeight:600, color:"#6366f1", padding:"4px 0", borderBottom:"1px solid #f1f5f9" }}>
                  ⚪ {d.name}
                </div>
              ))
            }
          </Card>
        </div>
      )}

      {/* DC Boxes — Admin only */}
      {!dc&&(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16, marginTop:16 }}>
          <DCBox dc="Riyadh" invoices={invoices} vehicles={vehicles} users={allUsers} alerts={alerts} t={t} />
          <DCBox dc="Jeddah" invoices={invoices} vehicles={vehicles} users={allUsers} alerts={alerts} t={t} />
          <DCBox dc="Dammam" invoices={invoices} vehicles={vehicles} users={allUsers} alerts={alerts} t={t} />
        </div>
      )}

      {/* Alerts */}
      {myAlerts.length>0&&(
        <Card style={{ borderLeft:"4px solid #ef4444", marginTop:16 }}>
          <CardTitle>🔔 {t.alerts} ({myAlerts.length})</CardTitle>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:12 }}>
            {Object.entries(alertByType).map(([type,count])=>(
              <span key={type} style={{ fontSize:12, fontWeight:600, padding:"4px 10px", borderRadius:99, background:(ALERT_COLORS[type]||"#64748b")+"20", color:ALERT_COLORS[type]||"#64748b" }}>
                {type}: {count}
              </span>
            ))}
          </div>
          {myAlerts.map(a=>(
            <div key={a.id} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:"1px solid #f1f5f9", fontSize:13, alignItems:"center" }}>
              <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:99, background:(ALERT_COLORS[a.type]||"#64748b")+"20", color:ALERT_COLORS[a.type]||"#64748b", whiteSpace:"nowrap" }}>{a.type}</span>
              <span style={{ fontWeight:600 }}>{a.dc} DC</span>
              <span style={{ color:"#374151" }}>{a.title} — {a.desc}</span>
              <span style={{ color:"#94a3b8", fontSize:11, marginLeft:"auto" }}>{a.days}d ago</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
