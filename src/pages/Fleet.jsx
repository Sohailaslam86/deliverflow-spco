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
    fahas:"Fahas", nextOil:"Next Oil", insurance:"Insurance",
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
  },
  ar: {
    vehicles:"المركبات", drivers:"السائقون", maintenance:"سجل الصيانة",
    overview:"عرض ملخص", total:"الإجمالي",
    active:"نشط", inMaint:"في الصيانة", expiryAlerts:"تنبيهات الانتهاء",
    fuelLevel:"مستوى الوقود", totalKM:"إجمالي الكيلومترات",
    fahas:"الفحص", nextOil:"تغيير الزيت", insurance:"التأمين",
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
  }
};

const DC_COLORS = { Riyadh:"#1A3A5C", Jeddah:"#0f766e", Dammam:"#7c3aed" };

function dcLabel(dc, t) {
  if (dc==="Riyadh") return t.riyadhDC;
  if (dc==="Jeddah") return t.jeddahDC;
  return t.dammamDC;
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

  const tabs = (isAdmin||isManagement)
    ? [["overview","📊",t.overview],["vehicles","🚗",t.vehicles],["drivers","👤",t.drivers],["maintenance","🔧",t.maintenance]]
    : [["overview","📊",t.overview],["vehicles","🚗",t.vehicles],["drivers","👤",t.drivers],["maintenance","🔧",t.maintenance]];

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

  // Use Firestore vehicles if available, else masterData
  const allVehicles = fsVehicles.length > 0 ? fsVehicles : masterVehicles;
  const allDrivers = fsDrivers.length > 0 ? fsDrivers : (masterUsers||[]).filter(u=>u.role==="driver");

  const myVehicles = dc ? allVehicles.filter(v=>v.dc===dc) : allVehicles;
  const myDrivers = dc ? allDrivers.filter(d=>d.dc===dc) : allDrivers;

  async function sendMaint(vehicle, maintForm) {
    const maintRecord = { ...maintForm, date: new Date().toLocaleDateString(), addedBy: user.name };
    const updateData = { status:"Maintenance", maintHistory:[...(vehicle.maintHistory||[]), maintRecord] };
    if (vehicle.firestoreId) {
      try { await updateDoc(doc(db,"vehicles",vehicle.firestoreId), updateData); } catch(e) { console.error(e); }
    }
    setFsVehicles(prev=>prev.map(v=>v.firestoreId===vehicle.firestoreId?{...v,...updateData}:v));

    // TASK 5: Auto-save vehicleOffDays when maintenance record is saved
    // This avoids double-entry in System Config → Vehicle Off Days tab
    if (maintForm.startDate && maintForm.returnDate) {
      try {
        await addDoc(collection(db, "vehicleOffDays"), {
          vehiclePlate: vehicle.plate,
          reason: maintForm.type || "Maintenance",
          from: maintForm.startDate,
          to: maintForm.returnDate,
          dc: vehicle.dc,
          source: "fleet_maintenance",
          cost: maintForm.cost || "",
          notes: maintForm.notes || "",
          addedBy: user.name,
          createdAt: new Date().toISOString()
        });
        flash(vehicle.plate + " sent to maintenance ✅ Off Days auto-saved");
      } catch(e) {
        console.error("VehicleOffDays save error:", e);
        flash(vehicle.plate + " sent to maintenance");
      }
    } else {
      flash(vehicle.plate + " sent to maintenance");
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

  function DCVehBox({ dcName }) {
    const color = DC_COLORS[dcName];
    const dv = allVehicles.filter(v=>v.dc===dcName);
    const act = dv.filter(v=>v.status==="Active").length;
    const mnt = dv.filter(v=>v.status==="Maintenance").length;
    return (
      <Card style={{ borderTop:`4px solid ${color}` }}>
        <CardTitle style={{ color, fontSize:16 }}>📍 {dcLabel(dcName,t)}</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          <StatCard icon="🚗" label={t.total} value={dv.length} color={color} />
          <StatCard icon="✅" label={t.active} value={act} color="#10b981" />
          <StatCard icon="🔧" label={t.inMaint} value={mnt} color="#f59e0b" />
        </div>
      </Card>
    );
  }

  function DCDrvBox({ dcName }) {
    const color = DC_COLORS[dcName];
    const dv = allDrivers.filter(d=>d.dc===dcName);
    const act = dv.filter(d=>d.status==="active"||d.status==="Active").length;
    const leave = dv.filter(d=>d.status==="On Leave").length;
    return (
      <Card style={{ borderTop:`4px solid ${color}` }}>
        <CardTitle style={{ color, fontSize:16 }}>📍 {dcLabel(dcName,t)}</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          <StatCard icon="👤" label={t.total} value={dv.length} color={color} />
          <StatCard icon="✅" label={t.active} value={act} color="#10b981" />
          <StatCard icon="🏖️" label={t.onLeave} value={leave} color="#f59e0b" />
        </div>
      </Card>
    );
  }

  if (loading) {
    return <div style={{ textAlign:"center", padding:40, fontSize:16, color:"#64748b" }}>⏳ {t.loading}</div>;
  }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done}/>}
      <TabBar tabs={tabs} active={tab} onChange={setTab}/>

      {/* OVERVIEW — Admin only */}
      {tab==="overview"&&(
        <div>
          {/* Vehicles Overview */}
          <Card style={{ borderTop:"4px solid #1A3A5C" }}>
            <CardTitle>🚗 {t.allVehicles}</CardTitle>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:12 }}>
              <StatCard icon="🚗" label={t.total} value={allVehicles.length} color="#6366f1" />
              <StatCard icon="✅" label={t.active} value={allVehicles.filter(v=>v.status==="Active").length} color="#10b981" />
              <StatCard icon="🔧" label={t.inMaint} value={allVehicles.filter(v=>v.status==="Maintenance").length} color="#f59e0b" />
              <StatCard icon="⚠️" label={t.expired} value={allVehicles.filter(v=>v.fahas&&Math.ceil((new Date(v.fahas)-new Date())/(1000*60*60*24))<=30).length} color="#ef4444" />
            </div>
            {/* Fuel efficiency drop alerts */}
            {allVehicles.filter(v=>{
              const kmpl = v.mileage||12;
              const actual = v.totalKM&&v.fuelUsedTotal ? v.totalKM/v.fuelUsedTotal : null;
              return actual && actual < kmpl*0.8;
            }).map(v=>(
              <div key={v.plate} style={{ background:"#fef3c7", border:"1px solid #fed7aa", borderRadius:7, padding:"7px 12px", marginTop:8, fontSize:13, color:"#92400e", fontWeight:600 }}>
                ⚠️ {v.plate} — Fuel efficiency drop detected (KMPL below 80% of baseline)
              </div>
            ))}
          </Card>
          {/* DC Filter tabs */}
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
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:16 }}>
            {(dc?[dc]:overviewDC==="all"?["Riyadh","Jeddah","Dammam"]:[overviewDC]).map(dcN=>(
              <DCVehBox key={dcN} dcName={dcN}/>
            ))}
          </div>

          {/* Drivers Overview */}
          <Card style={{ borderTop:"4px solid #0f766e" }}>
            <CardTitle>👤 {t.allDrivers}</CardTitle>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:12 }}>
              <StatCard icon="👤" label={t.total} value={allDrivers.length} color="#6366f1" />
              <StatCard icon="✅" label={t.active} value={allDrivers.filter(d=>d.status==="active"||d.status==="Active").length} color="#10b981" />
              <StatCard icon="🏖️" label={t.onLeave} value={allDrivers.filter(d=>d.status==="On Leave").length} color="#f59e0b" />
              <StatCard icon="⚠️" label={t.inactive} value={allDrivers.filter(d=>d.status==="inactive"||d.status==="Inactive").length} color="#ef4444" />
            </div>
          </Card>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
            {(dc?[dc]:overviewDC==="all"?["Riyadh","Jeddah","Dammam"]:[overviewDC]).map(dcN=>(
              <DCDrvBox key={dcN} dcName={dcN}/>
            ))}
          </div>
        </div>
      )}

      {/* VEHICLES TAB */}
      {tab==="vehicles"&&(
        <VehiclesTab vehicles={myVehicles} dc={dc} t={t} canManage={canManage} user={user} onSendMaint={sendMaint} onReactivate={reactivate} isAdmin={isAdmin} isManager={isManager} vehicleRequests={vehicleRequests} setVehicleRequests={setVehicleRequests} setFsVehicles={setFsVehicles} flash={flash} />
      )}

      {/* DRIVERS TAB */}
      {tab==="drivers"&&(
        <DriversTab drivers={myDrivers} dc={dc} t={t} canManage={canManage} onSetStatus={setDriverStatus} isAdmin={isAdmin} DCS={DCS} dcLabel={dcLabel} allDrivers={allDrivers} />
      )}

      {/* MAINTENANCE TAB */}
      {tab==="maintenance"&&(
        <MaintTab vehicles={myVehicles} t={t} />
      )}
    </div>
  );
}

