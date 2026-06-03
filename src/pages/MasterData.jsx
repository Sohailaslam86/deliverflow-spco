import { useState, useRef, useEffect } from "react";
import { Card, CardTitle, Btn, Input, Select, Textarea, SuccessMsg, TabBar } from "../components/Shared.jsx";
import { STORAGE_CONDITIONS, CITIES, DCS } from "../data/masterData.js";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { sendNotification } from "../notificationService.js";

const T = {
  en: {
    vehicles:"Vehicles", drivers:"Drivers", dcLocs:"Distribution Center Locations",
    storage:"Storage Conditions", cities:"Cities", allUsers:"User Directory",
    departments:"Departments",
    holidays:"Public Holidays", driverLeaves:"Driver Leaves", vehicleOff:"Vehicle Off Days",
    addHoliday:"Add Holiday", addLeave:"Add Leave Request", addVehicleOff:"Add Vehicle Off",
    holidayName:"Holiday Name", fromDate:"From Date", toDate:"To Date",
    leaveType:"Leave Type", annualLeave:"Annual Leave", sickLeave:"Sick Leave", emergencyLeave:"Emergency Leave",
    selectDriver:"Select Driver", selectVehicle:"Select Vehicle", reason:"Reason",
    myLeaveReq:"My Leave Requests", pendingApproval:"Pending Approval",
    approvedLeaves:"Approved Leaves", rejectedLeaves:"Rejected Leaves",
    approveLeave:"Approve", rejectLeave:"Reject",
    managerApprove:"Manager Approved — Waiting Admin",
    leaveApproved:"Leave approved!", leaveRejected:"Leave rejected.",
    submitLeaveReq:"Submit Leave Request",
    addVehicle:"Add Vehicle", addDriver:"Add Driver", addDC:"Add DC",
    addStorage:"Add Storage Condition", addCity:"Add City",
    addDept:"Add Department", deptName:"Department Name",
    plate:"Plate Number", type:"Type", homeDC:"Home DC",
    brand:"Brand", model:"Model", chassis:"Chassis", year:"Year",
    fuelCap:"Fuel Capacity (L)", mileage:"Mileage (km/L)",
    fahas:"Fahas Expiry", istimara:"Istimara Expiry", insurance:"Insurance Expiry",
    nextOilKM:"Next Oil KM", nextOilDate:"Next Oil Date",
    photos:"Vehicle Photos (up to 4)", uploadPhoto:"Upload Photo",
    aiCheck:"AI Plate Verify", aiChecking:"Verifying...",
    aiMatch:"Plate verified!", aiMismatch:"Plate mismatch",
    aiNoPlate:"Take photo first", addBtn:"Add", edit:"Edit",
    delete:"Delete", save:"Save", cancel:"Cancel",
    dcName:"DC Name", dcCity:"City", dcManager:"Manager",
    dcLat:"GPS Latitude", dcLng:"GPS Longitude",
    dcAddrEn:"Address (English)", dcAddrAr:"Address (Arabic)",
    storageName:"Condition Name", storageRange:"Temperature Range",
    storageColor:"Color", cityName:"City Name",
    registered:"registered", active:"Active", maintenance:"Maintenance",
    viewMap:"View on Map",
    driverName:"Driver Name", mobile:"Mobile", licNo:"License Number",
    licExp:"License Expiry", driverCard:"Driver Card", driverCardExp:"Card Expiry",
    status:"Status", onLeave:"On Leave", inactive:"Inactive",
    requestVehicle:"Request New Vehicle", requestDriver:"Request New Driver",
    reqPending:"Pending Requests", reqApprove:"Approve", reqReject:"Reject",
    reqReason:"Reason / Notes", reqSubmitted:"Request submitted for Admin approval!",
    reqApproved:"Request approved!", reqRejected:"Request rejected.",
    vehReqTab:"Vehicle Requests", drvReqTab:"Driver Requests"
  },
  ar: {
    vehicles:"المركبات", drivers:"السائقون", dcLocs:"مواقع مراكز التوزيع",
    storage:"ظروف التخزين", cities:"مدن التسليم", allUsers:"دليل المستخدمين",
    departments:"الأقسام",
    holidays:"الإجازات الرسمية", driverLeaves:"إجازات السائقين", vehicleOff:"أيام توقف المركبات",
    addHoliday:"إضافة إجازة رسمية", addLeave:"طلب إجازة", addVehicleOff:"إضافة يوم توقف",
    holidayName:"اسم الإجازة", fromDate:"من تاريخ", toDate:"إلى تاريخ",
    leaveType:"نوع الإجازة", annualLeave:"إجازة سنوية", sickLeave:"إجازة مرضية", emergencyLeave:"إجازة طارئة",
    selectDriver:"اختر السائق", selectVehicle:"اختر المركبة", reason:"السبب",
    myLeaveReq:"طلبات إجازاتي", pendingApproval:"بانتظار الموافقة",
    approvedLeaves:"الإجازات الموافق عليها", rejectedLeaves:"الإجازات المرفوضة",
    approveLeave:"موافقة", rejectLeave:"رفض",
    managerApprove:"وافق المدير — بانتظار المسؤول",
    leaveApproved:"تمت الموافقة على الإجازة!", leaveRejected:"تم رفض الإجازة.",
    submitLeaveReq:"إرسال طلب الإجازة",
    addVehicle:"إضافة مركبة", addDriver:"إضافة سائق", addDC:"إضافة مركز",
    addStorage:"إضافة حالة تخزين", addCity:"إضافة مدينة",
    addDept:"إضافة قسم", deptName:"اسم القسم",
    plate:"رقم اللوحة", type:"النوع", homeDC:"مركز التوزيع",
    brand:"الماركة", model:"الموديل", chassis:"رقم الهيكل", year:"السنة",
    fuelCap:"سعة الخزان (L)", mileage:"كفاءة الوقود (km/L)",
    fahas:"انتهاء الفحص", istimara:"انتهاء الاستمارة", insurance:"انتهاء التأمين",
    nextOilKM:"كم تغيير الزيت", nextOilDate:"تاريخ تغيير الزيت",
    photos:"صور المركبة", uploadPhoto:"رفع صورة",
    aiCheck:"التحقق من اللوحة", aiChecking:"جاري التحقق...",
    aiMatch:"تم التحقق!", aiMismatch:"اللوحة غير مطابقة",
    aiNoPlate:"التقط صورة أولاً", addBtn:"إضافة", edit:"تعديل",
    delete:"حذف", save:"حفظ", cancel:"إلغاء",
    dcName:"اسم المركز", dcCity:"المدينة", dcManager:"المدير",
    dcLat:"خط العرض (GPS)", dcLng:"خط الطول (GPS)",
    dcAddrEn:"العنوان (إنجليزي)", dcAddrAr:"العنوان (عربي)",
    storageName:"اسم الحالة", storageRange:"نطاق الحرارة",
    storageColor:"اللون", cityName:"اسم المدينة",
    registered:"مسجلة", active:"نشط", maintenance:"صيانة",
    viewMap:"عرض على الخريطة",
    driverName:"اسم السائق", mobile:"الجوال", licNo:"رقم الرخصة",
    licExp:"انتهاء الرخصة", driverCard:"بطاقة السائق", driverCardExp:"انتهاء البطاقة",
    status:"الحالة", onLeave:"إجازة", inactive:"غير نشط",
    requestVehicle:"طلب مركبة جديدة", requestDriver:"طلب سائق جديد",
    reqPending:"الطلبات المعلقة", reqApprove:"موافقة", reqReject:"رفض",
    reqReason:"السبب", reqSubmitted:"تم إرسال الطلب للمسؤول!",
    reqApproved:"تمت الموافقة!", reqRejected:"تم الرفض.",
    vehReqTab:"طلبات المركبات", drvReqTab:"طلبات السائقين"
  }
};

