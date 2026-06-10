// src/pages/MasterData.jsx
// FINAL 8 TABS (per Handover v5 Section 3.9):
// 1. DC Locations  2. Storage Conditions  3. Cities  4. Departments
// 5. Driver Leaves  6. Vehicle Off Days (READ ONLY)
// 7. Working Calendar (Shifts + Holidays)  8. App Settings (Failed Reasons + Activity Purposes)
// REMOVED: Vehicles tab, Drivers tab, User Directory tab (all duplicates)

import { useState, useEffect } from "react";
import { Card, CardTitle, Btn, Input, Select, Textarea, SuccessMsg, TabBar } from "../components/Shared.jsx";
import { STORAGE_CONDITIONS, CITIES, DCS, LEAVE_TYPES } from "../data/masterData.js";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { sendNotification } from "../notificationService.js";
import { useSettings } from "../context/SettingsContext.jsx";

const T = {
  en: {
    dcLocs:"Distribution Center Locations",
    storage:"Storage Conditions", cities:"Cities",
    departments:"Departments",
    holidays:"Public Holidays", driverLeaves:"Driver Leaves", vehicleOff:"Vehicle Off Days",
    workingCal:"Working Calendar", appSettings:"App Settings",
    addHoliday:"Add Holiday", addLeave:"Add Leave Request",
    holidayName:"Holiday Name", fromDate:"From Date", toDate:"To Date",
    leaveType:"Leave Type",
    selectDriver:"Select Driver", reason:"Reason",
    myLeaveReq:"My Leave Requests", pendingApproval:"Pending Approval",
    approvedLeaves:"Approved Leaves", rejectedLeaves:"Rejected Leaves",
    approveLeave:"Approve", rejectLeave:"Reject",
    leaveApproved:"Leave approved!", leaveRejected:"Leave rejected.",
    submitLeaveReq:"Submit Leave Request",
    addDC:"Add DC", addStorage:"Add Storage Condition", addCity:"Add City",
    addDept:"Add Department", deptName:"Department Name",
    addBtn:"Add", edit:"Edit", delete:"Delete", save:"Save", cancel:"Cancel",
    dcName:"DC Name", dcCity:"City", dcManager:"Manager",
    dcLat:"GPS Latitude", dcLng:"GPS Longitude",
    dcAddrEn:"Address (English)", dcAddrAr:"Address (Arabic)",
    storageName:"Condition Name", storageRange:"Temperature Range",
    storageColor:"Color", cityName:"City Name",
    viewMap:"View on Map",
    driverName:"Driver Name",
    status:"Status",
    reqSubmitted:"Request submitted for Admin approval!",
    reqApproved:"Request approved!", reqRejected:"Request rejected.",
  },
  ar: {
    dcLocs:"مواقع مراكز التوزيع",
    storage:"ظروف التخزين", cities:"مدن التسليم",
    departments:"الأقسام",
    holidays:"الإجازات الرسمية", driverLeaves:"إجازات السائقين", vehicleOff:"أيام توقف المركبات",
    workingCal:"التقويم الوظيفي", appSettings:"إعدادات التطبيق",
    addHoliday:"إضافة إجازة رسمية", addLeave:"طلب إجازة",
    holidayName:"اسم الإجازة", fromDate:"من تاريخ", toDate:"إلى تاريخ",
    leaveType:"نوع الإجازة",
    selectDriver:"اختر السائق", reason:"السبب",
    myLeaveReq:"طلبات إجازاتي", pendingApproval:"بانتظار الموافقة",
    approvedLeaves:"الإجازات الموافق عليها", rejectedLeaves:"الإجازات المرفوضة",
    approveLeave:"موافقة", rejectLeave:"رفض",
    leaveApproved:"تمت الموافقة على الإجازة!", leaveRejected:"تم رفض الإجازة.",
    submitLeaveReq:"إرسال طلب الإجازة",
    addDC:"إضافة مركز", addStorage:"إضافة حالة تخزين", addCity:"إضافة مدينة",
    addDept:"إضافة قسم", deptName:"اسم القسم",
    addBtn:"إضافة", edit:"تعديل", delete:"حذف", save:"حفظ", cancel:"إلغاء",
    dcName:"اسم المركز", dcCity:"المدينة", dcManager:"المدير",
    dcLat:"خط العرض (GPS)", dcLng:"خط الطول (GPS)",
    dcAddrEn:"العنوان (إنجليزي)", dcAddrAr:"العنوان (عربي)",
    storageName:"اسم الحالة", storageRange:"نطاق الحرارة",
    storageColor:"اللون", cityName:"اسم المدينة",
    viewMap:"عرض على الخريطة",
    driverName:"اسم السائق",
    status:"الحالة",
    reqSubmitted:"تم إرسال الطلب للمسؤول!",
    reqApproved:"تمت الموافقة!", reqRejected:"تم الرفض.",
  }
};