function VehiclesTab({ vehicles, dc, t, canManage, user, onSendMaint, onReactivate, isAdmin, isManager, vehicleRequests, setVehicleRequests, setFsVehicles, flash }) {
  const [showMaint, setShowMaint] = useState(null);
  const [maintForm, setMaintForm] = useState({ type:"Scheduled Service", startDate:"", returnDate:"", cost:"", notes:"" });
  const [showReqForm, setShowReqForm] = useState(false);
  const [reqForm, setReqForm] = useState({ plate:"", type:"Dyna", brand:"", model:"", year:"", fuelCapacity:80, reason:"" });
  const [submitting, setSubmitting] = useState(false);

  const alerts = vehicles.filter(v => v.fahas && Math.ceil((new Date(v.fahas)-new Date())/(1000*60*60*24))<=60);

  // Manager pending requests (own DC)
  const myPendingReqs = (vehicleRequests||[]).filter(r=>r.status==="pending"&&(!dc||r.dc===dc));
  // Admin sees all pending
  const allPendingReqs = isAdmin ? (vehicleRequests||[]).filter(r=>r.status==="pending") : [];

  async function submitVehicleRequest() {
    if (!reqForm.plate||!reqForm.reason) { flash("❌ Plate number and reason are required!"); return; }
    setSubmitting(true);
    try {
      const newReq = {
        ...reqForm, dc: dc||user.dc,
        requestedBy: user.name, requestedAt: new Date().toLocaleDateString(),
        status: "pending"
      };
      const docRef = await addDoc(collection(db, "vehicleRequests"), newReq);
      setVehicleRequests(prev=>[...prev, { id:docRef.id, ...newReq }]);
      await sendNotification({
        toRole: "admin",
        type: "vehicle",
        title: "New Vehicle Request",
        message: `${user.name} (${dc||user.dc} DC) has requested a new vehicle: ${reqForm.plate} (${reqForm.type} ${reqForm.brand}).`,
      });
      flash(t.reqSubmitted);
      setShowReqForm(false);
      setReqForm({ plate:"", type:"Dyna", brand:"", model:"", year:"", fuelCapacity:80, reason:"" });
    } catch(e) { flash("❌ Error: "+e.message); }
    setSubmitting(false);
  }

  async function approveVehicleRequest(req) {
    try {
      // Add to vehicles Firestore
      const vData = {
        plate:req.plate, type:req.type, brand:req.brand||"", model:req.model||"",
        year:req.year||"", dc:req.dc, fuelCapacity:req.fuelCapacity||80,
        fuelLevel:req.fuelCapacity||80, mileage:12, status:"Active",
        totalKM:0, maintHistory:[], photos:[], fahas:"", insurance:"",
        approvedBy:user.name, approvedAt:new Date().toISOString()
      };
      const vDocRef = await addDoc(collection(db, "vehicles"), vData);
      setFsVehicles(prev=>[...prev, { firestoreId:vDocRef.id, ...vData }]);
      // Update request status
      await updateDoc(doc(db, "vehicleRequests", req.id), { status:"approved", approvedBy:user.name });
      setVehicleRequests(prev=>prev.map(r=>r.id===req.id?{...r,status:"approved"}:r));
      // Notify Manager
      await sendNotification({
        toRole:"manager", toDC:req.dc, type:"request_action",
        title:"Vehicle Request Approved ✅",
        message:`Your vehicle request for ${req.plate} (${req.type}) has been approved by ${user.name}.`,
      });
      flash(t.reqApproved);
    } catch(e) { flash("❌ Error: "+e.message); }
  }

  async function rejectVehicleRequest(req) {
    try {
      await updateDoc(doc(db, "vehicleRequests", req.id), { status:"rejected", rejectedBy:user.name });
      setVehicleRequests(prev=>prev.map(r=>r.id===req.id?{...r,status:"rejected"}:r));
      // Notify Manager
      await sendNotification({
        toRole:"manager", toDC:req.dc, type:"request_action",
        title:"Vehicle Request Rejected ❌",
        message:`Your vehicle request for ${req.plate} (${req.type}) has been rejected by ${user.name}.`,
      });
      flash(t.reqRejected);
    } catch(e) { flash("❌ Error: "+e.message); }
  }

  return (
    <div>
      {/* Manager — Request Button */}
      {isManager&&!isAdmin&&(
        <div style={{ marginBottom:12 }}>
          <Btn small onClick={()=>setShowReqForm(!showReqForm)} color="#7c3aed">🚗 {t.requestVehicle}</Btn>
        </div>
      )}

      {/* Manager — Request Form */}
      {showReqForm&&isManager&&!isAdmin&&(
        <Card style={{ borderLeft:"4px solid #7c3aed", marginBottom:16 }}>
          <CardTitle>🚗 {t.requestVehicle}</CardTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
            <Input label={t.reqPlate} value={reqForm.plate} onChange={v=>setReqForm({...reqForm,plate:v})} />
            <Select label={t.reqType} value={reqForm.type} onChange={v=>setReqForm({...reqForm,type:v})} options={["Dyna","Bus","Truck"]} />
            <Input label={t.reqBrand} value={reqForm.brand} onChange={v=>setReqForm({...reqForm,brand:v})} placeholder="Toyota" />
            <Input label={t.reqModel} value={reqForm.model} onChange={v=>setReqForm({...reqForm,model:v})} />
            <Input label={t.reqYear} value={reqForm.year} onChange={v=>setReqForm({...reqForm,year:v})} type="number" />
            <Input label={t.reqFuelCap} value={reqForm.fuelCapacity} onChange={v=>setReqForm({...reqForm,fuelCapacity:Number(v)})} type="number" />
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{t.reqReason}</label>
              <textarea value={reqForm.reason} onChange={e=>setReqForm({...reqForm,reason:e.target.value})} rows={2}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", boxSizing:"border-box", resize:"vertical" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn onClick={submitVehicleRequest} color="#7c3aed" style={{ flex:1 }} disabled={submitting}>
              {submitting?"Submitting...":"📤 "+t.reqSubmit}
            </Btn>
            <Btn onClick={()=>setShowReqForm(false)} color="#64748b">Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Manager — My Pending Requests */}
      {isManager&&!isAdmin&&myPendingReqs.length>0&&(
        <Card style={{ borderLeft:"4px solid #f59e0b", marginBottom:16 }}>
          <CardTitle>⏳ {t.reqPending} ({myPendingReqs.length})</CardTitle>
          {myPendingReqs.map(req=>(
            <div key={req.id} style={{ padding:"10px 0", borderBottom:"1px solid #f1f5f9", fontSize:14 }}>
              <div style={{ fontWeight:700 }}>🚗 {req.plate} — {req.type} {req.brand}</div>
              <div style={{ color:"#64748b", fontSize:13 }}>Requested: {req.requestedAt} | Status: <span style={{ color:"#f59e0b", fontWeight:600 }}>Pending Admin Approval</span></div>
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
                  <div style={{ fontWeight:700, fontSize:14 }}>🚗 {req.plate} — {req.type} {req.brand} {req.model}</div>
                  <div style={{ fontSize:13, color:"#64748b" }}>DC: {req.dc} | By: {req.requestedBy} | {req.requestedAt}</div>
                  <div style={{ fontSize:13, color:"#64748b" }}>Fuel: {req.fuelCapacity}L | Year: {req.year}</div>
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
      {alerts.length>0&&(
        <Card style={{ border:"1px solid #fbbf24" }}>
          <CardTitle>⚠️ {t.expiryAlerts}</CardTitle>
          {alerts.map(v=>{
            const days = Math.ceil((new Date(v.fahas)-new Date())/(1000*60*60*24));
            return (
              <div key={v.plate||v.firestoreId} style={{ padding:"8px 0", borderBottom:"1px solid #f1f5f9", fontSize:14, color:days<0?"#991b1b":"#92400e", fontWeight:600 }}>
                🔔 {v.plate} — Fahas: {v.fahas} ({days<0?Math.abs(days)+"d EXPIRED":days+"d left"})
              </div>
            );
          })}
        </Card>
      )}

      {vehicles.length===0&&(
        <Card><div style={{ textAlign:"center", padding:32, color:"#94a3b8", fontSize:15 }}>🚗 {t.noVehicles}</div></Card>
      )}

      {["Riyadh","Jeddah","Dammam"].filter(d=>!dc||d===dc).map(dcName=>{
        const dv = vehicles.filter(v=>v.dc===dcName);
        if (!dv.length) return null;
        return (
          <Card key={dcName}>
            <CardTitle style={{ color:DC_COLORS[dcName] }}>📍 {dcName} Distribution Center — {dv.length} vehicles</CardTitle>
            {dv.map(v=>{
              const fuelPct = Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100);
              return (
                <div key={v.plate||v.firestoreId} style={{ borderBottom:"1px solid #f1f5f9", padding:"14px 0" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8, marginBottom:8 }}>
                    <div>
                      <span style={{ fontWeight:700, fontSize:16 }}>{v.plate}</span>
                      <span style={{ fontSize:14, color:"#64748b", marginLeft:8 }}>{v.type} — {v.brand} {v.model}</span>
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, padding:"4px 12px", borderRadius:99, background:v.status==="Active"?"#d1fae5":"#fee2e2", color:v.status==="Active"?"#065f46":"#991b1b" }}>
                      {v.status||"Active"}
                    </span>
                  </div>
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
                      <span>⛽ {t.fuelLevel}: {v.fuelLevel||0}L / {v.fuelCapacity||80}L</span>
                      <span style={{ fontWeight:700, color:fuelPct<25?"#ef4444":fuelPct<50?"#f59e0b":"#10b981" }}>{fuelPct}%</span>
                    </div>
                    <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
                      <div style={{ width:`${fuelPct}%`, height:"100%", background:fuelPct<25?"#ef4444":"#10b981", borderRadius:99 }} />
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:6, fontSize:13, color:"#64748b", marginBottom:8 }}>
                    <span>🛣️ {t.totalKM}: {(v.totalKM||0).toLocaleString()}</span>
                    <span>📊 {v.mileage||12} km/L</span>
                    {v.fahas&&<span>🔧 Fahas: {v.fahas}</span>}
                    {v.insurance&&<span>🛡️ Insurance: {v.insurance}</span>}
                  </div>
                  {canManage&&(
                    <div style={{ display:"flex", gap:8 }}>
                      {v.status==="Active"?(
                        <Btn small onClick={()=>{setShowMaint(v.plate||v.firestoreId);setMaintForm({type:"Scheduled Service",startDate:"",returnDate:"",cost:"",notes:""});}} color="#f59e0b">🔧 {t.sendMaint}</Btn>
                      ):(
                        <Btn small onClick={()=>onReactivate(v)} color="#10b981">✅ {t.reactivate}</Btn>
                      )}
                    </div>
                  )}
                  {showMaint===(v.plate||v.firestoreId)&&(
                    <div style={{ marginTop:12, padding:14, background:"#f8fafc", borderRadius:8 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
                        <Select label={t.maintType} value={maintForm.type} onChange={v2=>setMaintForm({...maintForm,type:v2})} options={MAINTENANCE_TYPES} />
                        <Input label={t.cost+" (SAR)"} value={maintForm.cost} onChange={v2=>setMaintForm({...maintForm,cost:v2})} type="number" />
                        <Input label={t.startDate} value={maintForm.startDate} onChange={v2=>setMaintForm({...maintForm,startDate:v2})} type="date" />
                        <Input label={t.returnDate} value={maintForm.returnDate} onChange={v2=>setMaintForm({...maintForm,returnDate:v2})} type="date" />
                        <div style={{ gridColumn:"1/-1" }}><Input label={t.notes} value={maintForm.notes} onChange={v2=>setMaintForm({...maintForm,notes:v2})} /></div>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <Btn small onClick={()=>{onSendMaint(v,maintForm);setShowMaint(null);}} color="#f59e0b">✅ {t.confirm}</Btn>
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

function DriversTab({ drivers, dc, t, canManage, onSetStatus, isAdmin, DCS, dcLabel, allDrivers }) {
  return (
    <div>
      {drivers.length===0&&(
        <Card><div style={{ textAlign:"center", padding:32, color:"#94a3b8", fontSize:15 }}>👤 {t.noDrivers}</div></Card>
      )}
      {DCS.filter(d=>!dc||d===dc).map(dcName=>{
        const dv = (dc?drivers:allDrivers).filter(d=>d.dc===dcName);
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
              {m.startDate&&<div style={{ color:"#64748b", marginTop:4 }}>Start: {m.startDate} {m.returnDate&&"| Return: "+m.returnDate} {m.cost&&"| SAR "+m.cost}</div>}
              {m.notes&&<div style={{ color:"#374151", marginTop:4 }}>📝 {m.notes}</div>}
              {m.addedBy&&<div style={{ color:"#94a3b8", fontSize:12, marginTop:4 }}>By: {m.addedBy}</div>}
            </div>
          ))}
        </div>
      ))}
    </Card>
  );
}