const ROLE_LABELS = { admin:"System Administrator",planning:"Planning",manager:"Distribution Center Manager",driver:"Delivery Driver",viewonly:"View Only" };
const EMPTY_VEH = { plate:"",type:"Dyna",dc:"Riyadh",brand:"",model:"",chassis:"",year:"",fahas:"",istimara:"",insurance:"",fuelCapacity:80,mileage:12,nextOilKM:"",nextOilDate:"" };
const EMPTY_DRV = { name:"",mobile:"",dc:"Riyadh",licNo:"",licExp:"",driverCard:"",driverCardExp:"",status:"Active" };

export default function MasterData({ vehicles, setVehicles, users, setUsers, lang, user }) {
  const [tab, setTab] = useState("vehicles");
  const [done, setDone] = useState("");
  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const isAdmin = user.role==="admin";
  const isManager = user.role==="manager";

  const [dcList, setDcList] = useState([
    { dc:"Riyadh",city:"Riyadh",manager:"AlWaleed Qahtani",lat:"24.7136",lng:"46.6753",addrEn:"King Fahd Road, Al Olaya, Riyadh 12211",addrAr:"طريق الملك فهد، العليا، الرياض 12211" },
    { dc:"Jeddah",city:"Jeddah",manager:"Muhammad Anas",lat:"21.4858",lng:"39.1925",addrEn:"Prince Sultan Road, Al Hamra, Jeddah 23435",addrAr:"طريق الأمير سلطان، الحمراء، جدة 23435" },
    { dc:"Dammam",city:"Dammam",manager:"Muhammad Saleh",lat:"26.4207",lng:"50.0888",addrEn:"King Saud Road, Al Faisaliyah, Dammam 32232",addrAr:"طريق الملك سعود، الفيصلية، الدمام 32232" },
  ]);
  const [storageList, setStorageList] = useState(STORAGE_CONDITIONS.map(s=>({...s})));
  const [cityList, setCityList] = useState([...CITIES]);

  // Issue #4 — Departments: Firestore se load
  const [deptList, setDeptList] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);


  // Holidays + Leaves
  const [holidays, setHolidays] = useState([]);
  const [driverLeaves, setDriverLeaves] = useState([]);
  const [vehicleOffDays, setVehicleOffDays] = useState([]);

  useEffect(() => {
    loadDepartments();
    loadVehicleReqs();
    loadDriverReqs();
    loadHolidays();
    loadDriverLeaves();
    loadVehicleOffDays();
  }, []);

  // Issue #4 — Departments Firestore load
  async function loadDepartments() {
    setDeptLoading(true);
    try {
      const snap = await getDocs(collection(db, "departments"));
      setDeptList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) { console.error("Dept load error:", e); }
    setDeptLoading(false);
  }

  async function loadHolidays() {
    try {
      const snap = await getDocs(collection(db, "publicHolidays"));
      setHolidays(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) { console.error("Holidays load error:", e); }
  }

  async function loadDriverLeaves() {
    try {
      const snap = await getDocs(collection(db, "driverLeaves"));
      setDriverLeaves(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) { console.error("DriverLeaves load error:", e); }
  }

  async function loadVehicleOffDays() {
    try {
      const snap = await getDocs(collection(db, "vehicleOffDays"));
      setVehicleOffDays(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) { console.error("VehicleOff load error:", e); }
  }

  const tabs = [
    ["vehicles","🚗",t.vehicles],
    ["drivers","👤",t.drivers],
    ["dcs","📍",t.dcLocs],
    ["storage","🌡️",t.storage],
    ["cities","🌆",t.cities],
    ["departments","🏢",t.departments],
    ["holidays","🏖️",t.holidays],
    ...(isAdmin||isManager||user.role==="driver"?[["driverleaves","👤",t.driverLeaves]]:[]),
    ...(isAdmin||isManager?[["vehicleoff","🚗",t.vehicleOff]]:[]),
    ...(isAdmin?[["allusers","👥",t.allUsers]]:[]),
  ];

  function flash(msg) { setDone(msg); setTimeout(()=>setDone(""),3000); }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      {tab==="vehicles"&&<VehiclesTab vehicles={vehicles} setVehicles={setVehicles} setDone={flash} t={t} isAdmin={isAdmin} userDC={user.dc} />}
      {tab==="drivers"&&<DriversTab users={users} setUsers={setUsers} setDone={flash} t={t} isAdmin={isAdmin} userDC={user.dc} />}
      {tab==="dcs"&&<DCsTab dcList={dcList} setDcList={setDcList} setDone={flash} t={t} isAdmin={isAdmin} />}
      {tab==="storage"&&<StorageTab storageList={storageList} setStorageList={setStorageList} setDone={flash} t={t} isAdmin={isAdmin} />}
      {tab==="cities"&&<CitiesTab cityList={cityList} setCityList={setCityList} setDone={flash} t={t} isAdmin={isAdmin} />}
      {tab==="departments"&&<DepartmentsTab deptList={deptList} setDeptList={setDeptList} setDone={flash} t={t} isAdmin={isAdmin} loading={deptLoading} reload={loadDepartments} />}
      {tab==="holidays"&&<HolidaysTab holidays={holidays} setHolidays={setHolidays} setDone={flash} t={t} isAdmin={isAdmin} reload={loadHolidays} />}
      {tab==="driverleaves"&&<DriverLeavesTab leaves={driverLeaves} setLeaves={setDriverLeaves} users={users} setDone={flash} t={t} isAdmin={isAdmin} isManager={isManager} user={user} reload={loadDriverLeaves} />}
      {tab==="vehicleoff"&&<VehicleOffTab offDays={vehicleOffDays} setOffDays={setVehicleOffDays} vehicles={vehicles} setDone={flash} t={t} isAdmin={isAdmin} isManager={isManager} user={user} reload={loadVehicleOffDays} />}
      {tab==="allusers"&&isAdmin&&<AllUsersTab users={users} setUsers={setUsers} setDone={flash} t={t} />}
    </div>
  );
}

function VehiclesTab({ vehicles, setVehicles, setDone, t, isAdmin, userDC }) {
  const myVehicles = userDC ? vehicles.filter(v=>v.dc===userDC) : vehicles;
  const allDCs = [...new Set(vehicles.map(v=>v.dc))];

  function toggleStatus(plate) {
    setVehicles(prev=>prev.map(v=>v.plate===plate?{...v,status:v.status==="Active"?"Maintenance":"Active"}:v));
  }
  function toggleDC(plate, dc) {
    setVehicles(prev=>prev.map(v=>v.plate===plate?{...v,dc}:v));
    setDone(plate+" transferred to "+dc);
  }

  return (
    <div>
      <div style={{ fontSize:14, color:"#64748b", marginBottom:12 }}>
        {myVehicles.length} {t.registered}
        <span style={{ marginLeft:12, color:"#94a3b8", fontSize:13 }}>
          (To add a vehicle, use Fleet Management)
        </span>
      </div>
      {myVehicles.length===0&&(
        <Card><div style={{ textAlign:"center", padding:32, color:"#94a3b8", fontSize:15 }}>🚗 No vehicles found</div></Card>
      )}
      {allDCs.filter(dc=>!userDC||dc===userDC).map(dc=>{
        const dv = vehicles.filter(v=>v.dc===dc);
        if (!dv.length) return null;
        return (
          <Card key={dc}>
            <CardTitle>📍 {dc} Distribution Center — {dv.length} {t.vehicles}</CardTitle>
            {dv.map(v=>(
              <div key={v.plate} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"12px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{v.plate} <span style={{ fontSize:13, color:"#64748b" }}>({v.type}) {v.brand} {v.model}</span></div>
                  <div style={{ fontSize:12, color:"#94a3b8" }}>{t.fahas}: {v.fahas||"-"} | {t.insurance}: {v.insurance||"-"}</div>
                </div>
                <span style={{ fontSize:13, fontWeight:600, padding:"3px 10px", borderRadius:99, background:v.status==="Maintenance"?"#fef3c7":"#d1fae5", color:v.status==="Maintenance"?"#92400e":"#065f46" }}>{v.status}</span>
                {isAdmin&&(
                  <select value={v.dc} onChange={e=>toggleDC(v.plate,e.target.value)}
                    style={{ border:"1px solid #e2e8f0", borderRadius:6, padding:"5px 8px", fontSize:13, cursor:"pointer" }}>
                    {DCS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                )}
                {isAdmin&&<Btn small onClick={()=>toggleStatus(v.plate)} color={v.status==="Active"?"#f59e0b":"#10b981"}>{v.status==="Active"?"🔧":"✅"}</Btn>}
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}

function DriversTab({ users, setUsers, setDone, t, isAdmin, userDC }) {
  const allDCsForDrivers = [...new Set(users.filter(u=>u.role==="driver").map(u=>u.dc))];

  return (
    <div>
      <div style={{ fontSize:14, color:"#64748b", marginBottom:12 }}>
        {users.filter(u=>u.role==="driver"&&(!userDC||u.dc===userDC)).length} drivers
        <span style={{ marginLeft:12, color:"#94a3b8", fontSize:13 }}>
          (To add a driver, use User Management → Access Requests)
        </span>
      </div>
      {allDCsForDrivers.filter(dc=>!userDC||dc===userDC).map(dc=>{
        const dv = users.filter(u=>u.role==="driver"&&u.dc===dc);
        if (!dv.length) return null;
        return (
          <Card key={dc}>
            <CardTitle>📍 {dc} Distribution Center — {dv.length} Drivers</CardTitle>
            {dv.map(d=>(
              <div key={d.uid} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:"#b45309", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:14, flexShrink:0 }}>{(d.name||"?").charAt(0)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{d.name}</div>
                  <div style={{ fontSize:13, color:"#64748b" }}>{d.phone||d.mobile}</div>
                  {d.licNo&&<div style={{ fontSize:12, color:"#6366f1" }}>📄 Lic: {d.licNo} | Exp: {d.licExp}</div>}
                </div>
                <span style={{ fontSize:13, fontWeight:600, padding:"3px 10px", borderRadius:99,
                  background:d.status==="active"||d.status==="Active"?"#d1fae5":d.status==="On Leave"?"#fef3c7":"#fee2e2",
                  color:d.status==="active"||d.status==="Active"?"#065f46":d.status==="On Leave"?"#92400e":"#991b1b"
                }}>{d.status||"Active"}</span>
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}


function DCsTab({ dcList, setDcList, setDone, t, isAdmin }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [f, setF] = useState({ dc:"",city:"",manager:"",lat:"",lng:"",addrEn:"",addrAr:"" });

  function save() {
    if (!f.dc||!f.city) return;
    if (editIdx!==null) { setDcList(prev=>prev.map((d,i)=>i===editIdx?{...f}:d)); setDone(f.dc+" updated!"); }
    else { setDcList(prev=>[...prev,{...f}]); setDone(f.dc+" added!"); }
    setShowAdd(false); setEditIdx(null); setF({ dc:"",city:"",manager:"",lat:"",lng:"",addrEn:"",addrAr:"" });
  }

  function startEdit(dc,idx) { setEditIdx(idx); setF({...dc}); setShowAdd(true); }
  function deleteDC(idx) { if (window.confirm("Delete this DC?")) { setDcList(prev=>prev.filter((_,i)=>i!==idx)); setDone("DC deleted."); } }

  return (
    <Card>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <CardTitle style={{ margin:0 }}>📍 {t.dcLocs}</CardTitle>
        {isAdmin&&<Btn small onClick={()=>{setShowAdd(!showAdd);setEditIdx(null);setF({ dc:"",city:"",manager:"",lat:"",lng:"",addrEn:"",addrAr:"" });}}>➕ {t.addDC}</Btn>}
      </div>
      {showAdd&&isAdmin&&(
        <div style={{ background:"#f8fafc",borderRadius:8,padding:14,marginBottom:16,border:"1px solid #e2e8f0" }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px" }}>
            <Input label={t.dcName+" *"} value={f.dc} onChange={v=>setF({...f,dc:v})} />
            <Input label={t.dcCity+" *"} value={f.city} onChange={v=>setF({...f,city:v})} />
            <Input label={t.dcManager} value={f.manager} onChange={v=>setF({...f,manager:v})} />
            <div />
            <Input label={t.dcLat} value={f.lat} onChange={v=>setF({...f,lat:v})} placeholder="24.7136" />
            <Input label={t.dcLng} value={f.lng} onChange={v=>setF({...f,lng:v})} placeholder="46.6753" />
            <div style={{ gridColumn:"1/-1" }}><Input label={t.dcAddrEn} value={f.addrEn} onChange={v=>setF({...f,addrEn:v})} /></div>
            <div style={{ gridColumn:"1/-1" }}><Input label={t.dcAddrAr} value={f.addrAr} onChange={v=>setF({...f,addrAr:v})} /></div>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <Btn onClick={save} color="#10b981" style={{ flex:1 }}>✅ {editIdx!==null?t.save:t.addBtn}</Btn>
            <Btn onClick={()=>{setShowAdd(false);setEditIdx(null);}} color="#64748b">{t.cancel}</Btn>
          </div>
        </div>
      )}
      {dcList.map((d,idx)=>(
        <div key={d.dc} style={{ border:"1px solid #e2e8f0",borderRadius:8,padding:14,marginBottom:8 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
            <div style={{ fontWeight:700,fontSize:15 }}>📍 Distribution Center - {d.dc}</div>
            {isAdmin&&(
              <div style={{ display:"flex",gap:6 }}>
                <Btn small onClick={()=>startEdit(d,idx)} color="#6366f1">✎ {t.edit}</Btn>
                <Btn small onClick={()=>deleteDC(idx)} color="#ef4444">🗑</Btn>
              </div>
            )}
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:6,fontSize:14,color:"#374151",marginBottom:8 }}>
            <div><b>{t.dcCity}:</b> {d.city}</div>
            <div><b>{t.dcManager}:</b> {d.manager}</div>
            {d.lat&&<div><b>GPS:</b> {d.lat}, {d.lng}</div>}
          </div>
          {d.addrEn&&<div style={{ background:"#f8fafc",borderRadius:6,padding:"6px 10px",marginBottom:4,fontSize:14 }}>🇬🇧 {d.addrEn}</div>}
          {d.addrAr&&<div style={{ background:"#f0f9ff",borderRadius:6,padding:"6px 10px",marginBottom:8,direction:"rtl",fontSize:14,color:"#0369a1" }}>🇸🇦 {d.addrAr}</div>}
          {d.lat&&d.lng&&<a href={"https://maps.google.com/?q="+d.lat+","+d.lng} target="_blank" rel="noreferrer" style={{ fontSize:13,color:"#6366f1",fontWeight:600 }}>📍 {t.viewMap} →</a>}
        </div>
      ))}
    </Card>
  );
}

function StorageTab({ storageList, setStorageList, setDone, t, isAdmin }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [f, setF] = useState({ name:"",range:"",color:"#10b981" });

  function save() {
    if (!f.name||!f.range) return;
    if (editIdx!==null) { setStorageList(prev=>prev.map((s,i)=>i===editIdx?{...f}:s)); setDone(f.name+" updated!"); }
    else { setStorageList(prev=>[...prev,{...f}]); setDone(f.name+" added!"); }
    setShowAdd(false); setEditIdx(null); setF({ name:"",range:"",color:"#10b981" });
  }

  return (
    <Card>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <CardTitle style={{ margin:0 }}>🌡️ {t.storage}</CardTitle>
        {isAdmin&&<Btn small onClick={()=>{setShowAdd(!showAdd);setEditIdx(null);setF({ name:"",range:"",color:"#10b981" });}}>➕ {t.addStorage}</Btn>}
      </div>
      {showAdd&&isAdmin&&(
        <div style={{ background:"#f8fafc",borderRadius:8,padding:14,marginBottom:12,border:"1px solid #e2e8f0" }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px" }}>
            <Input label={t.storageName+" *"} value={f.name} onChange={v=>setF({...f,name:v})} placeholder="e.g. Ambient" />
            <Input label={t.storageRange+" *"} value={f.range} onChange={v=>setF({...f,range:v})} placeholder="e.g. 15-25C" />
            <div style={{ marginBottom:12 }}>
              <label style={{ display:"block",fontSize:14,fontWeight:600,color:"#374151",marginBottom:5 }}>{t.storageColor}</label>
              <input type="color" value={f.color} onChange={e=>setF({...f,color:e.target.value})} style={{ width:"100%",height:40,border:"1.5px solid #e2e8f0",borderRadius:8,cursor:"pointer",padding:4 }} />
            </div>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <Btn onClick={save} color="#10b981" style={{ flex:1 }}>✅ {editIdx!==null?t.save:t.addBtn}</Btn>
            <Btn onClick={()=>{setShowAdd(false);setEditIdx(null);}} color="#64748b">{t.cancel}</Btn>
          </div>
        </div>
      )}
      {storageList.map((s,idx)=>(
        <div key={idx} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #f1f5f9" }}>
          <div style={{ width:14,height:14,borderRadius:"50%",background:s.color,flexShrink:0 }} />
          <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:14 }}>{s.name} <span style={{ fontSize:14,color:"#64748b",fontWeight:400 }}>({s.range})</span></div></div>
          {isAdmin&&(
            <div style={{ display:"flex",gap:4 }}>
              <Btn small onClick={()=>{setEditIdx(idx);setF({...s});setShowAdd(true);}} color="#6366f1">✎</Btn>
              <Btn small onClick={()=>{if(window.confirm("Delete?"))setStorageList(prev=>prev.filter((_,i)=>i!==idx));}} color="#ef4444">🗑</Btn>
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}

function CitiesTab({ cityList, setCityList, setDone, t, isAdmin }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newCity, setNewCity] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");

  return (
    <Card>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <CardTitle style={{ margin:0 }}>🌆 {t.cities}</CardTitle>
        {isAdmin&&<Btn small onClick={()=>setShowAdd(!showAdd)}>➕ {t.addCity}</Btn>}
      </div>
      {showAdd&&isAdmin&&(
        <div style={{ display:"flex",gap:8,marginBottom:12 }}>
          <input value={newCity} onChange={e=>setNewCity(e.target.value)} placeholder={t.cityName}
            style={{ flex:1,border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:14,outline:"none" }} />
          <Btn onClick={()=>{if(!newCity.trim())return;setCityList(prev=>[...prev,newCity.trim()]);setDone(newCity+" added!");setNewCity("");setShowAdd(false);}} color="#10b981">✅</Btn>
          <Btn onClick={()=>setShowAdd(false)} color="#64748b">{t.cancel}</Btn>
        </div>
      )}
      <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
        {cityList.map((c,idx)=>(
          <div key={idx} style={{ display:"flex",alignItems:"center",gap:4,background:"#f1f5f9",borderRadius:8,padding:"6px 12px" }}>
            {editIdx===idx?(
              <>
                <input value={editVal} onChange={e=>setEditVal(e.target.value)} style={{ border:"1px solid #6366f1",borderRadius:6,padding:"3px 8px",fontSize:14,outline:"none",width:100 }} />
                <button onClick={()=>{setCityList(prev=>prev.map((x,i)=>i===idx?editVal:x));setDone(editVal+" updated!");setEditIdx(null);}} style={{ background:"#10b981",border:"none",color:"white",borderRadius:4,padding:"2px 6px",cursor:"pointer",fontSize:12 }}>✓</button>
                <button onClick={()=>setEditIdx(null)} style={{ background:"#64748b",border:"none",color:"white",borderRadius:4,padding:"2px 6px",cursor:"pointer",fontSize:12 }}>✕</button>
              </>
            ):(
              <>
                <span style={{ fontSize:14,fontWeight:600,color:"#374151" }}>📍 {c}</span>
                {isAdmin&&<>
                  <button onClick={()=>{setEditIdx(idx);setEditVal(c);}} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#6366f1",padding:"0 2px" }}>✎</button>
                  <button onClick={()=>{if(window.confirm("Delete "+c+"?"))setCityList(prev=>prev.filter((_,i)=>i!==idx));}} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#ef4444",padding:"0 2px" }}>✕</button>
                </>}
              </>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// Issue #4 — Departments Tab — Firestore CRUD
function DepartmentsTab({ deptList, setDeptList, setDone, t, isAdmin, loading, reload }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [saving, setSaving] = useState(false);

  async function addDept() {
    if (!newDeptName.trim()) return;
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, "departments"), {
        name: newDeptName.trim(),
        createdAt: new Date().toISOString()
      });
      setDeptList(prev=>[...prev, { id:docRef.id, name:newDeptName.trim() }]);
      setDone(newDeptName+" added!");
      setNewDeptName("");
      setShowAdd(false);
    } catch(e) { setDone("❌ Error: "+e.message); }
    setSaving(false);
  }

  async function saveDeptEdit(id) {
    if (!editVal.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "departments", id), { name: editVal.trim() });
      setDeptList(prev=>prev.map(d=>d.id===id?{...d,name:editVal.trim()}:d));
      setDone(editVal+" updated!");
      setEditId(null);
      setEditVal("");
    } catch(e) { setDone("❌ Error: "+e.message); }
    setSaving(false);
  }

  async function deleteDept(id, name) {
    if (!window.confirm("Delete '"+name+"'?")) return;
    try {
      await deleteDoc(doc(db, "departments", id));
      setDeptList(prev=>prev.filter(d=>d.id!==id));
      setDone(name+" deleted!");
    } catch(e) { setDone("❌ Error: "+e.message); }
  }

  return (
    <Card>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <CardTitle style={{ margin:0 }}>🏢 {t.departments}</CardTitle>
        {isAdmin&&<Btn small onClick={()=>setShowAdd(!showAdd)} color="#6366f1">➕ {t.addDept}</Btn>}
      </div>

      {loading&&<div style={{ textAlign:"center", padding:16, color:"#94a3b8" }}>⏳ Loading...</div>}

      {showAdd&&isAdmin&&(
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <input
            value={newDeptName}
            onChange={e=>setNewDeptName(e.target.value)}
            placeholder={t.deptName}
            style={{ flex:1, border:"1.5px solid #6366f1", borderRadius:8, padding:"9px 14px", fontSize:14, outline:"none" }}
            onKeyDown={e=>e.key==="Enter"&&addDept()}
          />
          <Btn onClick={addDept} color="#10b981" disabled={saving}>✅</Btn>
          <Btn onClick={()=>{setShowAdd(false);setNewDeptName("");}} color="#64748b">✕</Btn>
        </div>
      )}

      {deptList.length===0&&!loading&&(
        <div style={{ textAlign:"center", padding:24, color:"#94a3b8", fontSize:15 }}>
          No departments yet. {isAdmin?"Click '+ Add Department' to add one.":""}
        </div>
      )}

      {deptList.map(dept=>(
        <div key={dept.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 0", borderBottom:"1px solid #f1f5f9" }}>
          {editId===dept.id?(
            <>
              <input
                value={editVal}
                onChange={e=>setEditVal(e.target.value)}
                style={{ flex:1, border:"1.5px solid #6366f1", borderRadius:8, padding:"7px 12px", fontSize:14, outline:"none" }}
                onKeyDown={e=>e.key==="Enter"&&saveDeptEdit(dept.id)}
                autoFocus
              />
              <Btn small onClick={()=>saveDeptEdit(dept.id)} color="#10b981" disabled={saving}>✅</Btn>
              <Btn small onClick={()=>{setEditId(null);setEditVal("");}} color="#64748b">✕</Btn>
            </>
          ):(
            <>
              <div style={{ flex:1, fontWeight:600, fontSize:14, color:"#0f172a" }}>🏢 {dept.name}</div>
              {isAdmin&&(
                <div style={{ display:"flex", gap:4 }}>
                  <Btn small onClick={()=>{setEditId(dept.id);setEditVal(dept.name);}} color="#6366f1">✎</Btn>
                  <Btn small onClick={()=>deleteDept(dept.id, dept.name)} color="#ef4444">🗑</Btn>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </Card>
  );
}

function AllUsersTab({ users, setUsers, setDone, t }) {
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});

  function startEdit(u) { setEditId(u.uid); setForm({ name:u.name,displayName:u.displayName||"",dept:u.dept||"",role:u.role,location:u.location||"",status:u.status||"Active" }); }
  function save() { setUsers(prev=>prev.map(u=>u.uid===editId?{...u,...form}:u)); setDone(form.name+" updated!"); setEditId(null); setForm({}); }

  return (
    <Card>
      <CardTitle>👥 {t.allUsers}</CardTitle>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:14 }}>
          <thead>
            <tr style={{ background:"#f8fafc" }}>
              {["Name","Display","Dept","Role","Location","Status",""].map(h=>(
                <th key={h} style={{ padding:"10px 12px",textAlign:"left",fontWeight:700,color:"#374151",borderBottom:"2px solid #e2e8f0",whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u,i)=>(
              <tr key={u.uid} style={{ background:i%2===0?"white":"#f8fafc" }}>
                {editId===u.uid?(
                  <>
                    <td style={{ padding:"8px 12px" }}><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{ border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:14,width:100 }} /></td>
                    <td style={{ padding:"8px 12px" }}><input value={form.displayName} onChange={e=>setForm({...form,displayName:e.target.value})} style={{ border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:14,width:90 }} /></td>
                    <td style={{ padding:"8px 12px" }}><input value={form.dept} onChange={e=>setForm({...form,dept:e.target.value})} style={{ border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:14,width:80 }} /></td>
                    <td style={{ padding:"8px 12px" }}>
                      <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={{ border:"1px solid #e2e8f0",borderRadius:6,padding:"4px",fontSize:13 }}>
                        {Object.entries(ROLE_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td style={{ padding:"8px 12px" }}><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} style={{ border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:14,width:110 }} /></td>
                    <td style={{ padding:"8px 12px" }}>
                      <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={{ border:"1px solid #e2e8f0",borderRadius:6,padding:"4px",fontSize:13 }}>
                        {["Active","Inactive"].map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding:"8px 12px" }}>
                      <div style={{ display:"flex",gap:4 }}>
                        <Btn small onClick={save} color="#10b981">✅</Btn>
                        <Btn small onClick={()=>{setEditId(null);setForm({});}} color="#64748b">✕</Btn>
                      </div>
                    </td>
                  </>
                ):(
                  <>
                    <td style={{ padding:"10px 12px",fontWeight:600 }}>{u.name}</td>
                    <td style={{ padding:"10px 12px",color:"#64748b" }}>{u.displayName||"-"}</td>
                    <td style={{ padding:"10px 12px",color:"#64748b" }}>{u.dept||"-"}</td>
                    <td style={{ padding:"10px 12px" }}><span style={{ fontSize:13,fontWeight:600,padding:"2px 8px",borderRadius:99,background:"#f1f5f9",color:"#374151" }}>{ROLE_LABELS[u.role]||u.role}</span></td>
                    <td style={{ padding:"10px 12px",color:"#64748b",fontSize:13 }}>{u.location||"-"}</td>
                    <td style={{ padding:"10px 12px" }}><span style={{ fontSize:13,fontWeight:600,padding:"2px 8px",borderRadius:99,background:u.status==="Active"?"#d1fae5":"#fee2e2",color:u.status==="Active"?"#065f46":"#991b1b" }}>{u.status||"Active"}</span></td>
                    <td style={{ padding:"10px 12px" }}>
                      <div style={{ display:"flex",gap:4 }}>
                        <Btn small onClick={()=>startEdit(u)} color="#6366f1">✎</Btn>
                        <Btn small onClick={()=>setUsers(prev=>prev.map(u2=>u2.uid===u.uid?{...u2,status:"Inactive"}:u2))} color="#ef4444">🗑</Btn>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── PUBLIC HOLIDAYS TAB ──────────────────────────────────────
function HolidaysTab({ holidays, setHolidays, setDone, t, isAdmin, reload }) {
  const [showAdd, setShowAdd] = useState(false);
  const [f, setF] = useState({ name:"", from:"", to:"" });
  const [saving, setSaving] = useState(false);

  async function addHoliday() {
    if (!f.name||!f.from||!f.to) return;
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, "publicHolidays"), { ...f, createdAt: new Date().toISOString() });
      setHolidays(prev=>[...prev, { id:docRef.id, ...f }]);
      setDone(f.name+" added!");
      setF({ name:"", from:"", to:"" });
      setShowAdd(false);
    } catch(e) { setDone("❌ Error: "+e.message); }
    setSaving(false);
  }

  async function deleteHoliday(id, name) {
    if (!window.confirm("Delete '"+name+"'?")) return;
    try {
      await deleteDoc(doc(db, "publicHolidays", id));
      setHolidays(prev=>prev.filter(h=>h.id!==id));
      setDone(name+" deleted!");
    } catch(e) { setDone("❌ Error: "+e.message); }
  }

  // Days count between 2 dates
  function daysBetween(from, to) {
    const d = (new Date(to) - new Date(from)) / (1000*60*60*24);
    return Math.round(d) + 1;
  }

  return (
    <Card>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <CardTitle style={{ margin:0 }}>🏖️ {t.holidays}</CardTitle>
        {isAdmin&&<Btn small onClick={()=>setShowAdd(!showAdd)} color="#6366f1">➕ {t.addHoliday}</Btn>}
      </div>
      {showAdd&&isAdmin&&(
        <div style={{ background:"#f8fafc", borderRadius:8, padding:14, marginBottom:16, border:"1px solid #e2e8f0" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
            <div style={{ gridColumn:"1/-1", marginBottom:12 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{t.holidayName} *</label>
              <input value={f.name} onChange={e=>setF({...f,name:e.target.value})}
                placeholder="e.g. Eid Al Fitr 2026"
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", boxSizing:"border-box" }} />
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{t.fromDate} *</label>
              <input type="date" value={f.from} onChange={e=>setF({...f,from:e.target.value})}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", boxSizing:"border-box" }} />
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{t.toDate} *</label>
              <input type="date" value={f.to} onChange={e=>setF({...f,to:e.target.value})}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", boxSizing:"border-box" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={addHoliday} color="#10b981" style={{ flex:1 }} disabled={saving}>✅ {saving?"Saving...":"Add Holiday"}</Btn>
            <Btn onClick={()=>setShowAdd(false)} color="#64748b">Cancel</Btn>
          </div>
        </div>
      )}
      {holidays.length===0&&<div style={{ textAlign:"center", padding:24, color:"#94a3b8", fontSize:15 }}>No public holidays defined yet.</div>}
      {holidays.map(h=>(
        <div key={h.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>🏖️ {h.name}</div>
            <div style={{ fontSize:13, color:"#64748b" }}>📅 {h.from} → {h.to} <span style={{ color:"#6366f1", fontWeight:600 }}>({daysBetween(h.from,h.to)} days)</span></div>
          </div>
          {isAdmin&&<Btn small onClick={()=>deleteHoliday(h.id,h.name)} color="#ef4444">🗑️</Btn>}
        </div>
      ))}
    </Card>
  );
}


// ── DRIVER LEAVES TAB ─────────────────────────────────────────
function DriverLeavesTab({ leaves, setLeaves, users, setDone, t, isAdmin, isManager, user, reload }) {
  const [showAdd, setShowAdd] = useState(false);
  const [f, setF] = useState({ driverId:"", from:"", to:"", type:"Annual Leave", reason:"" });
  const [saving, setSaving] = useState(false);
  const isDriver = user.role === "driver";
  const drivers = users.filter(u=>u.role==="driver"&&(!user.dc||u.dc===user.dc||user.dc==="Head Office"));
  const myLeaves = isDriver ? leaves.filter(l=>l.driverId===user.uid) : isAdmin ? leaves : leaves.filter(l=>l.dc===user.dc);
  const pendingManagerLeaves = isManager ? myLeaves.filter(l=>l.status==="pending_manager") : [];
  const pendingAdminLeaves = isAdmin ? leaves.filter(l=>l.status==="pending_admin") : [];
  function daysBetween(from,to){return Math.round((new Date(to)-new Date(from))/(1000*60*60*24))+1;}
  async function submitDriverLeave(){if(!f.from||!f.to||!f.reason.trim()){setDone("❌ Fill all required fields");return;}setSaving(true);try{const data={driverId:user.uid,driverName:user.name,dc:user.dc,from:f.from,to:f.to,type:f.type,reason:f.reason,status:"pending_manager",submittedAt:new Date().toISOString(),submittedBy:user.name};const docRef=await addDoc(collection(db,"driverLeaves"),data);setLeaves(prev=>[...prev,{id:docRef.id,...data}]);await sendNotification({toRole:"manager",toDC:user.dc,type:"leave",title:"Driver Leave Request",message:`${user.name} submitted ${f.type} from ${f.from} to ${f.to}.`});setDone("Submitted!");setF({driverId:"",from:"",to:"",type:"Annual Leave",reason:""});setShowAdd(false);}catch(e){setDone("❌ "+e.message);}setSaving(false);}
  async function submitManagerLeave(){const sel=f.driverId?drivers.find(d=>d.uid===f.driverId):null;if(!f.from||!f.to){setDone("❌ Dates required");return;}setSaving(true);try{const data={driverId:sel?.uid||user.uid,driverName:sel?.name||user.name,dc:sel?.dc||user.dc,from:f.from,to:f.to,type:f.type,reason:f.reason||"",status:"pending_admin",submittedAt:new Date().toISOString(),submittedBy:user.name,managerApprovedBy:user.name,managerApprovedAt:new Date().toISOString()};const docRef=await addDoc(collection(db,"driverLeaves"),data);setLeaves(prev=>[...prev,{id:docRef.id,...data}]);await sendNotification({toRole:"admin",type:"leave",title:"Leave — Manager Approved",message:`${user.name} approved ${f.type} for ${data.driverName} (${data.dc}) ${f.from}→${f.to}.`});setDone("Submitted for Admin!");setF({driverId:"",from:"",to:"",type:"Annual Leave",reason:""});setShowAdd(false);}catch(e){setDone("❌ "+e.message);}setSaving(false);}
  async function managerApprove(l){try{await updateDoc(doc(db,"driverLeaves",l.id),{status:"pending_admin",managerApprovedBy:user.name,managerApprovedAt:new Date().toISOString()});setLeaves(prev=>prev.map(x=>x.id===l.id?{...x,status:"pending_admin",managerApprovedBy:user.name}:x));await sendNotification({toRole:"admin",type:"leave",title:"Leave — Manager Approved",message:`${user.name} approved ${l.driverName} ${l.type} (${l.from}→${l.to}).`});await sendNotification({toUserId:l.driverId,type:"request_action",title:"Leave — Manager Approved ✅",message:`Your ${l.type} approved by ${user.name}. Waiting Admin.`});setDone("Forwarded to Admin!");}catch(e){setDone("❌ "+e.message);}}
  async function managerReject(l){try{await updateDoc(doc(db,"driverLeaves",l.id),{status:"rejected",rejectedBy:user.name,rejectedAt:new Date().toISOString()});setLeaves(prev=>prev.map(x=>x.id===l.id?{...x,status:"rejected",rejectedBy:user.name}:x));await sendNotification({toUserId:l.driverId,type:"request_action",title:"Leave Rejected ❌",message:`Your ${l.type} (${l.from}→${l.to}) rejected by ${user.name}.`});setDone("Rejected.");}catch(e){setDone("❌ "+e.message);}}
  async function adminApprove(l){try{await updateDoc(doc(db,"driverLeaves",l.id),{status:"approved",approvedBy:user.name,approvedAt:new Date().toISOString()});setLeaves(prev=>prev.map(x=>x.id===l.id?{...x,status:"approved",approvedBy:user.name}:x));await sendNotification({toUserId:l.driverId,type:"request_action",title:"Leave Approved ✅",message:`Your ${l.type} (${l.from}→${l.to}) fully approved. Excluded from working days.`});setDone(t.leaveApproved);}catch(e){setDone("❌ "+e.message);}}
  async function adminReject(l){try{await updateDoc(doc(db,"driverLeaves",l.id),{status:"rejected",rejectedBy:user.name,rejectedAt:new Date().toISOString()});setLeaves(prev=>prev.map(x=>x.id===l.id?{...x,status:"rejected",rejectedBy:user.name}:x));await sendNotification({toUserId:l.driverId,type:"request_action",title:"Leave Rejected ❌",message:`Your ${l.type} (${l.from}→${l.to}) rejected by Admin.`});setDone(t.leaveRejected);}catch(e){setDone("❌ "+e.message);}}
  async function deleteLeave(id){if(!window.confirm("Delete?"))return;try{await deleteDoc(doc(db,"driverLeaves",id));setLeaves(prev=>prev.filter(l=>l.id!==id));setDone("Deleted!");}catch(e){setDone("❌ "+e.message);}}
  function statusBadge(s){const m={pending_manager:["#fef3c7","#92400e","⏳ Pending Manager"],pending_admin:["#dbeafe","#1e40af","⏳ Pending Admin"],approved:["#d1fae5","#065f46","✅ Approved"],rejected:["#fee2e2","#991b1b","❌ Rejected"]};const[bg,c,lbl]=m[s]||["#f1f5f9","#64748b",s];return<span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:bg,color:c}}>{lbl}</span>;}
  function LeaveCard({l,showMgr,showAdmin}){return(<div style={{border:"1px solid #e2e8f0",borderRadius:8,padding:14,marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:8}}><div><div style={{fontWeight:700,fontSize:14}}>👤 {l.driverName} <span style={{color:"#64748b",fontSize:13}}>— {l.dc}</span></div><div style={{fontSize:13,color:"#64748b"}}>{l.type} | 📅 {l.from} → {l.to} <span style={{color:"#6366f1",fontWeight:600}}>({daysBetween(l.from,l.to)} days)</span></div>{l.reason&&<div style={{fontSize:12,color:"#94a3b8"}}>📝 {l.reason}</div>}{l.managerApprovedBy&&<div style={{fontSize:11,color:"#10b981"}}>✅ Manager: {l.managerApprovedBy}</div>}{l.approvedBy&&<div style={{fontSize:11,color:"#10b981"}}>✅ Admin: {l.approvedBy}</div>}{l.rejectedBy&&<div style={{fontSize:11,color:"#ef4444"}}>❌ Rejected: {l.rejectedBy}</div>}</div>{statusBadge(l.status)}</div>{showMgr&&l.status==="pending_manager"&&<div style={{display:"flex",gap:8,marginTop:8}}><Btn small onClick={()=>managerApprove(l)} color="#10b981">✅ {t.approveLeave}</Btn><Btn small onClick={()=>managerReject(l)} color="#ef4444">❌ {t.rejectLeave}</Btn></div>}{showAdmin&&l.status==="pending_admin"&&<div style={{display:"flex",gap:8,marginTop:8}}><Btn small onClick={()=>adminApprove(l)} color="#10b981">✅ {t.approveLeave}</Btn><Btn small onClick={()=>adminReject(l)} color="#ef4444">❌ {t.rejectLeave}</Btn></div>}{isAdmin&&<Btn small onClick={()=>deleteLeave(l.id)} color="#ef4444" style={{marginTop:6}}>🗑️</Btn>}</div>);}
  return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontWeight:700,fontSize:15,color:"#1A3A5C"}}>👤 {t.driverLeaves}</div>{(isDriver||isManager)&&<Btn small onClick={()=>setShowAdd(!showAdd)} color="#6366f1">➕ {t.addLeave}</Btn>}</div>{showAdd&&isDriver&&(<Card style={{borderLeft:"4px solid #6366f1",marginBottom:16}}><CardTitle>📝 Submit Leave Request</CardTitle><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}><div style={{gridColumn:"1/-1",marginBottom:10}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Leave Type</label><select value={f.type} onChange={e=>setF({...f,type:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box"}}><option>Annual Leave</option><option>Sick Leave</option><option>Emergency Leave</option><option>Unpaid Leave</option></select></div><div style={{marginBottom:10}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>From *</label><input type="date" value={f.from} onChange={e=>setF({...f,from:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box"}}/></div><div style={{marginBottom:10}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>To *</label><input type="date" value={f.to} onChange={e=>setF({...f,to:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box"}}/></div><div style={{gridColumn:"1/-1",marginBottom:10}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Reason *</label><input value={f.reason} onChange={e=>setF({...f,reason:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box"}}/></div></div><div style={{display:"flex",gap:8}}><Btn onClick={submitDriverLeave} color="#10b981" style={{flex:1}} disabled={saving}>{saving?"Submitting...":"📤 Submit Request"}</Btn><Btn onClick={()=>setShowAdd(false)} color="#64748b">Cancel</Btn></div></Card>)}{showAdd&&isManager&&!isAdmin&&(<Card style={{borderLeft:"4px solid #6366f1",marginBottom:16}}><CardTitle>📝 Add Leave</CardTitle><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}><div style={{gridColumn:"1/-1",marginBottom:10}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Driver (blank = own leave)</label><select value={f.driverId||""} onChange={e=>setF({...f,driverId:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box"}}><option value="">My Own Leave</option>{drivers.map(d=><option key={d.uid} value={d.uid}>{d.name} — {d.dc}</option>)}</select></div><div style={{gridColumn:"1/-1",marginBottom:10}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Leave Type</label><select value={f.type} onChange={e=>setF({...f,type:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box"}}><option>Annual Leave</option><option>Sick Leave</option><option>Emergency Leave</option><option>Unpaid Leave</option></select></div><div style={{marginBottom:10}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>From *</label><input type="date" value={f.from} onChange={e=>setF({...f,from:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box"}}/></div><div style={{marginBottom:10}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>To *</label><input type="date" value={f.to} onChange={e=>setF({...f,to:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box"}}/></div><div style={{gridColumn:"1/-1",marginBottom:10}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Reason</label><input value={f.reason} onChange={e=>setF({...f,reason:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box"}}/></div></div><div style={{display:"flex",gap:8}}><Btn onClick={submitManagerLeave} color="#10b981" style={{flex:1}} disabled={saving}>{saving?"Submitting...":"📤 Submit for Admin Approval"}</Btn><Btn onClick={()=>setShowAdd(false)} color="#64748b">Cancel</Btn></div></Card>)}{isManager&&!isAdmin&&pendingManagerLeaves.length>0&&(<Card style={{borderLeft:"4px solid #f59e0b",marginBottom:12}}><CardTitle>⏳ Pending Driver Requests ({pendingManagerLeaves.length})</CardTitle>{pendingManagerLeaves.map(l=><LeaveCard key={l.id} l={l} showMgr={true} showAdmin={false}/>)}</Card>)}{isAdmin&&pendingAdminLeaves.length>0&&(<Card style={{borderLeft:"4px solid #6366f1",marginBottom:12}}><CardTitle>⏳ Pending Admin Approval ({pendingAdminLeaves.length})</CardTitle>{pendingAdminLeaves.map(l=><LeaveCard key={l.id} l={l} showMgr={false} showAdmin={true}/>)}</Card>)}<Card><CardTitle>📋 All Leave Records ({myLeaves.length})</CardTitle>{myLeaves.length===0&&<div style={{textAlign:"center",padding:24,color:"#94a3b8",fontSize:15}}>No leave records yet.</div>}{myLeaves.map(l=><LeaveCard key={l.id} l={l} showMgr={false} showAdmin={false}/>)}</Card></div>);
}



function VehicleOffTab({ offDays, setOffDays, vehicles, setDone, t, isAdmin, isManager, user, reload }) {
  const [showAdd, setShowAdd] = useState(false);
  const [f, setF] = useState({ vehiclePlate:"", from:"", to:"", reason:"Scheduled Maintenance" });
  const [saving, setSaving] = useState(false);

  const myVehicles = vehicles.filter(v=>!user.dc||v.dc===user.dc||user.dc==="Head Office");
  const myOffDays = isAdmin ? offDays : offDays.filter(o=>o.dc===user.dc);

  async function addOffDay() {
    if (!f.vehiclePlate||!f.from||!f.to) { setDone("❌ Please fill all required fields"); return; }
    setSaving(true);
    try {
      const vehicle = myVehicles.find(v=>v.plate===f.vehiclePlate);
      const data = { ...f, dc:vehicle?.dc||user.dc, addedBy:user.name, createdAt:new Date().toISOString() };
      const docRef = await addDoc(collection(db, "vehicleOffDays"), data);
      setOffDays(prev=>[...prev, { id:docRef.id, ...data }]);
      setDone(f.vehiclePlate+" off day added!");
      setF({ vehiclePlate:"", from:"", to:"", reason:"Scheduled Maintenance" });
      setShowAdd(false);
    } catch(e) { setDone("❌ Error: "+e.message); }
    setSaving(false);
  }

  async function deleteOffDay(id) {
    if (!window.confirm("Delete this off day record?")) return;
    try {
      await deleteDoc(doc(db, "vehicleOffDays", id));
      setOffDays(prev=>prev.filter(o=>o.id!==id));
      setDone("Off day deleted!");
    } catch(e) { setDone("❌ Error: "+e.message); }
  }

  function daysBetween(from, to) { return Math.round((new Date(to)-new Date(from))/(1000*60*60*24))+1; }

  return (
    <Card>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <CardTitle style={{ margin:0 }}>🚗 {t.vehicleOff}</CardTitle>
        <Btn small onClick={()=>setShowAdd(!showAdd)} color="#6366f1">➕ {t.addVehicleOff}</Btn>
      </div>
      {showAdd&&(
        <div style={{ background:"#f8fafc", borderRadius:8, padding:14, marginBottom:16, border:"1px solid #e2e8f0" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
            <div style={{ gridColumn:"1/-1", marginBottom:12 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Vehicle *</label>
              <select value={f.vehiclePlate} onChange={e=>setF({...f,vehiclePlate:e.target.value})}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", background:"white", boxSizing:"border-box" }}>
                <option value="">Select Vehicle...</option>
                {myVehicles.map(v=><option key={v.plate} value={v.plate}>{v.plate} — {v.dc}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Reason</label>
              <select value={f.reason} onChange={e=>setF({...f,reason:e.target.value})}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", background:"white", boxSizing:"border-box" }}>
                <option>Scheduled Maintenance</option>
                <option>Breakdown</option>
                <option>Inspection</option>
                <option>Off Season</option>
                <option>Other</option>
              </select>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{t.fromDate} *</label>
              <input type="date" value={f.from} onChange={e=>setF({...f,from:e.target.value})}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", boxSizing:"border-box" }} />
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{t.toDate} *</label>
              <input type="date" value={f.to} onChange={e=>setF({...f,to:e.target.value})}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", boxSizing:"border-box" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={addOffDay} color="#10b981" style={{ flex:1 }} disabled={saving}>✅ {saving?"Saving...":"Add Off Day"}</Btn>
            <Btn onClick={()=>setShowAdd(false)} color="#64748b">Cancel</Btn>
          </div>
        </div>
      )}
      {myOffDays.length===0&&<div style={{ textAlign:"center", padding:24, color:"#94a3b8", fontSize:15 }}>No vehicle off days recorded yet.</div>}
      {myOffDays.map(o=>(
        <div key={o.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>🚗 {o.vehiclePlate}</div>
            <div style={{ fontSize:13, color:"#64748b" }}>
              {o.reason} | 📅 {o.from} → {o.to}
              <span style={{ color:"#6366f1", fontWeight:600, marginLeft:6 }}>({daysBetween(o.from,o.to)} days)</span>
            </div>
            <div style={{ fontSize:11, color:"#94a3b8" }}>By: {o.addedBy} | {o.dc}</div>
          </div>
          <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99, background:"#fee2e2", color:"#991b1b" }}>{o.reason}</span>
          <Btn small onClick={()=>deleteOffDay(o.id)} color="#ef4444">🗑️</Btn>
        </div>
      ))}
    </Card>
  );
}
