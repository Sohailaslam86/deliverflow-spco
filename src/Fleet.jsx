import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg, StatCard, TabBar } from "../components/Shared.jsx";
import { MAINTENANCE_TYPES, DCS } from "../data/masterData.js";
import { sendNotification } from "../notificationService.js";

const T = {
  en: {
    vehicles:"Vehicles", drivers:"Drivers", maintenance:"Maintenance Log",
    overview:"Summarized View", total:"Total", active:"Active",
    inMaint:"In Maintenance", expiryAlerts:"Expiry Alerts",
    fuelLevel:"Fuel Level", totalKM:"Total KM",
    fahas:"Fahas Expiry", istimara:"Istimara Expiry", insurance:"Insurance Expiry",
    sendMaint:"Send to Maintenance", reactivate:"Reactivate",
    noMaint:"No maintenance history", onLeave:"On Leave", inactive:"Inactive",
    expired:"Expiring Soon", allDrivers:"All Drivers — Overview",
    allVehicles:"All Vehicles — Overview",
    riyadhDC:"Riyadh Distribution Center", jeddahDC:"Jeddah Distribution Center", dammamDC:"Dammam Distribution Center",
    maintType:"Type", cost:"Cost (SAR)", startDate:"Start Date",
    returnDate:"Expected Return", notes:"Notes",
    confirm:"Confirm", cancel:"Cancel", edit:"Edit", save:"Save",
    markLeave:"Mark On Leave", markActive:"Mark Active",
    unassigned:"Unassigned Today", loading:"Loading fleet data...",
    vehicleUtil:"Vehicle Utilization", driverUtil:"Driver Utilization",
    addVehicle:"+ Add Vehicle (Request)", noVehicles:"No vehicles found",
    noDrivers:"No drivers found",
    requestVehicle:"Request New Vehicle", reqPlate:"Plate Number *",
    reqType:"Vehicle Type", reqBrand:"Brand", reqModel:"Model",
    reqYear:"Year", reqFuelCap:"Fuel Capacity (L)", reqReason:"Reason *",
    reqSubmit:"Submit Request", reqSubmitted:"Vehicle request submitted!",
    reqPending:"Pending Requests", reqApprove:"✅ Approve", reqReject:"❌ Reject",
    reqApproved:"Vehicle request approved!", reqRejected:"Request rejected.",
    // Vehicle induction fields
    engineNo:"Engine Number", chassisNo:"Chassis Number",
    kmpl:"Fuel Efficiency (KMPL)", startOdometer:"Starting Odometer (KM)",
    color:"Vehicle Color", ownership:"Ownership Type",
    basicInfo:"Basic Information", technicalInfo:"Technical Information",
    documents:"Documents & Expiry",
    editVehicle:"Edit Vehicle Details", saveVehicle:"Save Changes",
  },
  ar: {
    vehicles:"المركبات", drivers:"السائقون", maintenance:"سجل الصيانة",
    overview:"عرض ملخص", total:"الإجمالي",
    active:"نشط", inMaint:"في الصيانة", expiryAlerts:"تنبيهات الانتهاء",
    fuelLevel:"مستوى الوقود", totalKM:"إجمالي الكيلومترات",
    fahas:"انتهاء الفحص", istimara:"انتهاء الاستمارة", insurance:"انتهاء التأمين",
    sendMaint:"إرسال للصيانة", reactivate:"إعادة التفعيل",
    noMaint:"لا يوجد سجل صيانة", onLeave:"إجازة", inactive:"غير نشط",
    expired:"ينتهي قريباً", allDrivers:"جميع السائقون",
    allVehicles:"جميع المركبات",
    riyadhDC:"الرياض", jeddahDC:"جدة", dammamDC:"الدمام",
    maintType:"النوع", cost:"التكلفة", startDate:"تاريخ البدء",
    returnDate:"تاريخ العودة", notes:"ملاحظات",
    confirm:"تأكيد", cancel:"إلغاء", edit:"تعديل", save:"حفظ",
    markLeave:"إجازة", markActive:"تفعيل",
    unassigned:"غير مخصص اليوم", loading:"جاري التحميل...",
    vehicleUtil:"استخدام المركبات", driverUtil:"استخدام السائقين",
    addVehicle:"+ إضافة مركبة (طلب)", noVehicles:"لا توجد مركبات",
    noDrivers:"لا يوجد سائقون",
    requestVehicle:"طلب مركبة جديدة", reqPlate:"رقم اللوحة *",
    reqType:"نوع المركبة", reqBrand:"الماركة", reqModel:"الموديل",
    reqYear:"السنة", reqFuelCap:"سعة الخزان", reqReason:"السبب *",
    reqSubmit:"إرسال الطلب", reqSubmitted:"تم إرسال طلب المركبة!",
    reqPending:"الطلبات المعلقة", reqApprove:"✅ موافقة", reqReject:"❌ رفض",
    reqApproved:"تمت الموافقة على الطلب!", reqRejected:"تم الرفض.",
    engineNo:"رقم المحرك", chassisNo:"رقم الهيكل",
    kmpl:"كفاءة الوقود (كم/لتر)", startOdometer:"قراءة العداد عند الاستلام",
    color:"لون المركبة", ownership:"نوع الملكية",
    basicInfo:"المعلومات الأساسية", technicalInfo:"المعلومات الفنية",
    documents:"المستندات وتواريخ الانتهاء",
    editVehicle:"تعديل بيانات المركبة", saveVehicle:"حفظ التغييرات",
  }
};

const DC_COLORS = { Riyadh:"#1A3A5C", Jeddah:"#0f766e", Dammam:"#7c3aed" };
const OWNERSHIP_TYPES = ["Owned", "Leased", "Rented"];

function dcLabel(dc, t) {
  if (dc==="Riyadh") return t.riyadhDC;
  if (dc==="Jeddah") return t.jeddahDC;
  return t.dammamDC;
}