export default function MasterData({ vehicles, setVehicles, users, setUsers, lang, user }) {
  const [tab, setTab] = useState("dcs");
  const [done, setDone] = useState("");
  const rtl = lang === "ar";
  const t = T[lang] || T.en;
  const isAdmin = user.role === "admin";
  const isManager = user.role === "manager";
  const isLogistic = user.role === "logistic";
  const isDriver = user.role === "driver";

  const { failedReasons, setFailedReasons, activityPurposes, setActivityPurposes, shifts, setShifts } = useSettings();

  const DEFAULT_DC_LIST = [
    { dc:"Riyadh",city:"Riyadh",manager:"AlWaleed Qahtani",lat:"24.7136",lng:"46.6753",addrEn:"King Fahd Road, Al Olaya, Riyadh 12211",addrAr:"طريق الملك فهد، العليا، الرياض 12211" },
    { dc:"Jeddah",city:"Jeddah",manager:"Muhammad Anas",lat:"21.4858",lng:"39.1925",addrEn:"Prince Sultan Road, Al Hamra, Jeddah 23435",addrAr:"طريق الأمير سلطان، الحمراء، جدة 23435" },
    { dc:"Dammam",city:"Dammam",manager:"Muhammad Saleh",lat:"26.4207",lng:"50.0888",addrEn:"King Saud Road, Al Faisaliyah, Dammam 32232",addrAr:"طريق الملك سعود، الفيصلية، الدمام 32232" },
  ];
  const [dcList, setDcList] = useState([]);
  const [storageList, setStorageList] = useState(STORAGE_CONDITIONS.map(s=>({...s})));
  const [cityList, setCityList] = useState([...CITIES]);

  const [deptList, setDeptList] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [driverLeaves, setDriverLeaves] = useState([]);
  const [vehicleOffDays, setVehicleOffDays] = useState([]);

  useEffect(() => {
    loadDCLocations();
    loadDepartments();
    loadHolidays();
    loadDriverLeaves();
    loadVehicleOffDays();
  }, []);

  async function loadDCLocations() {
    try {
      const snap = await getDocs(collection(db, "dcLocations"));
      if (snap.docs.length > 0) {
        // Firestore mein data hai — load karo with firestoreId
        setDcList(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
      } else {
        // Pehli baar — DEFAULT data Firestore mein save karo
        const saved = [];
        for (const dc of DEFAULT_DC_LIST) {
          const ref = await addDoc(collection(db, "dcLocations"), dc);
          saved.push({ firestoreId: ref.id, ...dc });
        }
        setDcList(saved);
      }
    } catch(e) {
      console.error("loadDCLocations error:", e);
      setDcList(DEFAULT_DC_LIST); // fallback
    }
  }

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

  // Build tabs — driver sees only Driver Leaves; others see their relevant tabs
  const tabs = [
    ...(isAdmin || isManager ? [["dcs","📍",t.dcLocs]] : []),
    ...(isAdmin || isManager ? [["storage","🌡️",t.storage]] : []),
    ...(isAdmin || isManager ? [["cities","🌆",t.cities]] : []),
    ...(isAdmin || isManager ? [["departments","🏢",t.departments]] : []),
    ...((isAdmin || isManager || isLogistic || isDriver) ? [["driverleaves","👤",t.driverLeaves]] : []),
    ...((isAdmin || isManager || isLogistic) ? [["vehicleoff","🚗",t.vehicleOff]] : []),
    ...(isAdmin ? [["workingcal","📅",t.workingCal]] : []),
    ...(isAdmin ? [["appsettings","⚙️",t.appSettings]] : []),
  ];

  // Set default tab based on role
  useEffect(() => {
    if (isDriver) setTab("driverleaves");
    else setTab("dcs");
  }, []);

  function flash(msg) { setDone(msg); setTimeout(()=>setDone(""),3000); }

  return (
    <div style={{ direction: rtl ? "rtl" : "ltr" }}>
      {done && <SuccessMsg msg={done} />}
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "dcs" && <DCsTab dcList={dcList} setDcList={setDcList} setDone={flash} t={t} isAdmin={isAdmin} user={user} />}
      {tab === "storage" && <StorageTab storageList={storageList} setStorageList={setStorageList} setDone={flash} t={t} isAdmin={isAdmin} user={user} />}
      {tab === "cities" && <CitiesTab cityList={cityList} setCityList={setCityList} setDone={flash} t={t} isAdmin={isAdmin} user={user} />}
      {tab === "departments" && <DepartmentsTab deptList={deptList} setDeptList={setDeptList} setDone={flash} t={t} isAdmin={isAdmin} loading={deptLoading} reload={loadDepartments} user={user} />}
      {tab === "driverleaves" && <DriverLeavesTab leaves={driverLeaves} setLeaves={setDriverLeaves} users={users} setDone={flash} t={t} isAdmin={isAdmin} isManager={isManager} isLogistic={isLogistic} user={user} reload={loadDriverLeaves} />}
      {tab === "vehicleoff" && <VehicleOffTab offDays={vehicleOffDays} isAdmin={isAdmin} user={user} />}
      {tab === "workingcal" && isAdmin && <WorkingCalendarTab holidays={holidays} setHolidays={setHolidays} shifts={shifts} setShifts={setShifts} setDone={flash} t={t} reload={loadHolidays} />}
      {tab === "appsettings" && isAdmin && <AppSettingsTab failedReasons={failedReasons} setFailedReasons={setFailedReasons} activityPurposes={activityPurposes} setActivityPurposes={setActivityPurposes} setDone={flash} />}
    </div>
  );
}

