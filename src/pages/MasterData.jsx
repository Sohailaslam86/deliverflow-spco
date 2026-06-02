import { useState, useRef, useEffect } from "react";
import { Card, CardTitle, Btn, Input, Select, Textarea, SuccessMsg, TabBar } from "../components/Shared.jsx";
import { STORAGE_CONDITIONS, CITIES, DCS } from "../data/masterData.js";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

const T = {
  en: {
    vehicles:"Vehicles", drivers:"Drivers", dcLocs:"Distribution Center Locations",
    storage:"Storage Conditions", cities:"Cities", allUsers:"User Directory",
    departments:"Departments",
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

  // Issue #5 — Vehicle/Driver Requests: Firestore se load
  const [vehicleReqs, setVehicleReqs] = useState([]);
  const [driverReqs, setDriverReqs] = useState([]);

  useEffect(() => {
    loadDepartments();
    loadVehicleReqs();
    loadDriverReqs();
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

  // Issue #5 — Vehicle Requests Firestore load
  async function loadVehicleReqs() {
    try {
      const snap = await getDocs(collection(db, "vehicleRequests"));
      setVehicleReqs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) { console.error("VehReq load error:", e); }
  }

  // Issue #5 — Driver Requests Firestore load
  async function loadDriverReqs() {
    try {
      const snap = await getDocs(collection(db, "driverRequests"));
      setDriverReqs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) { console.error("DrvReq load error:", e); }
  }

  const tabs = [
    ["vehicles","🚗",t.vehicles],
    ["drivers","👤",t.drivers],
    ["dcs","📍",t.dcLocs],
    ["storage","🌡️",t.storage],
    ["cities","🌆",t.cities],
    ["departments","🏢",t.departments],
    ...(isAdmin?[["allusers","👥",t.allUsers],["vehreqs","📋",t.vehReqTab],["drvreqs","📋",t.drvReqTab]]:[]),
    ...(isManager?[["vehreqs","📋",t.vehReqTab],["drvreqs","📋",t.drvReqTab]]:[]),
  ];

  function flash(msg) { setDone(msg); setTimeout(()=>setDone(""),3000); }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      {tab==="vehicles"&&<VehiclesTab vehicles={vehicles} setVehicles={setVehicles} setDone={flash} t={t} isAdmin={isAdmin} isManager={isManager} userDC={user.dc} user={user} vehicleReqs={vehicleReqs} setVehicleReqs={setVehicleReqs} loadVehicleReqs={loadVehicleReqs} />}
      {tab==="drivers"&&<DriversTab users={users} setUsers={setUsers} setDone={flash} t={t} isAdmin={isAdmin} isManager={isManager} userDC={user.dc} user={user} driverReqs={driverReqs} setDriverReqs={setDriverReqs} loadDriverReqs={loadDriverReqs} />}
      {tab==="dcs"&&<DCsTab dcList={dcList} setDcList={setDcList} setDone={flash} t={t} isAdmin={isAdmin} />}
      {tab==="storage"&&<StorageTab storageList={storageList} setStorageList={setStorageList} setDone={flash} t={t} isAdmin={isAdmin} />}
      {tab==="cities"&&<CitiesTab cityList={cityList} setCityList={setCityList} setDone={flash} t={t} isAdmin={isAdmin} />}
      {tab==="departments"&&<DepartmentsTab deptList={deptList} setDeptList={setDeptList} setDone={flash} t={t} isAdmin={isAdmin} loading={deptLoading} reload={loadDepartments} />}
      {tab==="allusers"&&isAdmin&&<AllUsersTab users={users} setUsers={setUsers} setDone={flash} t={t} />}
      {tab==="vehreqs"&&<VehicleRequestsTab vehicleReqs={vehicleReqs} setVehicleReqs={setVehicleReqs} vehicles={vehicles} setVehicles={setVehicles} setDone={flash} t={t} isAdmin={isAdmin} isManager={isManager} user={user} loadVehicleReqs={loadVehicleReqs} />}
      {tab==="drvreqs"&&<DriverRequestsTab driverReqs={driverReqs} setDriverReqs={setDriverReqs} users={users} setUsers={setUsers} setDone={flash} t={t} isAdmin={isAdmin} isManager={isManager} user={user} loadDriverReqs={loadDriverReqs} />}
    </div>
  );
}

function VehiclesTab({ vehicles, setVehicles, setDone, t, isAdmin, isManager, userDC, user, vehicleReqs, setVehicleReqs, loadVehicleReqs }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showReq, setShowReq] = useState(false);
  const [f, setF] = useState(EMPTY_VEH);
  const [reqForm, setReqForm] = useState({ plate:"",type:"Dyna",brand:"",model:"",year:"",fuelCapacity:80,mileage:12,reason:"" });
  const [photos, setPhotos] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const photoRef = useRef();
  const myVehicles = userDC?vehicles.filter(v=>v.dc===userDC):vehicles;
  const allDCs = [...new Set(vehicles.map(v=>v.dc))];

  function handlePhotos(e) {
    const files=Array.from(e.target.files).slice(0,4);
    Promise.all(files.map(file=>new Promise(res=>{const r=new FileReader();r.onload=ev=>res(ev.target.result);r.readAsDataURL(file);}))).then(setPhotos);
  }

  function add() {
    if (!f.plate) return;
    setVehicles(prev=>[...prev,{...f,status:"Active",fuelLevel:f.fuelCapacity,totalKM:0,maintHistory:[],photos}]);
    setDone(f.plate+" added!"); setShowAdd(false); setF(EMPTY_VEH); setPhotos([]); setAiStatus(null);
  }

  async function submitRequest() {
    if (!reqForm.plate) return;
    const newReq = {
      id:"VREQ-"+Date.now(), ...reqForm,
      dc:userDC||"Riyadh", requestedBy:user.name,
      requestedAt:new Date().toLocaleDateString(), status:"pending"
    };
    try {
      // Firestore mein save karo
      const docRef = await addDoc(collection(db, "vehicleRequests"), newReq);
      setVehicleReqs(prev=>[...prev,{...newReq, id:docRef.id}]);
      setDone(t.reqSubmitted);
      setShowReq(false);
      setReqForm({ plate:"",type:"Dyna",brand:"",model:"",year:"",fuelCapacity:80,mileage:12,reason:"" });
      if (loadVehicleReqs) loadVehicleReqs();
    } catch(e) { console.error(e); setDone("❌ Error: "+e.message); }
  }

  function toggleStatus(plate) { setVehicles(prev=>prev.map(v=>v.plate===plate?{...v,status:v.status==="Active"?"Maintenance":"Active"}:v)); }
  function toggleDC(plate,dc) { setVehicles(prev=>prev.map(v=>v.plate===plate?{...v,dc}:v)); setDone(plate+" transferred to "+dc); }

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8 }}>
        <div style={{ fontSize:14,color:"#64748b" }}>{myVehicles.length} {t.registered}</div>
        <div style={{ display:"flex",gap:8 }}>
          {isManager&&!isAdmin&&<Btn small onClick={()=>setShowReq(!showReq)} color="#7c3aed">📋 {t.requestVehicle}</Btn>}
          {isAdmin&&<Btn small onClick={()=>setShowAdd(!showAdd)}>🚗 {t.addVehicle}</Btn>}
        </div>
      </div>

      {/* DC Manager Vehicle Request Form */}
      {showReq&&isManager&&!isAdmin&&(
        <Card style={{ borderLeft:"4px solid #7c3aed" }}>
          <CardTitle>📋 {t.requestVehicle}</CardTitle>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px" }}>
            <Input label={t.plate+" *"} value={reqForm.plate} onChange={v=>setReqForm({...reqForm,plate:v})} required />
            <Select label={t.type} value={reqForm.type} onChange={v=>setReqForm({...reqForm,type:v})} options={["Dyna","Bus"]} />
            <Input label={t.brand} value={reqForm.brand} onChange={v=>setReqForm({...reqForm,brand:v})} />
            <Input label={t.model} value={reqForm.model} onChange={v=>setReqForm({...reqForm,model:v})} />
            <Input label={t.year} value={reqForm.year} onChange={v=>setReqForm({...reqForm,year:v})} type="number" />
            <Input label={t.fuelCap} value={reqForm.fuelCapacity} onChange={v=>setReqForm({...reqForm,fuelCapacity:Number(v)})} type="number" />
            <div style={{ gridColumn:"1/-1" }}><Textarea label={t.reqReason+" *"} value={reqForm.reason} onChange={v=>setReqForm({...reqForm,reason:v})} required /></div>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <Btn onClick={submitRequest} color="#7c3aed" style={{ flex:1 }}>📤 Submit Request</Btn>
            <Btn onClick={()=>setShowReq(false)} color="#64748b">{t.cancel}</Btn>
          </div>
        </Card>
      )}

      {/* Admin Add Vehicle Form */}
      {showAdd&&isAdmin&&(
        <Card>
          <CardTitle>➕ {t.addVehicle}</CardTitle>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px" }}>
            <Input label={t.plate+" *"} value={f.plate} onChange={v=>setF({...f,plate:v})} required />
            <Select label={t.type+" *"} value={f.type} onChange={v=>setF({...f,type:v})} options={["Dyna","Bus"]} />
            <Select label={t.homeDC+" *"} value={f.dc} onChange={v=>setF({...f,dc:v})} options={DCS} />
            <Input label={t.brand} value={f.brand} onChange={v=>setF({...f,brand:v})} placeholder="Toyota" />
            <Input label={t.model} value={f.model} onChange={v=>setF({...f,model:v})} />
            <Input label={t.chassis} value={f.chassis} onChange={v=>setF({...f,chassis:v})} />
            <Input label={t.year} value={f.year} onChange={v=>setF({...f,year:v})} type="number" />
            <Input label={t.fuelCap} value={f.fuelCapacity} onChange={v=>setF({...f,fuelCapacity:Number(v)})} type="number" />
            <Input label={t.mileage} value={f.mileage} onChange={v=>setF({...f,mileage:Number(v)})} type="number" />
            <Input label={t.fahas} value={f.fahas} onChange={v=>setF({...f,fahas:v})} type="date" />
            <Input label={t.istimara} value={f.istimara} onChange={v=>setF({...f,istimara:v})} type="date" />
            <Input label={t.insurance} value={f.insurance} onChange={v=>setF({...f,insurance:v})} type="date" />
            <Input label={t.nextOilKM} value={f.nextOilKM} onChange={v=>setF({...f,nextOilKM:v})} type="number" />
            <Input label={t.nextOilDate} value={f.nextOilDate} onChange={v=>setF({...f,nextOilDate:v})} type="date" />
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:14,fontWeight:600,color:"#374151",display:"block",marginBottom:8 }}>📸 {t.photos}</label>
            <input ref={photoRef} type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display:"none" }} />
            <Btn small onClick={()=>photoRef.current.click()} color="#6366f1">📸 {t.uploadPhoto}</Btn>
            {photos.length>0&&(
              <div style={{ display:"flex",gap:8,marginTop:10,flexWrap:"wrap" }}>
                {photos.map((p,i)=><img key={i} src={p} alt={"v"+i} style={{ width:90,height:68,objectFit:"cover",borderRadius:8,border:"2px solid #e2e8f0" }} />)}
              </div>
            )}
          </div>
          <div style={{ background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8,padding:"10px 14px",marginBottom:12 }}>
            <div style={{ fontWeight:600,fontSize:14,color:"#0369a1",marginBottom:6 }}>🤖 {t.aiCheck}</div>
            <div style={{ display:"flex",gap:8,alignItems:"center" }}>
              <Btn small onClick={()=>{if(!photos.length){setAiStatus("noplate");return;}setAiStatus("checking");setTimeout(()=>setAiStatus(f.plate&&f.plate.length>2?"match":"mismatch"),1500);}} color="#0369a1" disabled={aiStatus==="checking"}>
                {aiStatus==="checking"?t.aiChecking:"✔️ "+t.aiCheck}
              </Btn>
              {aiStatus==="match"&&<span style={{ color:"#065f46",fontWeight:600,fontSize:14 }}>✅ {t.aiMatch}</span>}
              {aiStatus==="mismatch"&&<span style={{ color:"#991b1b",fontWeight:600,fontSize:14 }}>⚠️ {t.aiMismatch}</span>}
              {aiStatus==="noplate"&&<span style={{ color:"#92400e",fontSize:14 }}>{t.aiNoPlate}</span>}
            </div>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <Btn onClick={add} color="#10b981" style={{ flex:1 }}>✅ {t.addBtn}</Btn>
            <Btn onClick={()=>setShowAdd(false)} color="#64748b">{t.cancel}</Btn>
          </div>
        </Card>
      )}

      {allDCs.filter(dc=>!userDC||dc===userDC).map(dc=>{
        const dv=vehicles.filter(v=>v.dc===dc);
        if (!dv.length) return null;
        return (
          <Card key={dc}>
            <CardTitle>📍 {dc} Distribution Center — {dv.length} {t.vehicles}</CardTitle>
            {dv.map(v=>(
              <div key={v.plate} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"12px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700,fontSize:14 }}>{v.plate} <span style={{ fontSize:13,color:"#64748b" }}>({v.type}) {v.brand} {v.model}</span></div>
                  <div style={{ fontSize:12,color:"#94a3b8" }}>{t.fahas}: {v.fahas||"-"} | {t.insurance}: {v.insurance||"-"}</div>
                </div>
                <span style={{ fontSize:13,fontWeight:600,padding:"3px 10px",borderRadius:99,background:v.status==="Maintenance"?"#fef3c7":"#d1fae5",color:v.status==="Maintenance"?"#92400e":"#065f46" }}>{v.status}</span>
                {isAdmin&&(
                  <select value={v.dc} onChange={e=>toggleDC(v.plate,e.target.value)}
                    style={{ border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 8px",fontSize:13,cursor:"pointer" }}>
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

function DriverRequestsTab({ driverReqs, setDriverReqs, users, setUsers, setDone, t, isAdmin, isManager, user, loadDriverReqs }) {
  const myReqs = isAdmin ? driverReqs : driverReqs.filter(r=>r.dc===user.dc);

  async function approve(id) {
    const req = driverReqs.find(r=>r.id===id);
    if (req) {
      try {
        await updateDoc(doc(db, "driverRequests", id), { status:"approved", approvedBy:user.name, approvedAt:new Date().toLocaleDateString() });
        setUsers(prev=>[...prev,{
          uid:"d"+Date.now(), name:req.name, displayName:req.name,
          phone:req.mobile, email:"", role:"driver",
          dept:"Logistics", dc:req.dc, location:"Distribution Center - "+req.dc,
          status:"Active", licNo:req.licNo, licExp:req.licExp,
          driverCard:req.driverCard||"", driverCardExp:req.driverCardExp||"",
          viewDC:req.dc, password:"spco2026"
        }]);
        setDone(t.reqApproved);
        loadDriverReqs();
      } catch(e) { console.error(e); setDone("❌ Error: "+e.message); }
    }
  }

  async function reject(id) {
    try {
      await updateDoc(doc(db, "driverRequests", id), { status:"rejected", rejectedBy:user.name });
      setDone(t.reqRejected);
      loadDriverReqs();
    } catch(e) { console.error(e); }
  }

  return (
    <Card>
      <CardTitle>📋 {t.drvReqTab} ({myReqs.length})</CardTitle>
      {myReqs.length===0&&<div style={{ textAlign:"center",padding:20,color:"#94a3b8" }}>No driver requests yet</div>}
      {myReqs.map(req=>(
        <div key={req.id} style={{ border:`1px solid ${req.status==="pending"?"#fbbf24":req.status==="approved"?"#10b981":"#ef4444"}`,borderRadius:8,padding:14,marginBottom:8 }}>
          <div style={{ display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6,marginBottom:6 }}>
            <div>
              <div style={{ fontWeight:700,fontSize:14 }}>{req.name}</div>
              <div style={{ fontSize:13,color:"#64748b" }}>{req.mobile} | {req.dc} DC | Lic: {req.licNo} Exp: {req.licExp}</div>
              <div style={{ fontSize:13,color:"#374151",marginTop:4 }}>📝 {req.reason}</div>
              <div style={{ fontSize:12,color:"#94a3b8" }}>By: {req.requestedBy} | {req.requestedAt}</div>
            </div>
            <div>
              <span style={{ fontSize:13,fontWeight:600,padding:"3px 10px",borderRadius:99,background:req.status==="pending"?"#fef3c7":req.status==="approved"?"#d1fae5":"#fee2e2",color:req.status==="pending"?"#92400e":req.status==="approved"?"#065f46":"#991b1b" }}>{req.status.toUpperCase()}</span>
              {isAdmin&&req.status==="pending"&&(
                <div style={{ display:"flex",gap:6,marginTop:8 }}>
                  <Btn small onClick={()=>approve(req.id)} color="#10b981">✅ {t.reqApprove}</Btn>
                  <Btn small onClick={()=>reject(req.id)} color="#ef4444">❌ {t.reqReject}</Btn>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}

function VehicleRequestsTab({ vehicleReqs, setVehicleReqs, vehicles, setVehicles, setDone, t, isAdmin, isManager, user, loadVehicleReqs }) {
  const myReqs = isAdmin ? vehicleReqs : vehicleReqs.filter(r=>r.dc===user.dc);

  async function approve(id) {
    const req = vehicleReqs.find(r=>r.id===id);
    if (req) {
      try {
        // Firestore vehicles collection mein add karo
        await addDoc(collection(db, "vehicles"), {
          plate:req.plate, type:req.type, brand:req.brand||"",
          model:req.model||"", year:req.year||"", dc:req.dc,
          fuelCapacity:req.fuelCapacity||80, fuelLevel:req.fuelCapacity||80,
          mileage:req.mileage||12, status:"Active", totalKM:0,
          maintHistory:[], photos:[], fahas:"", insurance:"",
          addedAt:new Date().toISOString(), approvedBy:user.name
        });
        // Request status update karo Firestore mein
        await updateDoc(doc(db, "vehicleRequests", id), { status:"approved", approvedBy:user.name, approvedAt:new Date().toLocaleDateString() });
        // Local state bhi update karo
        setVehicles(prev=>[...prev,{
          plate:req.plate, type:req.type, brand:req.brand||"",
          model:req.model||"", year:req.year||"", dc:req.dc,
          fuelCapacity:req.fuelCapacity||80, fuelLevel:req.fuelCapacity||80,
          mileage:req.mileage||12, status:"Active", totalKM:0,
          maintHistory:[], photos:[], fahas:"", insurance:""
        }]);
        setDone(t.reqApproved);
        loadVehicleReqs();
      } catch(e) { console.error(e); setDone("❌ Error: "+e.message); }
    }
  }

  async function reject(id) {
    try {
      await updateDoc(doc(db, "vehicleRequests", id), { status:"rejected", rejectedBy:user.name });
      setDone(t.reqRejected);
      loadVehicleReqs();
    } catch(e) { console.error(e); }
  }

  return (
    <Card>
      <CardTitle>📋 {t.vehReqTab} ({myReqs.length})</CardTitle>
      {myReqs.length===0&&<div style={{ textAlign:"center",padding:20,color:"#94a3b8" }}>No vehicle requests yet</div>}
      {myReqs.map(req=>(
        <div key={req.id} style={{ border:`1px solid ${req.status==="pending"?"#fbbf24":req.status==="approved"?"#10b981":"#ef4444"}`,borderRadius:8,padding:14,marginBottom:8 }}>
          <div style={{ display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6,marginBottom:6 }}>
            <div>
              <div style={{ fontWeight:700,fontSize:14 }}>{req.plate} — {req.type} {req.brand} {req.model}</div>
              <div style={{ fontSize:13,color:"#64748b" }}>{req.dc} DC | Year: {req.year} | Fuel: {req.fuelCapacity}L | {req.mileage} km/L</div>
              <div style={{ fontSize:13,color:"#374151",marginTop:4 }}>📝 {req.reason}</div>
              <div style={{ fontSize:12,color:"#94a3b8" }}>By: {req.requestedBy} | {req.requestedAt}</div>
            </div>
            <div>
              <span style={{ fontSize:13,fontWeight:600,padding:"3px 10px",borderRadius:99,background:req.status==="pending"?"#fef3c7":req.status==="approved"?"#d1fae5":"#fee2e2",color:req.status==="pending"?"#92400e":req.status==="approved"?"#065f46":"#991b1b" }}>{req.status.toUpperCase()}</span>
              {isAdmin&&req.status==="pending"&&(
                <div style={{ display:"flex",gap:6,marginTop:8 }}>
                  <Btn small onClick={()=>approve(req.id)} color="#10b981">✅ {t.reqApprove}</Btn>
                  <Btn small onClick={()=>reject(req.id)} color="#ef4444">❌ {t.reqReject}</Btn>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}

function DriversTab({ users, setUsers, setDone, t, isAdmin, isManager, userDC, user, driverReqs, setDriverReqs, loadDriverReqs }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showReq, setShowReq] = useState(false);
  const [f, setF] = useState(EMPTY_DRV);
  const [reqForm, setReqForm] = useState({ name:"",mobile:"",licNo:"",licExp:"",driverCard:"",driverCardExp:"",reason:"" });
  const [editId, setEditId] = useState(null);
  const drivers = users.filter(u=>u.role==="driver"&&(!userDC||u.dc===userDC));
  const allDCsForDrivers = [...new Set(users.filter(u=>u.role==="driver").map(u=>u.dc))];

  function save() {
    if (!f.name||!f.mobile) return;
    if (editId) { setUsers(prev=>prev.map(u=>u.uid===editId?{...u,...f}:u)); setDone(f.name+" updated!"); }
    else { setUsers(prev=>[...prev,{uid:"d"+Date.now(),...f,role:"driver",email:"",displayName:f.name,phone:f.mobile,viewDC:f.dc,location:"Distribution Center - "+f.dc,dept:"Logistics",password:"spco2026"}]); setDone(f.name+" added!"); }
    setShowAdd(false); setF(EMPTY_DRV); setEditId(null);
  }

  async function submitDriverRequest() {
    if (!reqForm.name||!reqForm.mobile) return;
    const newReq = {
      id:"DREQ-"+Date.now(), ...reqForm,
      dc:userDC||"Riyadh", requestedBy:user.name,
      requestedAt:new Date().toLocaleDateString(), status:"pending"
    };
    try {
      // Firestore mein save karo
      const docRef = await addDoc(collection(db, "driverRequests"), newReq);
      setDriverReqs(prev=>[...prev,{...newReq, id:docRef.id}]);
      setDone(t.reqSubmitted);
      setShowReq(false);
      setReqForm({ name:"",mobile:"",licNo:"",licExp:"",driverCard:"",driverCardExp:"",reason:"" });
      if (loadDriverReqs) loadDriverReqs();
    } catch(e) { console.error(e); setDone("❌ Error: "+e.message); }
  }

  function startEdit(u) { setEditId(u.uid); setF({name:u.name,mobile:u.phone||u.mobile||"",dc:u.dc||"Riyadh",licNo:u.licNo||"",licExp:u.licExp||"",driverCard:u.driverCard||"",driverCardExp:u.driverCardExp||"",status:u.status||"Active"}); setShowAdd(true); }
  function toggleStatus(uid,cur) { const next=cur==="Active"?"On Leave":cur==="On Leave"?"Inactive":"Active"; setUsers(prev=>prev.map(u=>u.uid===uid?{...u,status:next}:u)); }

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8 }}>
        <div style={{ fontSize:14,color:"#64748b" }}>{drivers.length} drivers</div>
        <div style={{ display:"flex",gap:8 }}>
          {isManager&&!isAdmin&&<Btn small onClick={()=>setShowReq(!showReq)} color="#7c3aed">📋 {t.requestDriver}</Btn>}
          {isAdmin&&<Btn small onClick={()=>{setShowAdd(!showAdd);setEditId(null);setF(EMPTY_DRV);}}>👤 {t.addDriver}</Btn>}
        </div>
      </div>

      {/* DC Manager Driver Request */}
      {showReq&&isManager&&!isAdmin&&(
        <Card style={{ borderLeft:"4px solid #7c3aed" }}>
          <CardTitle>📋 {t.requestDriver}</CardTitle>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px" }}>
            <div style={{ gridColumn:"1/-1" }}><Input label={t.driverName+" *"} value={reqForm.name} onChange={v=>setReqForm({...reqForm,name:v})} required /></div>
            <Input label={t.mobile+" *"} value={reqForm.mobile} onChange={v=>setReqForm({...reqForm,mobile:v})} required />
            <Input label={t.licNo+" *"} value={reqForm.licNo} onChange={v=>setReqForm({...reqForm,licNo:v})} required />
            <Input label={t.licExp+" *"} value={reqForm.licExp} onChange={v=>setReqForm({...reqForm,licExp:v})} type="date" required />
            <Input label={t.driverCard} value={reqForm.driverCard} onChange={v=>setReqForm({...reqForm,driverCard:v})} />
            <Input label={t.driverCardExp} value={reqForm.driverCardExp} onChange={v=>setReqForm({...reqForm,driverCardExp:v})} type="date" />
            <div style={{ gridColumn:"1/-1" }}><Textarea label={t.reqReason+" *"} value={reqForm.reason} onChange={v=>setReqForm({...reqForm,reason:v})} required /></div>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <Btn onClick={submitDriverRequest} color="#7c3aed" style={{ flex:1 }}>📤 Submit Request</Btn>
            <Btn onClick={()=>setShowReq(false)} color="#64748b">{t.cancel}</Btn>
          </div>
        </Card>
      )}

      {showAdd&&isAdmin&&(
        <Card>
          <CardTitle>{editId?"Edit Driver":"➕ "+t.addDriver}</CardTitle>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px" }}>
            <div style={{ gridColumn:"1/-1" }}><Input label={t.driverName+" *"} value={f.name} onChange={v=>setF({...f,name:v})} required /></div>
            <Input label={t.mobile+" *"} value={f.mobile} onChange={v=>setF({...f,mobile:v})} required />
            <Select label={t.homeDC+" *"} value={f.dc} onChange={v=>setF({...f,dc:v})} options={DCS} />
            <Input label={t.licNo+" *"} value={f.licNo} onChange={v=>setF({...f,licNo:v})} required />
            <Input label={t.licExp+" *"} value={f.licExp} onChange={v=>setF({...f,licExp:v})} type="date" required />
            <Input label={t.driverCard} value={f.driverCard} onChange={v=>setF({...f,driverCard:v})} />
            <Input label={t.driverCardExp} value={f.driverCardExp} onChange={v=>setF({...f,driverCardExp:v})} type="date" />
            <Select label={t.status} value={f.status} onChange={v=>setF({...f,status:v})} options={["Active","On Leave","Inactive"]} />
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <Btn onClick={save} color="#10b981" style={{ flex:1 }}>✅ {editId?t.save:t.addBtn}</Btn>
            <Btn onClick={()=>{setShowAdd(false);setEditId(null);setF(EMPTY_DRV);}} color="#64748b">{t.cancel}</Btn>
          </div>
        </Card>
      )}

      {allDCsForDrivers.filter(dc=>!userDC||dc===userDC).map(dc=>{
        const dv=users.filter(u=>u.role==="driver"&&u.dc===dc);
        if (!dv.length) return null;
        return (
          <Card key={dc}>
            <CardTitle>📍 {dc} Distribution Center — {dv.length} Drivers</CardTitle>
            {dv.map(d=>(
              <div key={d.uid} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap" }}>
                <div style={{ width:36,height:36,borderRadius:"50%",background:"#b45309",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:14,flexShrink:0 }}>{d.name.charAt(0)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600,fontSize:14 }}>{d.name}</div>
                  <div style={{ fontSize:13,color:"#64748b" }}>{d.phone||d.mobile}</div>
                  {d.licNo&&<div style={{ fontSize:12,color:"#6366f1" }}>📄 Lic: {d.licNo} | Exp: {d.licExp}</div>}
                </div>
                <span style={{ fontSize:13,fontWeight:600,padding:"3px 10px",borderRadius:99,background:d.status==="Active"?"#d1fae5":d.status==="On Leave"?"#fef3c7":"#fee2e2",color:d.status==="Active"?"#065f46":d.status==="On Leave"?"#92400e":"#991b1b" }}>{d.status||"Active"}</span>
                {isAdmin&&(
                  <div style={{ display:"flex",gap:4 }}>
                    <Btn small onClick={()=>startEdit(d)} color="#6366f1">✎</Btn>
                    <Btn small onClick={()=>toggleStatus(d.uid,d.status||"Active")} color="#f59e0b">↕</Btn>
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