// Days until expiry helper
function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000*60*60*24));
}

// Expiry badge
function ExpiryBadge({ label, date }) {
  if (!date) return null;
  const days = daysUntil(date);
  const color = days < 0 ? "#991b1b" : days <= 30 ? "#92400e" : "#065f46";
  const bg    = days < 0 ? "#fee2e2" : days <= 30 ? "#fef3c7" : "#d1fae5";
  const text  = days < 0 ? `EXPIRED ${Math.abs(days)}d ago` : days <= 30 ? `${days}d left` : `${days}d`;
  return (
    <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:99, background:bg, color, marginLeft:6 }}>
      {label}: {date} ({text})
    </span>
  );
}

export default function Fleet({ user, vehicles: masterVehicles, setVehicles: setMasterVehicles, users: masterUsers, setUsers, lang }) {
  const [tab, setTab] = useState("overview");
  const [done, setDone] = useState("");
  const [fsVehicles, setFsVehicles] = useState([]);
  const [fsDrivers, setFsDrivers] = useState([]);
  const [vehicleRequests, setVehicleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overviewDC, setOverviewDC] = useState("all");
  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const dc = user.dc==="Head Office"?null:user.dc;
  const isAdmin = user.role==="admin";
  const isManager = user.role==="manager";
  const isLogistic = user.role==="logistic";
  const isManagement = user.role==="management";
  const canManage = isAdmin||isManager||isLogistic;

  // Tab visibility:
  // Admin / Manager — all 4 tabs (full fleet + driver HR)
  // Logistic / Management — Overview, Vehicles, Maintenance (no driver HR)
  const canSeeDriversTab = isAdmin || isManager;
  const tabs = [
    ["overview","📊",t.overview],
    ["vehicles","🚗",t.vehicles],
    ...(canSeeDriversTab ? [["drivers","👤",t.drivers]] : []),
    ["maintenance","🔧",t.maintenance],
  ];

  function flash(msg) { setDone(msg); setTimeout(()=>setDone(""),4000); }

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const vSnap = await getDocs(collection(db, "vehicles"));
      setFsVehicles(vSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
      const uSnap = await getDocs(collection(db, "users"));
      setFsDrivers(uSnap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(u => u.role === "driver"));
      const rSnap = await getDocs(collection(db, "vehicleRequests"));
      setVehicleRequests(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  const allVehicles = fsVehicles.length > 0 ? fsVehicles : masterVehicles;
  const allDrivers  = fsDrivers.length  > 0 ? fsDrivers  : (masterUsers||[]).filter(u=>u.role==="driver");

  // Scope to own DC — logistic (dc=null) sees all
  const myVehicles = dc ? allVehicles.filter(v=>v.dc===dc) : allVehicles;
  const myDrivers  = dc ? allDrivers.filter(d=>d.dc===dc)  : allDrivers;

  async function sendMaint(vehicle, maintForm) {
    const maintRecord = { ...maintForm, date: new Date().toLocaleDateString(), addedBy: user.name };
    const updateData = { status:"Maintenance", maintHistory:[...(vehicle.maintHistory||[]), maintRecord] };
    if (vehicle.firestoreId) {
      try { await updateDoc(doc(db,"vehicles",vehicle.firestoreId), updateData); } catch(e) { console.error(e); }
    }
    setFsVehicles(prev=>prev.map(v=>v.firestoreId===vehicle.firestoreId?{...v,...updateData}:v));
    if (maintForm.startDate && maintForm.returnDate) {
      try {
        await addDoc(collection(db, "vehicleOffDays"), {
          vehiclePlate: vehicle.plate, reason: maintForm.type||"Maintenance",
          from: maintForm.startDate, to: maintForm.returnDate,
          dc: vehicle.dc, source:"fleet_maintenance",
          cost: maintForm.cost||"", notes: maintForm.notes||"",
          addedBy: user.name, createdAt: new Date().toISOString()
        });
        flash(vehicle.plate+" sent to maintenance ✅ Off Days auto-saved");
      } catch(e) { flash(vehicle.plate+" sent to maintenance"); }
    } else {
      flash(vehicle.plate+" sent to maintenance");
    }
  }

  async function reactivate(vehicle) {
    if (vehicle.firestoreId) {
      try { await updateDoc(doc(db,"vehicles",vehicle.firestoreId), {status:"Active"}); } catch(e) { console.error(e); }
    }
    setFsVehicles(prev=>prev.map(v=>v.firestoreId===vehicle.firestoreId?{...v,status:"Active"}:v));
    flash(vehicle.plate+" reactivated");
  }

  async function setDriverStatus(driver, status) {
    if (driver.uid) {
      try { await updateDoc(doc(db,"users",driver.uid), {status}); } catch(e) { console.error(e); }
    }
    setFsDrivers(prev=>prev.map(d=>d.uid===driver.uid?{...d,status}:d));
    flash("Driver status updated");
  }

  // DC breakdown box — vehicles (uses myVehicles scoped)
  function DCVehBox({ dcName }) {
    const color = DC_COLORS[dcName];
    const dv  = myVehicles.filter(v=>v.dc===dcName);
    const act = dv.filter(v=>v.status==="Active").length;
    const mnt = dv.filter(v=>v.status==="Maintenance").length;
    const exp = dv.filter(v=>v.fahas&&daysUntil(v.fahas)<=30).length;
    return (
      <Card style={{ borderTop:`4px solid ${color}` }}>
        <CardTitle style={{ color, fontSize:15 }}>📍 {dcLabel(dcName,t)}</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          <StatCard icon="🚗" label={t.total}   value={dv.length} color={color} />
          <StatCard icon="✅" label={t.active}  value={act}       color="#10b981" />
          <StatCard icon="🔧" label={t.inMaint} value={mnt}       color="#f59e0b" />
          <StatCard icon="⚠️" label={t.expired} value={exp}       color="#ef4444" />
        </div>
      </Card>
    );
  }

  // DC breakdown box — drivers (uses myDrivers scoped)
  function DCDrvBox({ dcName }) {
    const color = DC_COLORS[dcName];
    const dv    = myDrivers.filter(d=>d.dc===dcName);
    const act   = dv.filter(d=>d.status==="active"||d.status==="Active").length;
    const leave = dv.filter(d=>d.status==="On Leave").length;
    const inact = dv.filter(d=>d.status==="inactive"||d.status==="Inactive").length;
    return (
      <Card style={{ borderTop:`4px solid ${color}` }}>
        <CardTitle style={{ color, fontSize:15 }}>📍 {dcLabel(dcName,t)}</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          <StatCard icon="👤" label={t.total}    value={dv.length} color={color} />
          <StatCard icon="✅" label={t.active}   value={act}       color="#10b981" />
          <StatCard icon="🏖️" label={t.onLeave}  value={leave}     color="#f59e0b" />
          <StatCard icon="⚠️" label={t.inactive} value={inact}     color="#ef4444" />
        </div>
      </Card>
    );
  }

  if (loading) {
    return <div style={{ textAlign:"center", padding:40, fontSize:16, color:"#64748b" }}>⏳ {t.loading}</div>;
  }

  // Which DCs to show in overview breakdown
  const overviewDCs = dc
    ? [dc]  // DC Manager — only own DC
    : overviewDC==="all" ? ["Riyadh","Jeddah","Dammam"] : [overviewDC];

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done}/>}
      <TabBar tabs={tabs} active={tab} onChange={setTab}/>

      {/* ── SUMMARIZED VIEW ── */}
      {tab==="overview"&&(
        <div>
          {/* DC Filter pills — only for admin/logistic/management who see multiple DCs */}
          {!dc&&(
            <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
              {["all","Riyadh","Jeddah","Dammam"].map(d=>(
                <button key={d} onClick={()=>setOverviewDC(d)}
                  style={{ padding:"6px 14px", borderRadius:7, border:"none", fontSize:12, fontWeight:600, cursor:"pointer",
                    background:overviewDC===d?"#1A3A5C":"#f1f5f9", color:overviewDC===d?"white":"#374151" }}>
                  {d==="all"?"All DCs":d}
                </button>
              ))}
            </div>
          )}

          {/* ── VEHICLES SECTION ──
              DC Manager (dc set): show ONE combined card — no duplicate
              Admin/Logistic (dc null): show summary totals + per-DC breakdown */}
          {dc ? (
            // DC Manager — single card, no duplicate breakdown
            <DCVehBox dcName={dc} />
          ) : (
            <>
              {/* Admin/Logistic — global summary */}
              {overviewDC==="all"&&(
                <Card style={{ borderTop:"4px solid #1A3A5C", marginBottom:4 }}>
                  <CardTitle>🚗 {t.allVehicles}</CardTitle>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:12 }}>
                    <StatCard icon="🚗" label={t.total}   value={myVehicles.length}                                         color="#6366f1" />
                    <StatCard icon="✅" label={t.active}  value={myVehicles.filter(v=>v.status==="Active").length}           color="#10b981" />
                    <StatCard icon="🔧" label={t.inMaint} value={myVehicles.filter(v=>v.status==="Maintenance").length}      color="#f59e0b" />
                    <StatCard icon="⚠️" label={t.expired} value={myVehicles.filter(v=>v.fahas&&daysUntil(v.fahas)<=30).length} color="#ef4444" />
                  </div>
                  {/* Fuel efficiency drop alerts */}
                  {myVehicles.filter(v=>{ const a=v.totalKM&&v.fuelUsedTotal?v.totalKM/v.fuelUsedTotal:null; return a&&a<(v.kmpl||v.mileage||12)*0.8; }).map(v=>(
                    <div key={v.plate} style={{ background:"#fef3c7", border:"1px solid #fed7aa", borderRadius:7, padding:"7px 12px", marginTop:8, fontSize:13, color:"#92400e", fontWeight:600 }}>
                      ⚠️ {v.plate} ({v.dc}) — Fuel efficiency drop (below 80% of {v.kmpl||v.mileage||12} km/L baseline)
                    </div>
                  ))}
                </Card>
              )}
              {/* Per-DC breakdown */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:16 }}>
                {overviewDCs.map(dcN=><DCVehBox key={dcN} dcName={dcN}/>)}
              </div>
            </>
          )}

          {/* ── DRIVERS SECTION — only for roles that can see Drivers tab ── */}
          {canSeeDriversTab&&(
            <>
              {dc ? (
                // DC Manager — single card
                <DCDrvBox dcName={dc} />
              ) : (
                <>
                  {overviewDC==="all"&&(
                    <Card style={{ borderTop:"4px solid #0f766e", marginBottom:4 }}>
                      <CardTitle>👤 {t.allDrivers}</CardTitle>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:12 }}>
                        <StatCard icon="👤" label={t.total}    value={myDrivers.length}                                                              color="#6366f1" />
                        <StatCard icon="✅" label={t.active}   value={myDrivers.filter(d=>d.status==="active"||d.status==="Active").length}           color="#10b981" />
                        <StatCard icon="🏖️" label={t.onLeave}  value={myDrivers.filter(d=>d.status==="On Leave").length}                             color="#f59e0b" />
                        <StatCard icon="⚠️" label={t.inactive} value={myDrivers.filter(d=>d.status==="inactive"||d.status==="Inactive").length}       color="#ef4444" />
                      </div>
                    </Card>
                  )}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
                    {overviewDCs.map(dcN=><DCDrvBox key={dcN} dcName={dcN}/>)}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── VEHICLES TAB ── */}
      {tab==="vehicles"&&(
        <VehiclesTab
          vehicles={myVehicles} dc={dc} t={t} canManage={canManage} user={user}
          onSendMaint={sendMaint} onReactivate={reactivate}
          isAdmin={isAdmin} isManager={isManager} isLogistic={isLogistic}
          vehicleRequests={vehicleRequests} setVehicleRequests={setVehicleRequests}
          setFsVehicles={setFsVehicles} flash={flash}
        />
      )}

      {/* ── DRIVERS TAB ── */}
      {tab==="drivers"&&(
        <DriversTab drivers={myDrivers} dc={dc} t={t} canManage={canManage} onSetStatus={setDriverStatus} isAdmin={isAdmin} DCS={DCS} dcLabel={dcLabel} />
      )}

      {/* ── MAINTENANCE TAB ── */}
      {tab==="maintenance"&&(
        <MaintTab vehicles={myVehicles} t={t} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// VEHICLES TAB
// ─────────────────────────────────────────────
function VehiclesTab({ vehicles, dc, t, canManage, user, onSendMaint, onReactivate, isAdmin, isManager, isLogistic, vehicleRequests, setVehicleRequests, setFsVehicles, flash }) {
  const [showMaint, setShowMaint] = useState(null);
  const [maintForm, setMaintForm] = useState({ type:"Scheduled Service", startDate:"", returnDate:"", cost:"", notes:"" });
  const [showReqForm, setShowReqForm] = useState(false);
  const [reqForm, setReqForm] = useState({
    plate:"", type:"Dyna", brand:"", model:"", year:"", color:"",
    ownership:"Owned", fuelCapacity:80, kmpl:12,
    engineNo:"", chassisNo:"", startOdometer:0,
    fahas:"", insurance:"", istimara:"", reason:""
  });
  const [submitting, setSubmitting] = useState(false);
  // Admin edit mode for approved vehicles
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Expiry alerts — Fahas OR Insurance OR Istimara expiring within 60 days
  const alerts = vehicles.filter(v => {
    const fDays = daysUntil(v.fahas);
    const iDays = daysUntil(v.insurance);
    const sDays = daysUntil(v.istimara);
    return (fDays!==null&&fDays<=60)||(iDays!==null&&iDays<=60)||(sDays!==null&&sDays<=60);
  });

  const myPendingReqs = (vehicleRequests||[]).filter(r=>r.status==="pending"&&(!dc||r.dc===dc));
  const allPendingReqs = isAdmin ? (vehicleRequests||[]).filter(r=>r.status==="pending") : [];

  async function submitVehicleRequest() {
    if (!reqForm.plate||!reqForm.reason) { flash("❌ Plate number and reason are required!"); return; }
    setSubmitting(true);
    try {
      const targetDC = isLogistic ? (reqForm.selectedDC||"Riyadh") : (dc||user.dc);
      if (isAdmin||isLogistic) {
        // Admin — direct add, no approval needed
        const vData = {
          plate:reqForm.plate, type:reqForm.type, brand:reqForm.brand||"",
          model:reqForm.model||"", year:reqForm.year||"", color:reqForm.color||"",
          ownership:reqForm.ownership||"Owned", dc:targetDC,
          fuelCapacity:reqForm.fuelCapacity||80, fuelLevel:reqForm.fuelCapacity||80,
          kmpl:reqForm.kmpl||12, mileage:reqForm.kmpl||12,
          engineNo:reqForm.engineNo||"", chassisNo:reqForm.chassisNo||"",
          startOdometer:reqForm.startOdometer||0, totalKM:reqForm.startOdometer||0,
          fahas:reqForm.fahas||"", insurance:reqForm.insurance||"", istimara:reqForm.istimara||"",
          status:"Active", maintHistory:[], photos:[],
          approvedBy:user.name, approvedAt:new Date().toISOString(),
          createdAt:new Date().toISOString()
        };
        const vDocRef = await addDoc(collection(db, "vehicles"), vData);
        setFsVehicles(prev=>[...prev, { firestoreId:vDocRef.id, ...vData }]);
        flash("✅ Vehicle "+reqForm.plate+" added to "+(isLogistic?targetDC:"your DC")+"!");
      } else {
        // Manager — submit request for Admin approval
        const newReq = {
          ...reqForm, dc: targetDC,
          requestedBy: user.name, requestedAt: new Date().toLocaleDateString(),
          status: "pending"
        };
        const docRef = await addDoc(collection(db, "vehicleRequests"), newReq);
        setVehicleRequests(prev=>[...prev, { id:docRef.id, ...newReq }]);
        await sendNotification({
          toRole:"admin", type:"vehicle",
          data:{ driverName:user.name, dc:targetDC, plate:reqForm.plate }
        });
        flash(t.reqSubmitted);
      }
      setShowReqForm(false);
      setReqForm({ plate:"", type:"Dyna", brand:"", model:"", year:"", color:"", ownership:"Owned", fuelCapacity:80, kmpl:12, engineNo:"", chassisNo:"", startOdometer:0, fahas:"", insurance:"", istimara:"", reason:"" });
    } catch(e) { flash("❌ Error: "+e.message); }
    setSubmitting(false);
  }

  async function approveVehicleRequest(req) {
    try {
      const vData = {
        plate:req.plate, type:req.type, brand:req.brand||"", model:req.model||"",
        year:req.year||"", color:req.color||"", ownership:req.ownership||"Owned",
        dc:req.dc, fuelCapacity:req.fuelCapacity||80,
        fuelLevel:req.fuelCapacity||80,
        kmpl:req.kmpl||12,           // KMPL from induction — used in all reporting
        mileage:req.kmpl||12,        // keep mileage alias in sync
        engineNo:req.engineNo||"", chassisNo:req.chassisNo||"",
        startOdometer:req.startOdometer||0,
        totalKM:req.startOdometer||0,
        fahas:req.fahas||"", insurance:req.insurance||"", istimara:req.istimara||"",
        status:"Active", maintHistory:[], photos:[],
        approvedBy:user.name, approvedAt:new Date().toISOString()
      };
      const vDocRef = await addDoc(collection(db, "vehicles"), vData);
      setFsVehicles(prev=>[...prev, { firestoreId:vDocRef.id, ...vData }]);
      await updateDoc(doc(db,"vehicleRequests",req.id), { status:"approved", approvedBy:user.name });
      setVehicleRequests(prev=>prev.map(r=>r.id===req.id?{...r,status:"approved"}:r));
      await sendNotification({
        toRole:"manager", toDC:req.dc, type:"vehicle_approved",
        data:{ plate:req.plate }
      });
      flash(t.reqApproved);
    } catch(e) { flash("❌ Error: "+e.message); }
  }

  async function rejectVehicleRequest(req) {
    try {
      await updateDoc(doc(db,"vehicleRequests",req.id), { status:"rejected", rejectedBy:user.name });
      setVehicleRequests(prev=>prev.map(r=>r.id===req.id?{...r,status:"rejected"}:r));
      await sendNotification({
        toRole:"manager", toDC:req.dc, type:"vehicle_rejected",
        data:{ plate:req.plate }
      });
      flash(t.reqRejected);
    } catch(e) { flash("❌ Error: "+e.message); }
  }

  // Admin edits approved vehicle (KMPL, docs, etc.)
  async function saveVehicleEdit(vehicle) {
    const updates = {
      kmpl: Number(editForm.kmpl)||vehicle.kmpl||12,
      mileage: Number(editForm.kmpl)||vehicle.kmpl||12, // keep alias in sync
      engineNo: editForm.engineNo||"",
      chassisNo: editForm.chassisNo||"",
      fahas: editForm.fahas||"",
      insurance: editForm.insurance||"",
      istimara: editForm.istimara||"",
      color: editForm.color||"",
      ownership: editForm.ownership||"Owned",
      lastEditedBy: user.name,
      lastEditedAt: new Date().toISOString()
    };
    if (vehicle.firestoreId) {
      try { await updateDoc(doc(db,"vehicles",vehicle.firestoreId), updates); } catch(e) { flash("❌ "+e.message); return; }
    }
    setFsVehicles(prev=>prev.map(v=>v.firestoreId===vehicle.firestoreId?{...v,...updates}:v));
    setEditingId(null);
    flash("✅ "+vehicle.plate+" updated — KMPL & documents saved");
  }

  // Section label style
  const sectionLabel = { fontSize:11, fontWeight:700, color:"#6366f1", textTransform:"uppercase", letterSpacing:1, marginBottom:8, marginTop:14 };

  return (
    <div>
      {/* Manager — Request Button */}
      {(isManager||isAdmin||isLogistic)&&(
        <div style={{ marginBottom:12 }}>
          <Btn small onClick={()=>setShowReqForm(!showReqForm)} color="#7c3aed">
            🚗 {isAdmin?"Add Vehicle Directly":t.requestVehicle}
          </Btn>
        </div>
      )}

      {/* Manager — Request Form (3 sections) */}
      {showReqForm&&(isManager||isAdmin||isLogistic)&&(
        <Card style={{ borderLeft:"4px solid #7c3aed", marginBottom:16 }}>
          <CardTitle>🚗 {t.requestVehicle}</CardTitle>

          {/* DC Selector for Logistic — they choose which DC vehicle belongs to */}
          {isLogistic&&(
            <div style={{ marginBottom:14, padding:"10px 14px", background:"#f0f9ff", borderRadius:8, border:"1px solid #bae6fd" }}>
              <label style={{ fontSize:13,fontWeight:600,color:"#0369a1",display:"block",marginBottom:6 }}>📍 Select Distribution Center *</label>
              <select value={reqForm.selectedDC||"Riyadh"} onChange={e=>setReqForm({...reqForm,selectedDC:e.target.value})}
                style={{ width:"100%",border:"1.5px solid #bae6fd",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box" }}>
                <option value="Riyadh">Riyadh Distribution Center</option>
                <option value="Jeddah">Jeddah Distribution Center</option>
                <option value="Dammam">Dammam Distribution Center</option>
              </select>
            </div>
          )}
          {/* Section 1 — Basic Info */}
          <div style={sectionLabel}>📋 {t.basicInfo}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
            <Input label={t.reqPlate+"*"} value={reqForm.plate} onChange={v=>setReqForm({...reqForm,plate:v})} />
            <Select label={t.reqType} value={reqForm.type} onChange={v=>setReqForm({...reqForm,type:v})} options={["Dyna","Bus","Truck","Van","Pickup"]} />
            <Input label={t.reqBrand} value={reqForm.brand} onChange={v=>setReqForm({...reqForm,brand:v})} placeholder="Toyota" />
            <Input label={t.reqModel} value={reqForm.model} onChange={v=>setReqForm({...reqForm,model:v})} />
            <Input label={t.reqYear} value={reqForm.year} onChange={v=>setReqForm({...reqForm,year:v})} type="number" placeholder="2024" />
            <Input label={t.color} value={reqForm.color} onChange={v=>setReqForm({...reqForm,color:v})} placeholder="White" />
            <Select label={t.ownership} value={reqForm.ownership} onChange={v=>setReqForm({...reqForm,ownership:v})} options={OWNERSHIP_TYPES} />
          </div>

          {/* Section 2 — Technical Info */}
          <div style={sectionLabel}>🔧 {t.technicalInfo}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
            <Input label={t.engineNo} value={reqForm.engineNo} onChange={v=>setReqForm({...reqForm,engineNo:v})} />
            <Input label={t.chassisNo} value={reqForm.chassisNo} onChange={v=>setReqForm({...reqForm,chassisNo:v})} />
            <Input label={t.reqFuelCap+" (L)"} value={reqForm.fuelCapacity} onChange={v=>setReqForm({...reqForm,fuelCapacity:Number(v)})} type="number" />
            <div>
              <Input label={t.kmpl+" *"} value={reqForm.kmpl} onChange={v=>setReqForm({...reqForm,kmpl:Number(v)})} type="number" placeholder="12" />
              <div style={{ fontSize:11, color:"#6366f1", marginTop:2 }}>⚠️ Used in fuel & reporting calculations</div>
            </div>
            <Input label={t.startOdometer} value={reqForm.startOdometer} onChange={v=>setReqForm({...reqForm,startOdometer:Number(v)})} type="number" placeholder="0" />
          </div>

          {/* Section 3 — Documents */}
          <div style={sectionLabel}>📄 {t.documents}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
            <Input label={t.fahas} value={reqForm.fahas} onChange={v=>setReqForm({...reqForm,fahas:v})} type="date" />
            <Input label={t.insurance} value={reqForm.insurance} onChange={v=>setReqForm({...reqForm,insurance:v})} type="date" />
            <Input label={t.istimara} value={reqForm.istimara} onChange={v=>setReqForm({...reqForm,istimara:v})} type="date" />
          </div>

          {/* Reason */}
          <div style={{ marginTop:12 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{t.reqReason}</label>
            <textarea value={reqForm.reason} onChange={e=>setReqForm({...reqForm,reason:e.target.value})} rows={2}
              style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", boxSizing:"border-box", resize:"vertical" }} />
          </div>
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <Btn onClick={submitVehicleRequest} color="#7c3aed" style={{ flex:1 }} disabled={submitting}>
              {submitting?"Submitting...":"📤 "+t.reqSubmit}
            </Btn>
            <Btn onClick={()=>setShowReqForm(false)} color="#64748b">Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Manager — My Pending Requests */}
      {isManager&&!isAdmin&&!isLogistic&&myPendingReqs.length>0&&(
        <Card style={{ borderLeft:"4px solid #f59e0b", marginBottom:16 }}>
          <CardTitle>⏳ {t.reqPending} ({myPendingReqs.length})</CardTitle>
          {myPendingReqs.map(req=>(
            <div key={req.id} style={{ padding:"10px 0", borderBottom:"1px solid #f1f5f9", fontSize:14 }}>
              <div style={{ fontWeight:700 }}>🚗 {req.plate} — {req.type} {req.brand} {req.model}</div>
              <div style={{ color:"#64748b", fontSize:13 }}>Requested: {req.requestedAt} | <span style={{ color:"#f59e0b", fontWeight:600 }}>Pending Admin Approval</span></div>
              <div style={{ fontSize:12, color:"#94a3b8" }}>KMPL: {req.kmpl||12} | Fuel: {req.fuelCapacity}L | {req.ownership}</div>
              {req.reason&&<div style={{ color:"#94a3b8", fontSize:12 }}>📝 {req.reason}</div>}
            </div>
          ))}
        </Card>
      )}

      {/* Admin — Pending Requests to Approve */}
      {isAdmin&&allPendingReqs.length>0&&(
        <Card style={{ borderLeft:"4px solid #6366f1", marginBottom:16 }}>
          <CardTitle>📋 Vehicle Requests — Pending Approval ({allPendingReqs.length})</CardTitle>
          {allPendingReqs.map(req=>(
            <div key={req.id} style={{ padding:"12px 0", borderBottom:"1px solid #f1f5f9" }}>
              <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>🚗 {req.plate} — {req.type} {req.brand} {req.model} {req.year&&`(${req.year})`}</div>
                  <div style={{ fontSize:13, color:"#64748b" }}>DC: {req.dc} | By: {req.requestedBy} | {req.requestedAt} | {req.ownership||"Owned"}</div>
                  <div style={{ fontSize:13, color:"#64748b" }}>⛽ {req.fuelCapacity}L | 📊 {req.kmpl||12} km/L | 🛣️ Start: {req.startOdometer||0} KM</div>
                  {req.engineNo&&<div style={{ fontSize:12, color:"#94a3b8" }}>Engine: {req.engineNo} | Chassis: {req.chassisNo}</div>}
                  <div style={{ fontSize:12, marginTop:4 }}>
                    <ExpiryBadge label="Fahas" date={req.fahas} />
                    <ExpiryBadge label="Insurance" date={req.insurance} />
                    <ExpiryBadge label="Istimara" date={req.istimara} />
                  </div>
                  {req.reason&&<div style={{ fontSize:12, color:"#94a3b8" }}>📝 {req.reason}</div>}
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                  <Btn small onClick={()=>approveVehicleRequest(req)} color="#10b981">{t.reqApprove}</Btn>
                  <Btn small onClick={()=>rejectVehicleRequest(req)} color="#ef4444">{t.reqReject}</Btn>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Expiry Alerts — Fahas + Insurance + Istimara */}
      {alerts.length>0&&(
        <Card style={{ border:"1px solid #fbbf24", marginBottom:16 }}>
          <CardTitle>⚠️ {t.expiryAlerts}</CardTitle>
          {alerts.map(v=>(
            <div key={v.plate||v.firestoreId} style={{ padding:"8px 0", borderBottom:"1px solid #f1f5f9", fontSize:13 }}>
              <span style={{ fontWeight:700 }}>🚗 {v.plate}</span>
              <ExpiryBadge label="Fahas"     date={v.fahas}    />
              <ExpiryBadge label="Insurance" date={v.insurance} />
              <ExpiryBadge label="Istimara"  date={v.istimara}  />
            </div>
          ))}
        </Card>
      )}

      {vehicles.length===0&&(
        <Card><div style={{ textAlign:"center", padding:32, color:"#94a3b8", fontSize:15 }}>🚗 {t.noVehicles}</div></Card>
      )}

      {/* Vehicle cards grouped by DC */}
      {["Riyadh","Jeddah","Dammam"].filter(d=>!dc||d===dc).map(dcName=>{
        const dv = vehicles.filter(v=>v.dc===dcName);
        if (!dv.length) return null;
        return (
          <Card key={dcName}>
            <CardTitle style={{ color:DC_COLORS[dcName] }}>📍 {dcName} Distribution Center — {dv.length} vehicles</CardTitle>
            {dv.map(v=>{
              const fuelPct = Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100);
              const vId = v.plate||v.firestoreId;
              const isEditing = editingId===vId;
              const kmpl = v.kmpl||v.mileage||12;
              return (
                <div key={vId} style={{ borderBottom:"1px solid #f1f5f9", padding:"14px 0" }}>
                  {/* Header row */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8, marginBottom:8 }}>
                    <div>
                      <span style={{ fontWeight:700, fontSize:16 }}>{v.plate}</span>
                      <span style={{ fontSize:13, color:"#64748b", marginLeft:8 }}>{v.type} {v.brand} {v.model} {v.year&&`(${v.year})`}</span>
                      {v.color&&<span style={{ fontSize:12, color:"#94a3b8", marginLeft:6 }}>• {v.color}</span>}
                      {v.ownership&&<span style={{ fontSize:11, fontWeight:600, padding:"2px 7px", borderRadius:99, background:"#f1f5f9", color:"#374151", marginLeft:8 }}>{v.ownership}</span>}
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{ fontSize:13, fontWeight:600, padding:"4px 12px", borderRadius:99, background:v.status==="Active"?"#d1fae5":"#fee2e2", color:v.status==="Active"?"#065f46":"#991b1b" }}>
                        {v.status||"Active"}
                      </span>
                      {/* Admin edit button */}
                      {isAdmin&&!isEditing&&(
                        <Btn small onClick={()=>{ setEditingId(vId); setEditForm({ kmpl, engineNo:v.engineNo||"", chassisNo:v.chassisNo||"", fahas:v.fahas||"", insurance:v.insurance||"", istimara:v.istimara||"", color:v.color||"", ownership:v.ownership||"Owned" }); }} color="#6366f1">
                          ✏️ {t.edit}
                        </Btn>
                      )}
                    </div>
                  </div>

                  {/* Fuel bar */}
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
                      <span>⛽ {t.fuelLevel}: {v.fuelLevel||0}L / {v.fuelCapacity||80}L</span>
                      <span style={{ fontWeight:700, color:fuelPct<25?"#ef4444":fuelPct<50?"#f59e0b":"#10b981" }}>{fuelPct}%</span>
                    </div>
                    <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
                      <div style={{ width:`${fuelPct}%`, height:"100%", background:fuelPct<25?"#ef4444":"#10b981", borderRadius:99 }} />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:6, fontSize:13, color:"#64748b", marginBottom:8 }}>
                    <span>🛣️ {t.totalKM}: {(v.totalKM||0).toLocaleString()}</span>
                    <span>📊 {kmpl} km/L (KMPL)</span>
                    {v.engineNo&&<span>🔩 Engine: {v.engineNo}</span>}
                    {v.chassisNo&&<span>🏗️ Chassis: {v.chassisNo}</span>}
                  </div>

                  {/* Expiry badges */}
                  <div style={{ marginBottom:8, display:"flex", flexWrap:"wrap", gap:4 }}>
                    <ExpiryBadge label="Fahas"     date={v.fahas}    />
                    <ExpiryBadge label="Insurance" date={v.insurance} />
                    <ExpiryBadge label="Istimara"  date={v.istimara}  />
                  </div>

                  {/* Admin Edit Form */}
                  {isAdmin&&isEditing&&(
                    <div style={{ background:"#f8fafc", borderRadius:8, padding:14, marginTop:8, border:"1px solid #e2e8f0" }}>
                      <div style={{ fontWeight:700, fontSize:14, color:"#6366f1", marginBottom:10 }}>✏️ {t.editVehicle}</div>

                      <div style={sectionLabel}>🔧 {t.technicalInfo}</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
                        <div>
                          <Input label={t.kmpl+" (km/L) *"} value={editForm.kmpl} onChange={val=>setEditForm({...editForm,kmpl:val})} type="number" />
                          <div style={{ fontSize:11, color:"#ef4444", marginTop:2 }}>⚠️ Affects all fuel & reporting calculations</div>
                        </div>
                        <Input label={t.engineNo} value={editForm.engineNo} onChange={val=>setEditForm({...editForm,engineNo:val})} />
                        <Input label={t.chassisNo} value={editForm.chassisNo} onChange={val=>setEditForm({...editForm,chassisNo:val})} />
                        <Input label={t.color} value={editForm.color} onChange={val=>setEditForm({...editForm,color:val})} />
                        <Select label={t.ownership} value={editForm.ownership} onChange={val=>setEditForm({...editForm,ownership:val})} options={OWNERSHIP_TYPES} />
                      </div>

                      <div style={sectionLabel}>📄 {t.documents}</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 12px" }}>
                        <Input label={t.fahas}     value={editForm.fahas}     onChange={val=>setEditForm({...editForm,fahas:val})}     type="date" />
                        <Input label={t.insurance} value={editForm.insurance} onChange={val=>setEditForm({...editForm,insurance:val})} type="date" />
                        <Input label={t.istimara}  value={editForm.istimara}  onChange={val=>setEditForm({...editForm,istimara:val})}  type="date" />
                      </div>

                      <div style={{ display:"flex", gap:8, marginTop:12 }}>
                        <Btn small onClick={()=>saveVehicleEdit(v)} color="#10b981">✅ {t.saveVehicle}</Btn>
                        <Btn small onClick={()=>setEditingId(null)} color="#64748b">{t.cancel}</Btn>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  {canManage&&!isEditing&&(
                    <div style={{ display:"flex", gap:8, marginTop:4 }}>
                      {v.status==="Active"?(
                        <Btn small onClick={()=>{ setShowMaint(vId); setMaintForm({type:"Scheduled Service",startDate:"",returnDate:"",cost:"",notes:""}); }} color="#f59e0b">🔧 {t.sendMaint}</Btn>
                      ):(
                        <Btn small onClick={()=>onReactivate(v)} color="#10b981">✅ {t.reactivate}</Btn>
                      )}
                    </div>
                  )}

                  {/* Maintenance Form */}
                  {showMaint===vId&&(
                    <div style={{ marginTop:12, padding:14, background:"#f8fafc", borderRadius:8 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
                        <Select label={t.maintType} value={maintForm.type} onChange={v2=>setMaintForm({...maintForm,type:v2})} options={MAINTENANCE_TYPES} />
                        <Input label={t.cost+" (SAR)"} value={maintForm.cost} onChange={v2=>setMaintForm({...maintForm,cost:v2})} type="number" />
                        <Input label={t.startDate}  value={maintForm.startDate}  onChange={v2=>setMaintForm({...maintForm,startDate:v2})}  type="date" />
                        <Input label={t.returnDate} value={maintForm.returnDate} onChange={v2=>setMaintForm({...maintForm,returnDate:v2})} type="date" />
                        <div style={{ gridColumn:"1/-1" }}><Input label={t.notes} value={maintForm.notes} onChange={v2=>setMaintForm({...maintForm,notes:v2})} /></div>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <Btn small onClick={()=>{ onSendMaint(v,maintForm); setShowMaint(null); }} color="#f59e0b">✅ {t.confirm}</Btn>
                        <Btn small onClick={()=>setShowMaint(null)} color="#64748b">{t.cancel}</Btn>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// DRIVERS TAB
// ─────────────────────────────────────────────
function DriversTab({ drivers, dc, t, canManage, onSetStatus, isAdmin, DCS, dcLabel }) {
  return (
    <div>
      {drivers.length===0&&(
        <Card><div style={{ textAlign:"center", padding:32, color:"#94a3b8", fontSize:15 }}>👤 {t.noDrivers}</div></Card>
      )}
      {DCS.filter(d=>!dc||d===dc).map(dcName=>{
        const dv = drivers.filter(d=>d.dc===dcName);
        if (!dv.length) return null;
        return (
          <Card key={dcName}>
            <CardTitle style={{ color:DC_COLORS[dcName] }}>📍 {dcName} Distribution Center — {dv.length} drivers</CardTitle>
            {dv.map(dr=>(
              <div key={dr.uid} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"#b45309", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:16, flexShrink:0 }}>
                  {(dr.name||"?").charAt(0)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{dr.name}</div>
                  <div style={{ fontSize:13, color:"#64748b" }}>{dr.mobile||dr.phone}</div>
                  {dr.licNo&&<div style={{ fontSize:12, color:"#6366f1" }}>📄 Lic: {dr.licNo} | Exp: {dr.licExp}</div>}
                  {dr.driverCard&&<div style={{ fontSize:12, color:"#6366f1" }}>🪪 Card: {dr.driverCard} | Exp: {dr.driverCardExp}</div>}
                </div>
                <span style={{ fontSize:13, fontWeight:600, padding:"4px 12px", borderRadius:99,
                  background:dr.status==="active"||dr.status==="Active"?"#d1fae5":dr.status==="On Leave"?"#fef3c7":"#fee2e2",
                  color:dr.status==="active"||dr.status==="Active"?"#065f46":dr.status==="On Leave"?"#92400e":"#991b1b"
                }}>{dr.status||"Active"}</span>
                {canManage&&(
                  <div style={{ display:"flex", gap:6 }}>
                    {(dr.status==="active"||dr.status==="Active")&&<Btn small onClick={()=>onSetStatus(dr,"On Leave")} color="#f59e0b">🏖️ {t.markLeave}</Btn>}
                    {dr.status==="On Leave"&&<Btn small onClick={()=>onSetStatus(dr,"active")} color="#10b981">✅ {t.markActive}</Btn>}
                  </div>
                )}
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAINTENANCE TAB
// ─────────────────────────────────────────────
function MaintTab({ vehicles, t }) {
  const withHist = vehicles.filter(v=>(v.maintHistory||[]).length>0);
  return (
    <Card>
      <CardTitle>🔧 {t.maintenance}</CardTitle>
      {withHist.length===0&&<div style={{ textAlign:"center", padding:24, color:"#94a3b8", fontSize:15 }}>{t.noMaint}</div>}
      {withHist.map(v=>(
        <div key={v.plate||v.firestoreId} style={{ marginBottom:18 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:8 }}>🚗 {v.plate} ({v.type}) — {v.dc} DC</div>
          {(v.maintHistory||[]).map((m,i)=>(
            <div key={i} style={{ background:"#f8fafc", borderRadius:8, padding:"12px 16px", marginBottom:8, fontSize:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:4 }}>
                <span style={{ fontWeight:600 }}>🔧 {m.type}</span>
                <span style={{ color:"#64748b" }}>📅 {m.date}</span>
              </div>
              {m.startDate&&<div style={{ color:"#64748b", marginTop:4 }}>Start: {m.startDate}{m.returnDate&&" | Return: "+m.returnDate}{m.cost&&" | SAR "+m.cost}</div>}
              {m.notes&&<div style={{ color:"#374151", marginTop:4 }}>📝 {m.notes}</div>}
              {m.addedBy&&<div style={{ color:"#94a3b8", fontSize:12, marginTop:4 }}>By: {m.addedBy}</div>}
            </div>
          ))}
        </div>
      ))}
    </Card>
  );
}

const sectionLabel = { fontSize:11, fontWeight:700, color:"#6366f1", textTransform:"uppercase", letterSpacing:1, marginBottom:8, marginTop:14 };