// ── DC LOCATIONS TAB ──────────────────────────────────────────────────────────
function DCsTab({ dcList, setDcList, setDone, t, isAdmin, user }) {
  const isManager = user?.role === "manager";
  // Normalize user dc — handles "Distribution Center - Dammam" and "Dammam" both
  function normDC(val) {
    if (!val) return "";
    const v = String(val).trim().toLowerCase();
    const map = { "distribution center - riyadh":"Riyadh","riyadh":"Riyadh","distribution center - jeddah":"Jeddah","jeddah":"Jeddah","distribution center - dammam":"Dammam","dammam":"Dammam" };
    return map[v] || String(val).trim();
  }
  const userDCnorm = normDC(user?.dc||"");
  console.log("[MasterData] user.dc:", user?.dc, "→", userDCnorm);
  // DC Manager sees only own DC — Admin sees all
  const myDcList = isAdmin ? dcList : dcList.filter(d => normDC(d.dc)===userDCnorm);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [f, setF] = useState({ dc:"",city:"",manager:"",lat:"",lng:"",addrEn:"",addrAr:"" });

  async function save() {
    if (!f.dc||!f.city) return;
    try {
      if (editId) {
        await updateDoc(doc(db,"dcLocations",editId), f);
        setDcList(prev=>prev.map(d=>d.firestoreId===editId?{...d,...f}:d));
        setDone(f.dc+" updated!");
      } else {
        const ref = await addDoc(collection(db,"dcLocations"), f);
        setDcList(prev=>[...prev,{firestoreId:ref.id,...f}]);
        setDone(f.dc+" added!");
      }
    } catch(e) { setDone("❌ Error: "+e.message); }
    setShowAdd(false); setEditId(null); setF({ dc:"",city:"",manager:"",lat:"",lng:"",addrEn:"",addrAr:"" });
  }

  async function deleteDC(item) {
    if (!window.confirm("Delete "+item.dc+" DC?")) return;
    try {
      if (item.firestoreId) await deleteDoc(doc(db,"dcLocations",item.firestoreId));
      setDcList(prev=>prev.filter(d=>d.firestoreId!==item.firestoreId));
      setDone("DC deleted.");
    } catch(e) { setDone("❌ Error: "+e.message); }
  }

  const [managerEditId, setManagerEditId] = useState(null);
  const [managerF, setManagerF] = useState({ manager:"",lat:"",lng:"",addrEn:"",addrAr:"" });

  function startEdit(item) { setEditId(item.firestoreId||null); setF({dc:item.dc,city:item.city,manager:item.manager||"",lat:item.lat||"",lng:item.lng||"",addrEn:item.addrEn||"",addrAr:item.addrAr||""}); setShowAdd(true); }

  async function saveManagerEdit() {
    if (!managerEditId) return;
    try {
      await updateDoc(doc(db,"dcLocations",managerEditId), managerF);
      setDcList(prev=>prev.map(d=>d.firestoreId===managerEditId?{...d,...managerF}:d));
      setDone("DC updated!");
    } catch(e) { setDone("❌ "+e.message); }
    setManagerEditId(null);
  }

  return (
    <Card>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <CardTitle style={{ margin:0 }}>📍 {t.dcLocs}</CardTitle>
        {isAdmin&&<Btn small onClick={()=>{setShowAdd(!showAdd);setEditId(null);setF({ dc:"",city:"",manager:"",lat:"",lng:"",addrEn:"",addrAr:"" });}}>➕ {t.addDC}</Btn>}
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
            <Btn onClick={save} color="#10b981" style={{ flex:1 }}>✅ {editId?t.save:t.addBtn}</Btn>
            <Btn onClick={()=>{setShowAdd(false);setEditId(null);}} color="#64748b">{t.cancel}</Btn>
          </div>
        </div>
      )}
      {myDcList.length===0&&<div style={{ textAlign:"center",padding:24,color:"#94a3b8" }}>No DC locations found</div>}
      {myDcList.map((d)=>(
        <div key={d.firestoreId||d.dc} style={{ border:"1px solid #e2e8f0",borderRadius:8,padding:14,marginBottom:8 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
            <div style={{ fontWeight:700,fontSize:15 }}>📍 Distribution Center - {d.dc}</div>
            {isAdmin&&(
              <div style={{ display:"flex",gap:6 }}>
                <Btn small onClick={()=>startEdit(d)} color="#6366f1">✎ {t.edit}</Btn>
                <Btn small onClick={()=>deleteDC(d)} color="#ef4444">🗑</Btn>
              </div>
            )}
            {isManager&&normDC(d.dc)===userDCnorm&&managerEditId!==d.firestoreId&&(
              <Btn small onClick={()=>{setManagerEditId(d.firestoreId);setManagerF({manager:d.manager||"",lat:d.lat||"",lng:d.lng||"",addrEn:d.addrEn||"",addrAr:d.addrAr||""});}} color="#6366f1">✎ Edit My DC Info</Btn>
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
          {/* Manager inline edit form — own DC only */}
          {isManager&&normDC(d.dc)===userDCnorm&&managerEditId===d.firestoreId&&(
            <div style={{ background:"#f0f9ff",borderRadius:8,padding:14,marginTop:12,border:"1px solid #bae6fd" }}>
              <div style={{ fontWeight:700,fontSize:13,color:"#0369a1",marginBottom:10 }}>✎ Edit My DC Information</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px" }}>
                <Input label="Manager Name" value={managerF.manager} onChange={v=>setManagerF({...managerF,manager:v})} />
                <div />
                <Input label="GPS Latitude" value={managerF.lat} onChange={v=>setManagerF({...managerF,lat:v})} placeholder="24.7136" />
                <Input label="GPS Longitude" value={managerF.lng} onChange={v=>setManagerF({...managerF,lng:v})} placeholder="46.6753" />
                <div style={{ gridColumn:"1/-1" }}><Input label="Address (English)" value={managerF.addrEn} onChange={v=>setManagerF({...managerF,addrEn:v})} /></div>
                <div style={{ gridColumn:"1/-1" }}><Input label="العنوان (عربي)" value={managerF.addrAr} onChange={v=>setManagerF({...managerF,addrAr:v})} /></div>
              </div>
              <div style={{ display:"flex",gap:8,marginTop:8 }}>
                <Btn onClick={saveManagerEdit} color="#10b981" style={{ flex:1 }}>✅ Save Changes</Btn>
                <Btn onClick={()=>setManagerEditId(null)} color="#64748b">Cancel</Btn>
              </div>
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}

// ── STORAGE CONDITIONS TAB ────────────────────────────────────────────────────
function StorageTab({ storageList, setStorageList, setDone, t, isAdmin, user }) {
  const isManager = user?.role === "manager";
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [f, setF] = useState({ name:"",range:"",color:"#10b981" });

  async function save() {
    if (!f.name||!f.range) return;
    try {
      if (editId) {
        await updateDoc(doc(db,"storage",editId), f);
        setStorageList(prev=>prev.map(s=>s.firestoreId===editId?{...s,...f}:s));
        setDone(f.name+" updated!");
      } else {
        const ref = await addDoc(collection(db,"storage"), f);
        setStorageList(prev=>[...prev,{firestoreId:ref.id,...f}]);
        setDone(f.name+" added!");
      }
    } catch(e) { setDone("❌ "+e.message); }
    setShowAdd(false); setEditId(null); setF({ name:"",range:"",color:"#10b981" });
  }

  async function deleteStorage(s) {
    if (!window.confirm("Delete "+s.name+"?")) return;
    try {
      if (s.firestoreId) await deleteDoc(doc(db,"storage",s.firestoreId));
      setStorageList(prev=>prev.filter(x=>x.firestoreId!==s.firestoreId));
      setDone("Deleted.");
    } catch(e) { setDone("❌ "+e.message); }
  }

  return (
    <Card>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <CardTitle style={{ margin:0 }}>🌡️ {t.storage}</CardTitle>
        {isAdmin&&<Btn small onClick={()=>{setShowAdd(!showAdd);setEditId(null);setF({ name:"",range:"",color:"#10b981" });}}>➕ {t.addStorage}</Btn>}
        {isManager&&<div style={{ fontSize:12,color:"#64748b",fontStyle:"italic" }}>🔒 Read Only</div>}
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
            <Btn onClick={save} color="#10b981" style={{ flex:1 }}>✅ {editId?t.save:t.addBtn}</Btn>
            <Btn onClick={()=>{setShowAdd(false);setEditId(null);}} color="#64748b">{t.cancel}</Btn>
          </div>
        </div>
      )}
      {storageList.map((s)=>(
        <div key={s.firestoreId||s.name} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #f1f5f9" }}>
          <div style={{ width:14,height:14,borderRadius:"50%",background:s.color,flexShrink:0 }} />
          <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:14 }}>{s.name} <span style={{ fontSize:14,color:"#64748b",fontWeight:400 }}>({s.range})</span></div></div>
          {isAdmin&&(
            <div style={{ display:"flex",gap:4 }}>
              <Btn small onClick={()=>{setEditId(s.firestoreId||null);setF({name:s.name,range:s.range||"",color:s.color||"#10b981"});setShowAdd(true);}} color="#6366f1">✎</Btn>
              <Btn small onClick={()=>deleteStorage(s)} color="#ef4444">🗑</Btn>
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}

// ── CITIES TAB ────────────────────────────────────────────────────────────────
function CitiesTab({ cityList, setCityList, setDone, t, isAdmin, user }) {
  const isManager = user?.role === "manager";
  const [showAdd, setShowAdd] = useState(false);
  const [newCity, setNewCity] = useState("");
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");

  async function addCity() {
    if (!newCity.trim()) return;
    try {
      const ref = await addDoc(collection(db,"cities"), {name:newCity.trim()});
      setCityList(prev=>[...prev,{firestoreId:ref.id,name:newCity.trim()}]);
      setDone(newCity+" added!");
    } catch(e) { setDone("❌ "+e.message); }
    setNewCity(""); setShowAdd(false);
  }

  async function saveEdit(c) {
    if (!editVal.trim()) return;
    try {
      if (c.firestoreId) await updateDoc(doc(db,"cities",c.firestoreId), {name:editVal.trim()});
      setCityList(prev=>prev.map(x=>x.firestoreId===c.firestoreId?{...x,name:editVal.trim()}:x));
      setDone(editVal+" updated!");
    } catch(e) { setDone("❌ "+e.message); }
    setEditId(null);
  }

  async function deleteCity(c) {
    if (!window.confirm("Delete "+(c.name||c)+"?")) return;
    try {
      if (c.firestoreId) await deleteDoc(doc(db,"cities",c.firestoreId));
      setCityList(prev=>prev.filter(x=>(x.firestoreId||x)!==(c.firestoreId||c)));
      setDone("Deleted.");
    } catch(e) { setDone("❌ "+e.message); }
  }

  return (
    <Card>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <CardTitle style={{ margin:0 }}>🌆 {t.cities}</CardTitle>
        {isAdmin&&<Btn small onClick={()=>setShowAdd(!showAdd)}>➕ {t.addCity}</Btn>}
        {isManager&&<div style={{ fontSize:12,color:"#64748b",fontStyle:"italic" }}>🔒 Read Only</div>}
      </div>
      {showAdd&&isAdmin&&(
        <div style={{ display:"flex",gap:8,marginBottom:12 }}>
          <input value={newCity} onChange={e=>setNewCity(e.target.value)} placeholder={t.cityName}
            style={{ flex:1,border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",fontSize:14,outline:"none" }} />
          <Btn onClick={addCity} color="#10b981">✅</Btn>
          <Btn onClick={()=>setShowAdd(false)} color="#64748b">{t.cancel}</Btn>
        </div>
      )}
      <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
        {cityList.map((c)=>(
          <div key={c.firestoreId||c} style={{ display:"flex",alignItems:"center",gap:4,background:"#f1f5f9",borderRadius:8,padding:"6px 12px" }}>
            {editId===c.firestoreId?(
              <>
                <input value={editVal} onChange={e=>setEditVal(e.target.value)} style={{ border:"1px solid #6366f1",borderRadius:6,padding:"3px 8px",fontSize:14,outline:"none",width:100 }} />
                <button onClick={()=>saveEdit(c)} style={{ background:"#10b981",border:"none",color:"white",borderRadius:4,padding:"2px 6px",cursor:"pointer",fontSize:12 }}>✓</button>
                <button onClick={()=>setEditId(null)} style={{ background:"#64748b",border:"none",color:"white",borderRadius:4,padding:"2px 6px",cursor:"pointer",fontSize:12 }}>✕</button>
              </>
            ):(
              <>
                <span style={{ fontSize:14,fontWeight:600,color:"#374151" }}>📍 {c.name||c}</span>
                {isAdmin&&<>
                  <button onClick={()=>{setEditId(c.firestoreId||null);setEditVal(c.name||c);}} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#6366f1",padding:"0 2px" }}>✎</button>
                  <button onClick={()=>deleteCity(c)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#ef4444",padding:"0 2px" }}>✕</button>
                </>}
              </>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── DEPARTMENTS TAB ───────────────────────────────────────────────────────────
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
      const docRef = await addDoc(collection(db, "departments"), { name: newDeptName.trim(), createdAt: new Date().toISOString() });
      setDeptList(prev=>[...prev, { id:docRef.id, name:newDeptName.trim() }]);
      setDone(newDeptName+" added!");
      setNewDeptName(""); setShowAdd(false);
    } catch(e) { setDone("❌ Error: "+e.message); }
    setSaving(false);
  }

  async function saveDeptEdit(id) {
    if (!editVal.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "departments", id), { name: editVal.trim() });
      setDeptList(prev=>prev.map(d=>d.id===id?{...d,name:editVal.trim()}:d));
      setDone(editVal+" updated!"); setEditId(null); setEditVal("");
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
          <input value={newDeptName} onChange={e=>setNewDeptName(e.target.value)} placeholder={t.deptName}
            style={{ flex:1, border:"1.5px solid #6366f1", borderRadius:8, padding:"9px 14px", fontSize:14, outline:"none" }}
            onKeyDown={e=>e.key==="Enter"&&addDept()} />
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
              <input value={editVal} onChange={e=>setEditVal(e.target.value)}
                style={{ flex:1, border:"1.5px solid #6366f1", borderRadius:8, padding:"7px 12px", fontSize:14, outline:"none" }}
                onKeyDown={e=>e.key==="Enter"&&saveDeptEdit(dept.id)} autoFocus />
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

// ── DRIVER LEAVES TAB ─────────────────────────────────────────────────────────
function DriverLeavesTab({ leaves, setLeaves, users, setDone, t, isAdmin, isManager, isLogistic, user, reload }) {
  const [showAdd, setShowAdd] = useState(false);
  const [f, setF] = useState({ driverId:"", from:"", to:"", type:"Annual Leave", reason:"" });
  const [saving, setSaving] = useState(false);
  const isDriver = user.role === "driver";
  const drivers = users.filter(u=>u.role==="driver"&&(!user.dc||u.dc===user.dc||user.dc==="Head Office"));
  const myLeaves = isDriver ? leaves.filter(l=>l.driverId===user.uid) : isAdmin ? leaves : leaves.filter(l=>l.dc===user.dc);
  const pendingManagerLeaves = (isManager||isLogistic) ? myLeaves.filter(l=>l.status==="pending_manager") : [];
  const pendingAdminLeaves = isAdmin ? leaves.filter(l=>l.status==="pending_admin") : [];

  function daysBetween(from,to){ return Math.round((new Date(to)-new Date(from))/(1000*60*60*24))+1; }

  async function submitDriverLeave() {
    if(!f.from||!f.to||!f.reason.trim()){setDone("❌ Fill all required fields");return;}
    setSaving(true);
    try {
      const data={driverId:user.uid,driverName:user.name,dc:user.dc,from:f.from,to:f.to,type:f.type,reason:f.reason,status:"pending_manager",submittedAt:new Date().toISOString(),submittedBy:user.name};
      const docRef=await addDoc(collection(db,"driverLeaves"),data);
      setLeaves(prev=>[...prev,{id:docRef.id,...data}]);
      await sendNotification({toRole:"manager",toDC:user.dc,type:"leave",title:"Driver Leave Request",message:`${user.name} submitted ${f.type} from ${f.from} to ${f.to}.`});
      setDone("Submitted!");
      setF({driverId:"",from:"",to:"",type:"Annual Leave",reason:""});
      setShowAdd(false);
    } catch(e){setDone("❌ "+e.message);}
    setSaving(false);
  }

  async function submitManagerLeave() {
    const sel=f.driverId?drivers.find(d=>d.uid===f.driverId):null;
    if(!f.from||!f.to){setDone("❌ Dates required");return;}
    setSaving(true);
    try {
      const data={driverId:sel?.uid||user.uid,driverName:sel?.name||user.name,dc:sel?.dc||user.dc,from:f.from,to:f.to,type:f.type,reason:f.reason||"",status:"pending_admin",submittedAt:new Date().toISOString(),submittedBy:user.name,managerApprovedBy:user.name,managerApprovedAt:new Date().toISOString()};
      const docRef=await addDoc(collection(db,"driverLeaves"),data);
      setLeaves(prev=>[...prev,{id:docRef.id,...data}]);
      await sendNotification({toRole:"admin",type:"leave",title:"Leave — Manager Approved",message:`${user.name} approved ${f.type} for ${data.driverName} (${data.dc}) ${f.from}→${f.to}.`});
      setDone("Submitted for Admin!");
      setF({driverId:"",from:"",to:"",type:"Annual Leave",reason:""});
      setShowAdd(false);
    } catch(e){setDone("❌ "+e.message);}
    setSaving(false);
  }

  async function managerApprove(l) {
    try {
      await updateDoc(doc(db,"driverLeaves",l.id),{status:"pending_admin",managerApprovedBy:user.name,managerApprovedAt:new Date().toISOString()});
      setLeaves(prev=>prev.map(x=>x.id===l.id?{...x,status:"pending_admin",managerApprovedBy:user.name}:x));
      await sendNotification({toRole:"admin",type:"leave",title:"Leave — Manager Approved",message:`${user.name} approved ${l.driverName} ${l.type} (${l.from}→${l.to}).`});
      await sendNotification({toUserId:l.driverId,type:"leave_approved",title:"Leave — Manager Approved ✅",message:`Your ${l.type} approved by ${user.name}. Waiting Admin.`});
      setDone("Forwarded to Admin!");
    } catch(e){setDone("❌ "+e.message);}
  }

  async function managerReject(l) {
    try {
      await updateDoc(doc(db,"driverLeaves",l.id),{status:"rejected",rejectedBy:user.name,rejectedAt:new Date().toISOString()});
      setLeaves(prev=>prev.map(x=>x.id===l.id?{...x,status:"rejected",rejectedBy:user.name}:x));
      await sendNotification({toUserId:l.driverId,type:"leave_rejected",title:"Leave Rejected ❌",message:`Your ${l.type} (${l.from}→${l.to}) rejected by ${user.name}.`});
      setDone("Rejected.");
    } catch(e){setDone("❌ "+e.message);}
  }

  async function adminApprove(l) {
    try {
      await updateDoc(doc(db,"driverLeaves",l.id),{status:"approved",approvedBy:user.name,approvedAt:new Date().toISOString()});
      setLeaves(prev=>prev.map(x=>x.id===l.id?{...x,status:"approved",approvedBy:user.name}:x));
      await sendNotification({toUserId:l.driverId,type:"leave_approved",title:"Leave Approved ✅",message:`Your ${l.type} (${l.from}→${l.to}) fully approved. Excluded from working days.`});
      setDone(t.leaveApproved);
    } catch(e){setDone("❌ "+e.message);}
  }

  async function adminReject(l) {
    try {
      await updateDoc(doc(db,"driverLeaves",l.id),{status:"rejected",rejectedBy:user.name,rejectedAt:new Date().toISOString()});
      setLeaves(prev=>prev.map(x=>x.id===l.id?{...x,status:"rejected",rejectedBy:user.name}:x));
      await sendNotification({toUserId:l.driverId,type:"leave_rejected",title:"Leave Rejected ❌",message:`Your ${l.type} (${l.from}→${l.to}) rejected by Admin.`});
      setDone(t.leaveRejected);
    } catch(e){setDone("❌ "+e.message);}
  }

  async function deleteLeave(id) {
    if(!window.confirm("Delete?"))return;
    try {
      await deleteDoc(doc(db,"driverLeaves",id));
      setLeaves(prev=>prev.filter(l=>l.id!==id));
      setDone("Deleted!");
    } catch(e){setDone("❌ "+e.message);}
  }

  function statusBadge(s){
    const m={pending_manager:["#fef3c7","#92400e","⏳ Pending Manager"],pending_admin:["#dbeafe","#1e40af","⏳ Pending Admin"],approved:["#d1fae5","#065f46","✅ Approved"],rejected:["#fee2e2","#991b1b","❌ Rejected"]};
    const[bg,c,lbl]=m[s]||["#f1f5f9","#64748b",s];
    return<span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:bg,color:c}}>{lbl}</span>;
  }

  function LeaveCard({l,showMgr,showAdmin}){
    return(
      <div style={{border:"1px solid #e2e8f0",borderRadius:8,padding:14,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:8}}>
          <div>
            <div style={{fontWeight:700,fontSize:14}}>👤 {l.driverName} <span style={{color:"#64748b",fontSize:13}}>— {l.dc}</span></div>
            <div style={{fontSize:13,color:"#64748b"}}>{l.type} | 📅 {l.from} → {l.to} <span style={{color:"#6366f1",fontWeight:600}}>({daysBetween(l.from,l.to)} days)</span></div>
            {l.reason&&<div style={{fontSize:12,color:"#94a3b8"}}>📝 {l.reason}</div>}
            {l.managerApprovedBy&&<div style={{fontSize:11,color:"#10b981"}}>✅ Manager: {l.managerApprovedBy}</div>}
            {l.approvedBy&&<div style={{fontSize:11,color:"#10b981"}}>✅ Admin: {l.approvedBy}</div>}
            {l.rejectedBy&&<div style={{fontSize:11,color:"#ef4444"}}>❌ Rejected: {l.rejectedBy}</div>}
          </div>
          {statusBadge(l.status)}
        </div>
        {showMgr&&l.status==="pending_manager"&&<div style={{display:"flex",gap:8,marginTop:8}}><Btn small onClick={()=>managerApprove(l)} color="#10b981">✅ {t.approveLeave}</Btn><Btn small onClick={()=>managerReject(l)} color="#ef4444">❌ {t.rejectLeave}</Btn></div>}
        {showAdmin&&l.status==="pending_admin"&&<div style={{display:"flex",gap:8,marginTop:8}}><Btn small onClick={()=>adminApprove(l)} color="#10b981">✅ {t.approveLeave}</Btn><Btn small onClick={()=>adminReject(l)} color="#ef4444">❌ {t.rejectLeave}</Btn></div>}
        {isAdmin&&<Btn small onClick={()=>deleteLeave(l.id)} color="#ef4444" style={{marginTop:6}}>🗑️</Btn>}
      </div>
    );
  }

  // Shared leave type select using LEAVE_TYPES from masterData
  const LeaveTypeSelect = () => (
    <select value={f.type} onChange={e=>setF({...f,type:e.target.value})}
      style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box"}}>
      {LEAVE_TYPES.map(lt=><option key={lt} value={lt}>{lt}</option>)}
    </select>
  );

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:15,color:"#1A3A5C"}}>👤 {t.driverLeaves}</div>
        {(isDriver||isManager||isLogistic)&&<Btn small onClick={()=>setShowAdd(!showAdd)} color="#6366f1">➕ {t.addLeave}</Btn>}
      </div>

      {/* Driver — submit own leave */}
      {showAdd&&isDriver&&(
        <Card style={{borderLeft:"4px solid #6366f1",marginBottom:16}}>
          <CardTitle>📝 Submit Leave Request</CardTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <div style={{gridColumn:"1/-1",marginBottom:10}}>
              <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Leave Type</label>
              <LeaveTypeSelect />
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>From *</label>
              <input type="date" value={f.from} onChange={e=>setF({...f,from:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>To *</label>
              <input type="date" value={f.to} onChange={e=>setF({...f,to:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{gridColumn:"1/-1",marginBottom:10}}>
              <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Reason *</label>
              <input value={f.reason} onChange={e=>setF({...f,reason:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={submitDriverLeave} color="#10b981" style={{flex:1}} disabled={saving}>{saving?"Submitting...":"📤 Submit Request"}</Btn>
            <Btn onClick={()=>setShowAdd(false)} color="#64748b">Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Manager / Logistic — submit leave for driver */}
      {showAdd&&(isManager||isLogistic)&&!isAdmin&&(
        <Card style={{borderLeft:"4px solid #6366f1",marginBottom:16}}>
          <CardTitle>📝 Add Leave</CardTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <div style={{gridColumn:"1/-1",marginBottom:10}}>
              <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Driver (blank = own leave)</label>
              <select value={f.driverId||""} onChange={e=>setF({...f,driverId:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",background:"white",boxSizing:"border-box"}}>
                <option value="">My Own Leave</option>
                {drivers.map(d=><option key={d.uid} value={d.uid}>{d.name} — {d.dc}</option>)}
              </select>
            </div>
            <div style={{gridColumn:"1/-1",marginBottom:10}}>
              <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Leave Type</label>
              <LeaveTypeSelect />
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>From *</label>
              <input type="date" value={f.from} onChange={e=>setF({...f,from:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>To *</label>
              <input type="date" value={f.to} onChange={e=>setF({...f,to:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{gridColumn:"1/-1",marginBottom:10}}>
              <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Reason</label>
              <input value={f.reason} onChange={e=>setF({...f,reason:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={submitManagerLeave} color="#10b981" style={{flex:1}} disabled={saving}>{saving?"Submitting...":"📤 Submit for Admin Approval"}</Btn>
            <Btn onClick={()=>setShowAdd(false)} color="#64748b">Cancel</Btn>
          </div>
        </Card>
      )}

      {(isManager||isLogistic)&&!isAdmin&&pendingManagerLeaves.length>0&&(
        <Card style={{borderLeft:"4px solid #f59e0b",marginBottom:12}}>
          <CardTitle>⏳ Pending Driver Requests ({pendingManagerLeaves.length})</CardTitle>
          {pendingManagerLeaves.map(l=><LeaveCard key={l.id} l={l} showMgr={true} showAdmin={false}/>)}
        </Card>
      )}

      {isAdmin&&pendingAdminLeaves.length>0&&(
        <Card style={{borderLeft:"4px solid #6366f1",marginBottom:12}}>
          <CardTitle>⏳ Pending Admin Approval ({pendingAdminLeaves.length})</CardTitle>
          {pendingAdminLeaves.map(l=><LeaveCard key={l.id} l={l} showMgr={false} showAdmin={true}/>)}
        </Card>
      )}

      <Card>
        <CardTitle>📋 All Leave Records ({myLeaves.length})</CardTitle>
        {myLeaves.length===0&&<div style={{textAlign:"center",padding:24,color:"#94a3b8",fontSize:15}}>No leave records yet.</div>}
        {myLeaves.map(l=><LeaveCard key={l.id} l={l} showMgr={false} showAdmin={false}/>)}
      </Card>
    </div>
  );
}

// ── VEHICLE OFF DAYS TAB — READ ONLY ─────────────────────────────────────────
function VehicleOffTab({ offDays, isAdmin, user }) {
  const myOffDays = isAdmin ? offDays : offDays.filter(o=>o.dc===user.dc);

  function daysBetween(from, to) { return Math.round((new Date(to)-new Date(from))/(1000*60*60*24))+1; }

  return (
    <Card>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <CardTitle style={{ margin:0 }}>🚗 Vehicle Off Days</CardTitle>
        <span style={{ fontSize:13, color:"#64748b", background:"#f1f5f9", padding:"4px 10px", borderRadius:6 }}>
          ℹ️ Auto-populated from Fleet Maintenance
        </span>
      </div>
      <div style={{ background:"#fef3c7", borderLeft:"4px solid #f59e0b", borderRadius:"0 8px 8px 0", padding:"10px 14px", fontSize:13, color:"#92400e", marginBottom:16 }}>
        ⚠️ This list is automatically populated when maintenance records are saved in Fleet Management → Maintenance tab. No manual entry required here.
      </div>
      {myOffDays.length===0&&<div style={{ textAlign:"center", padding:24, color:"#94a3b8", fontSize:15 }}>No vehicle off days recorded yet. Off days appear here automatically when maintenance is logged in Fleet Management.</div>}
      {myOffDays.map(o=>(
        <div key={o.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>🚗 {o.vehiclePlate}</div>
            <div style={{ fontSize:13, color:"#64748b" }}>
              {o.reason} | 📅 {o.from} → {o.to}
              <span style={{ color:"#6366f1", fontWeight:600, marginLeft:6 }}>({daysBetween(o.from,o.to)} days)</span>
            </div>
            <div style={{ fontSize:11, color:"#94a3b8" }}>DC: {o.dc}{o.addedBy&&" | By: "+o.addedBy}{o.source==="fleet_maintenance"&&" | Source: Fleet Maintenance"}</div>
          </div>
          <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99, background:"#fee2e2", color:"#991b1b" }}>{o.reason}</span>
        </div>
      ))}
    </Card>
  );
}

// ── WORKING CALENDAR TAB — Shifts + Public Holidays ──────────────────────────
function WorkingCalendarTab({ holidays, setHolidays, shifts, setShifts, setDone, t, reload }) {
  const [showAddShift, setShowAddShift] = useState(false);
  const [editShiftId, setEditShiftId] = useState(null);
  const [shiftForm, setShiftForm] = useState({ name:"", start:"08:00", end:"16:00", validFrom:"", validTo:"", applyTo:"all", selectedDCs:[] });
  const [savingShift, setSavingShift] = useState(false);

  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ name:"", from:"", to:"" });
  const [savingHoliday, setSavingHoliday] = useState(false);

  function calcHours(start, end) {
    const [sh,sm] = start.split(":").map(Number);
    const [eh,em] = end.split(":").map(Number);
    const h = (eh*60+em-(sh*60+sm))/60;
    return Math.max(0, Math.round(h*10)/10);
  }

  function toggleDC(dc) {
    setShiftForm(prev=>{
      const has = prev.selectedDCs.includes(dc);
      return { ...prev, selectedDCs: has ? prev.selectedDCs.filter(d=>d!==dc) : [...prev.selectedDCs, dc] };
    });
  }

  async function saveShift() {
    if (!shiftForm.name || !shiftForm.start || !shiftForm.end) { setDone("❌ Name, Start, and End are required"); return; }
    setSavingShift(true);
    try {
      const hours = calcHours(shiftForm.start, shiftForm.end);
      const data = { ...shiftForm, hours, updatedAt: new Date().toISOString() };
      if (editShiftId) {
        await updateDoc(doc(db, "shifts", editShiftId), data);
        setShifts(prev=>prev.map(s=>s.id===editShiftId?{...s,...data}:s));
        setDone("Shift updated!");
      } else {
        const docRef = await addDoc(collection(db, "shifts"), { ...data, createdAt: new Date().toISOString() });
        setShifts(prev=>[...prev, { id:docRef.id, ...data }]);
        setDone("Shift added!");
      }
      setShowAddShift(false); setEditShiftId(null);
      setShiftForm({ name:"", start:"08:00", end:"16:00", validFrom:"", validTo:"", applyTo:"all", selectedDCs:[] });
    } catch(e) { setDone("❌ Error: "+e.message); }
    setSavingShift(false);
  }

  async function deleteShift(id) {
    if(!window.confirm("Delete this shift?"))return;
    try {
      await deleteDoc(doc(db,"shifts",id));
      setShifts(prev=>prev.filter(s=>s.id!==id));
      setDone("Shift deleted!");
    } catch(e) { setDone("❌ Error: "+e.message); }
  }

  function startEditShift(s) {
    setEditShiftId(s.id);
    setShiftForm({ name:s.name||"", start:s.start||"08:00", end:s.end||"16:00", validFrom:s.validFrom||"", validTo:s.validTo||"", applyTo:s.applyTo||"all", selectedDCs:s.selectedDCs||[] });
    setShowAddShift(true);
  }

  async function addHoliday() {
    if(!holidayForm.name||!holidayForm.from||!holidayForm.to){setDone("❌ All fields required");return;}
    setSavingHoliday(true);
    try {
      const docRef = await addDoc(collection(db,"publicHolidays"), {...holidayForm, createdAt:new Date().toISOString()});
      setHolidays(prev=>[...prev, {id:docRef.id,...holidayForm}]);
      setDone(holidayForm.name+" added!");
      setHolidayForm({name:"",from:"",to:""});
      setShowAddHoliday(false);
    } catch(e){setDone("❌ Error: "+e.message);}
    setSavingHoliday(false);
  }

  async function deleteHoliday(id,name) {
    if(!window.confirm("Delete '"+name+"'?"))return;
    try {
      await deleteDoc(doc(db,"publicHolidays",id));
      setHolidays(prev=>prev.filter(h=>h.id!==id));
      setDone(name+" deleted!");
    } catch(e){setDone("❌ Error: "+e.message);}
  }

  function daysBetween(from,to){return Math.round((new Date(to)-new Date(from))/(1000*60*60*24))+1;}

  const inputStyle = { width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", boxSizing:"border-box" };
  const labelStyle = { fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 };

  return (
    <div>
      {/* SECTION 1: SHIFT TIMINGS */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <CardTitle style={{ margin:0 }}>⏰ Shift Timings</CardTitle>
          <Btn small onClick={()=>{setShowAddShift(!showAddShift);setEditShiftId(null);setShiftForm({name:"",start:"08:00",end:"16:00",validFrom:"",validTo:"",applyTo:"all",selectedDCs:[]});}} color="#6366f1">
            ➕ Add Shift
          </Btn>
        </div>

        {showAddShift&&(
          <div style={{ background:"#f8fafc", borderRadius:8, padding:16, marginBottom:16, border:"1px solid #e2e8f0" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
              <div style={{ gridColumn:"1/-1", marginBottom:12 }}>
                <label style={labelStyle}>Shift Name *</label>
                <input value={shiftForm.name} onChange={e=>setShiftForm({...shiftForm,name:e.target.value})} placeholder="e.g. Morning Shift" style={inputStyle} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Start Time *</label>
                <input type="time" value={shiftForm.start} onChange={e=>setShiftForm({...shiftForm,start:e.target.value})} style={inputStyle} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>End Time *</label>
                <input type="time" value={shiftForm.end} onChange={e=>setShiftForm({...shiftForm,end:e.target.value})} style={inputStyle} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Valid From</label>
                <input type="date" value={shiftForm.validFrom} onChange={e=>setShiftForm({...shiftForm,validFrom:e.target.value})} style={inputStyle} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Valid To</label>
                <input type="date" value={shiftForm.validTo} onChange={e=>setShiftForm({...shiftForm,validTo:e.target.value})} style={inputStyle} />
              </div>
              <div style={{ gridColumn:"1/-1", marginBottom:12 }}>
                <label style={labelStyle}>Apply To</label>
                <div style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
                  <label style={{ display:"flex", gap:6, alignItems:"center", cursor:"pointer", fontWeight:600, fontSize:14 }}>
                    <input type="radio" name="applyTo" value="all" checked={shiftForm.applyTo==="all"} onChange={()=>setShiftForm({...shiftForm,applyTo:"all",selectedDCs:[]})} />
                    All Warehouses
                  </label>
                  <label style={{ display:"flex", gap:6, alignItems:"center", cursor:"pointer", fontWeight:600, fontSize:14 }}>
                    <input type="radio" name="applyTo" value="selected" checked={shiftForm.applyTo==="selected"} onChange={()=>setShiftForm({...shiftForm,applyTo:"selected"})} />
                    Selected:
                  </label>
                  {shiftForm.applyTo==="selected"&&["Riyadh","Jeddah","Dammam"].map(dc=>(
                    <label key={dc} style={{ display:"flex", gap:4, alignItems:"center", cursor:"pointer", fontSize:14 }}>
                      <input type="checkbox" checked={shiftForm.selectedDCs.includes(dc)} onChange={()=>toggleDC(dc)} />
                      {dc}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {shiftForm.start&&shiftForm.end&&(
              <div style={{ background:"#dbeafe", borderRadius:6, padding:"8px 12px", fontSize:13, color:"#1e40af", marginBottom:12 }}>
                ⏱️ Duration: <strong>{calcHours(shiftForm.start,shiftForm.end)} hours</strong>
              </div>
            )}
            <div style={{ display:"flex", gap:8 }}>
              <Btn onClick={saveShift} color="#10b981" style={{ flex:1 }} disabled={savingShift}>✅ {savingShift?"Saving...":(editShiftId?"Update Shift":"Save Shift")}</Btn>
              <Btn onClick={()=>{setShowAddShift(false);setEditShiftId(null);}} color="#64748b">Cancel</Btn>
            </div>
          </div>
        )}

        {shifts.length===0&&(
          <div style={{ textAlign:"center", padding:20, color:"#94a3b8", fontSize:14 }}>
            No shifts configured. Default shift: 08:00 – 16:00 (8 hours) applies to all.
          </div>
        )}

        {shifts.length>0&&(
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {["Name","Start","End","Hours","DC","From","To",""].map(h=>(
                    <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"2px solid #e2e8f0", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shifts.map(s=>(
                  <tr key={s.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                    <td style={{ padding:"8px 10px", fontWeight:600 }}>{s.name}</td>
                    <td style={{ padding:"8px 10px" }}>{s.start}</td>
                    <td style={{ padding:"8px 10px" }}>{s.end}</td>
                    <td style={{ padding:"8px 10px", color:"#6366f1", fontWeight:600 }}>{s.hours||calcHours(s.start,s.end)}h</td>
                    <td style={{ padding:"8px 10px", fontSize:13, color:"#64748b" }}>
                      {s.applyTo==="all"?"All":(s.selectedDCs||[]).join(", ")||"—"}
                    </td>
                    <td style={{ padding:"8px 10px", fontSize:13, color:"#64748b" }}>{s.validFrom||"—"}</td>
                    <td style={{ padding:"8px 10px", fontSize:13, color:"#64748b" }}>{s.validTo||"—"}</td>
                    <td style={{ padding:"8px 10px" }}>
                      <div style={{ display:"flex", gap:4 }}>
                        <Btn small onClick={()=>startEditShift(s)} color="#6366f1">✎</Btn>
                        <Btn small onClick={()=>deleteShift(s.id)} color="#ef4444">🗑</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SECTION 2: PUBLIC HOLIDAYS */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <CardTitle style={{ margin:0 }}>🏖️ Public Holidays</CardTitle>
          <Btn small onClick={()=>setShowAddHoliday(!showAddHoliday)} color="#6366f1">➕ Add Holiday</Btn>
        </div>
        {showAddHoliday&&(
          <div style={{ background:"#f8fafc", borderRadius:8, padding:14, marginBottom:16, border:"1px solid #e2e8f0" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
              <div style={{ gridColumn:"1/-1", marginBottom:12 }}>
                <label style={labelStyle}>Holiday Name *</label>
                <input value={holidayForm.name} onChange={e=>setHolidayForm({...holidayForm,name:e.target.value})} placeholder="e.g. Eid Al Fitr 2026" style={inputStyle} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>From *</label>
                <input type="date" value={holidayForm.from} onChange={e=>setHolidayForm({...holidayForm,from:e.target.value})} style={inputStyle} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>To *</label>
                <input type="date" value={holidayForm.to} onChange={e=>setHolidayForm({...holidayForm,to:e.target.value})} style={inputStyle} />
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn onClick={addHoliday} color="#10b981" style={{ flex:1 }} disabled={savingHoliday}>✅ {savingHoliday?"Saving...":"Add Holiday"}</Btn>
              <Btn onClick={()=>setShowAddHoliday(false)} color="#64748b">Cancel</Btn>
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
            <Btn small onClick={()=>deleteHoliday(h.id,h.name)} color="#ef4444">🗑️</Btn>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── APP SETTINGS TAB — Failed Reasons + Activity Purposes ─────────────────────
function AppSettingsTab({ failedReasons, setFailedReasons, activityPurposes, setActivityPurposes, setDone }) {
  const [newReason, setNewReason] = useState("");
  const [editReasonIdx, setEditReasonIdx] = useState(null);
  const [editReasonVal, setEditReasonVal] = useState("");
  const [newPurpose, setNewPurpose] = useState("");
  const [editPurposeIdx, setEditPurposeIdx] = useState(null);
  const [editPurposeVal, setEditPurposeVal] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveToFirestore(failedR, activityP) {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "app_settings"), {
        failedReasons: failedR,
        activityPurposes: activityP,
        updatedAt: new Date().toISOString()
      });
      setDone("✅ Settings saved to Firestore!");
    } catch(e) { setDone("❌ Save error: "+e.message); }
    setSaving(false);
  }

  function addReason() {
    if(!newReason.trim())return;
    const updated=[...failedReasons,newReason.trim()];
    setFailedReasons(updated);
    setNewReason("");
    saveToFirestore(updated, activityPurposes);
  }

  function saveReasonEdit(idx) {
    if(!editReasonVal.trim())return;
    const updated=failedReasons.map((r,i)=>i===idx?editReasonVal.trim():r);
    setFailedReasons(updated);
    setEditReasonIdx(null);
    saveToFirestore(updated, activityPurposes);
  }

  function deleteReason(idx) {
    if(!window.confirm("Delete this reason?"))return;
    const updated=failedReasons.filter((_,i)=>i!==idx);
    setFailedReasons(updated);
    saveToFirestore(updated, activityPurposes);
  }

  function addPurpose() {
    if(!newPurpose.trim())return;
    const updated=[...activityPurposes,newPurpose.trim()];
    setActivityPurposes(updated);
    setNewPurpose("");
    saveToFirestore(failedReasons, updated);
  }

  function savePurposeEdit(idx) {
    if(!editPurposeVal.trim())return;
    const updated=activityPurposes.map((p,i)=>i===idx?editPurposeVal.trim():p);
    setActivityPurposes(updated);
    setEditPurposeIdx(null);
    saveToFirestore(failedReasons, updated);
  }

  function deletePurpose(idx) {
    if(!window.confirm("Delete this purpose?"))return;
    const updated=activityPurposes.filter((_,i)=>i!==idx);
    setActivityPurposes(updated);
    saveToFirestore(failedReasons, updated);
  }

  const ItemRow = ({items, editIdx, editVal, onEdit, onSave, onDelete, onEditChange}) => (
    <div>
      {items.map((item,idx)=>(
        <div key={idx} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
          {editIdx===idx?(
            <>
              <input value={editVal} onChange={e=>onEditChange(e.target.value)}
                style={{ flex:1, border:"1.5px solid #6366f1", borderRadius:7, padding:"6px 10px", fontSize:14, outline:"none" }}
                onKeyDown={e=>e.key==="Enter"&&onSave(idx)} autoFocus />
              <Btn small onClick={()=>onSave(idx)} color="#10b981">✅</Btn>
              <Btn small onClick={()=>onEdit(null)} color="#64748b">✕</Btn>
            </>
          ):(
            <>
              <div style={{ flex:1, fontSize:14, color:"#0f172a" }}>• {item}</div>
              <Btn small onClick={()=>{onEdit(idx);onEditChange(item);}} color="#6366f1">✎</Btn>
              <Btn small onClick={()=>onDelete(idx)} color="#ef4444">🗑</Btn>
            </>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* SECTION 1: FAILED DELIVERY REASONS */}
      <Card>
        <CardTitle>❌ Failed Delivery Reasons</CardTitle>
        <div style={{ background:"#f0f9ff", borderLeft:"4px solid #0ea5e9", padding:"8px 12px", borderRadius:"0 8px 8px 0", fontSize:13, color:"#0369a1", marginBottom:12 }}>
          ℹ️ These reasons appear in the Delivery Partner app when a delivery fails. Changes reflect instantly.
        </div>
        <ItemRow
          items={failedReasons} editIdx={editReasonIdx} editVal={editReasonVal}
          onEdit={setEditReasonIdx} onSave={saveReasonEdit} onDelete={deleteReason}
          onEditChange={setEditReasonVal}
        />
        <div style={{ display:"flex", gap:8, marginTop:12 }}>
          <input value={newReason} onChange={e=>setNewReason(e.target.value)} placeholder="New reason..."
            style={{ flex:1, border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none" }}
            onKeyDown={e=>e.key==="Enter"&&addReason()} />
          <Btn onClick={addReason} color="#10b981" disabled={saving}>➕ Add</Btn>
        </div>
      </Card>

      {/* SECTION 2: ADDITIONAL ACTIVITY PURPOSES */}
      <Card>
        <CardTitle>🗂️ Additional Activity Purposes</CardTitle>
        <div style={{ background:"#f0f9ff", borderLeft:"4px solid #0ea5e9", padding:"8px 12px", borderRadius:"0 8px 8px 0", fontSize:13, color:"#0369a1", marginBottom:12 }}>
          ℹ️ These purposes appear in the Delivery Partner app when submitting an Additional Activity. Changes reflect instantly.
        </div>
        <ItemRow
          items={activityPurposes} editIdx={editPurposeIdx} editVal={editPurposeVal}
          onEdit={setEditPurposeIdx} onSave={savePurposeEdit} onDelete={deletePurpose}
          onEditChange={setEditPurposeVal}
        />
        <div style={{ display:"flex", gap:8, marginTop:12 }}>
          <input value={newPurpose} onChange={e=>setNewPurpose(e.target.value)} placeholder="New activity purpose..."
            style={{ flex:1, border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none" }}
            onKeyDown={e=>e.key==="Enter"&&addPurpose()} />
          <Btn onClick={addPurpose} color="#10b981" disabled={saving}>➕ Add</Btn>
        </div>
      </Card>
    </div>
  );
}
