import { useState, useRef } from "react";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg, TabBar } from "../components/Shared.jsx";
import { STORAGE_CONDITIONS, CITIES, DCS, DC_GPS } from "../data/masterData.js";

const T = {
  en: {
    vehicles:"Vehicles", drivers:"Drivers", dcLocs:"Distribution Center Locations",
    storage:"Storage Conditions", cities:"Cities", allUsers:"User Directory",
    addVehicle:"Add Vehicle", addDriver:"Add Driver",
    plate:"Plate Number", type:"Type", homeDC:"Home DC",
    brand:"Brand", model:"Model", chassis:"Chassis", year:"Year",
    fuelCap:"Fuel Capacity (L)", mileage:"Mileage (km/L)",
    fahas:"Fahas Expiry", istimara:"Istimara Expiry", insurance:"Insurance Expiry",
    nextOilKM:"Next Oil KM", nextOilDate:"Next Oil Date",
    photos:"Vehicle Photos (up to 4)", uploadPhoto:"Upload Photo",
    aiCheck:"AI Plate Verify", aiChecking:"Verifying...",
    aiMatch:"✅ Plate verified!", aiMismatch:"⚠️ Plate mismatch — check photo",
    aiNoPlate:"Take photo first", addBtn:"Add", transfer:"Transfer DC",
    registered:"registered", active:"Active", maintenance:"Maintenance",
    expired:"Expired", onLeave:"On Leave", inactive:"Inactive",
    driverName:"Driver Name", mobile:"Mobile", licNo:"License Number",
    licExp:"License Expiry", driverCard:"Driver Card", driverCardExp:"Card Expiry",
    status:"Status", edit:"Edit", save:"Save", cancel:"Cancel",
    delete:"Deactivate", activate:"Activate",
    dcTitle:"Distribution Center Locations",
    addressRiyadh:"King Fahd Road, Al Olaya, Riyadh 12211",
    addressRiyadhAr:"طريق الملك فهد، العليا، الرياض 12211",
    addressJeddah:"Prince Sultan Road, Al Hamra, Jeddah 23435",
    addressJeddahAr:"طريق الأمير سلطان، الحمراء، جدة 23435",
    addressDammam:"King Saud Road, Al Faisaliyah, Dammam 32232",
    addressDammamAr:"طريق الملك سعود، الفيصلية، الدمام 32232",
    viewMap:"View on Map",
    name:"Full Name", displayName:"Display Name", dept:"Department",
    role:"Role", location:"Location", password:"Password",
    userDir:"User Directory", editUser:"Edit User",
    contactAdmin:"Contact admin to add new delivery cities"
  },
  ar: {
    vehicles:"المركبات", drivers:"السائقون", dcLocs:"مواقع مراكز التوزيع",
    storage:"ظروف التخزين", cities:"مدن التسليم", allUsers:"دليل المستخدمين",
    addVehicle:"إضافة مركبة", addDriver:"إضافة سائق",
    plate:"رقم اللوحة", type:"النوع", homeDC:"مركز التوزيع",
    brand:"الماركة", model:"الموديل", chassis:"رقم الهيكل", year:"السنة",
    fuelCap:"سعة الخزان (L)", mileage:"كفاءة الوقود (km/L)",
    fahas:"انتهاء الفحص", istimara:"انتهاء الاستمارة", insurance:"انتهاء التأمين",
    nextOilKM:"كيلومترات تغيير الزيت", nextOilDate:"تاريخ تغيير الزيت",
    photos:"صور المركبة", uploadPhoto:"رفع صورة",
    aiCheck:"التحقق من اللوحة", aiChecking:"جاري التحقق...",
    aiMatch:"✅ تم التحقق!", aiMismatch:"⚠️ اللوحة غير مطابقة",
    aiNoPlate:"التقط صورة أولاً", addBtn:"إضافة", transfer:"نقل المركز",
    registered:"مسجلة", active:"نشط", maintenance:"صيانة",
    expired:"منتهي", onLeave:"إجازة", inactive:"غير نشط",
    driverName:"اسم السائق", mobile:"الجوال", licNo:"رقم الرخصة",
    licExp:"انتهاء الرخصة", driverCard:"بطاقة السائق", driverCardExp:"انتهاء البطاقة",
    status:"الحالة", edit:"تعديل", save:"حفظ", cancel:"إلغاء",
    delete:"تعطيل", activate:"تفعيل",
    dcTitle:"مواقع مراكز التوزيع",
    addressRiyadh:"King Fahd Road, Al Olaya, Riyadh 12211",
    addressRiyadhAr:"طريق الملك فهد، العليا، الرياض 12211",
    addressJeddah:"Prince Sultan Road, Al Hamra, Jeddah 23435",
    addressJeddahAr:"طريق الأمير سلطان، الحمراء، جدة 23435",
    addressDammam:"King Saud Road, Al Faisaliyah, Dammam 32232",
    addressDammamAr:"طريق الملك سعود، الفيصلية، الدمام 32232",
    viewMap:"عرض على الخريطة",
    name:"الاسم الكامل", displayName:"اسم العرض", dept:"القسم",
    role:"الدور", location:"الموقع", password:"كلمة المرور",
    userDir:"دليل المستخدمين", editUser:"تعديل المستخدم",
    contactAdmin:"تواصل مع المسؤول لإضافة مدن جديدة"
  }
};

const ROLE_LABELS = {
  admin:"System Administrator", planning:"Planning",
  manager:"Distribution Center Manager", driver:"Delivery Driver", viewonly:"View Only"
};

const EMPTY_VEH = { plate:"", type:"Dyna", dc:"Riyadh", brand:"", model:"", chassis:"", year:"", fahas:"", istimara:"", insurance:"", fuelCapacity:80, mileage:12, nextOilKM:"", nextOilDate:"" };
const EMPTY_DRV = { name:"", mobile:"", dc:"Riyadh", licNo:"", licExp:"", driverCard:"", driverCardExp:"", status:"Active" };

const DC_INFO = [
  { dc:"Riyadh", manager:"AlWaleed Qahtani", lat:"24.7136", lng:"46.6753" },
  { dc:"Jeddah", manager:"Muhammad Anas", lat:"21.4858", lng:"39.1925" },
  { dc:"Dammam", manager:"Muhammad Saleh", lat:"26.4207", lng:"50.0888" },
];

export default function MasterData({ vehicles, setVehicles, users, setUsers, lang, user }) {
  const [tab, setTab] = useState("vehicles");
  const [done, setDone] = useState("");
  const rtl = lang === "ar";
  const t = T[lang] || T.en;
  const isAdmin = user.role === "admin";

  const tabs = [
    ["vehicles","🚗",t.vehicles],
    ["drivers","👤",t.drivers],
    ["dcs","📍",t.dcLocs],
    ["storage","🌡️",t.storage],
    ["cities","🌆",t.cities],
    ...(isAdmin ? [["allusers","👥",t.allUsers]] : []),
  ];

  function flash(msg) { setDone(msg); setTimeout(()=>setDone(""),3000); }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done && <SuccessMsg msg={done} />}
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      {tab==="vehicles" && <VehiclesTab vehicles={vehicles} setVehicles={setVehicles} setDone={flash} t={t} isAdmin={isAdmin} userDC={user.dc} />}
      {tab==="drivers" && <DriversTab users={users} setUsers={setUsers} setDone={flash} t={t} isAdmin={isAdmin} userDC={user.dc} />}
      {tab==="dcs" && <DCsTab t={t} />}
      {tab==="storage" && <StorageTab t={t} />}
      {tab==="cities" && <CitiesTab t={t} />}
      {tab==="allusers" && isAdmin && <AllUsersTab users={users} setUsers={setUsers} setDone={flash} t={t} />}
    </div>
  );
}

function VehiclesTab({ vehicles, setVehicles, setDone, t, isAdmin, userDC }) {
  const [showAdd, setShowAdd] = useState(false);
  const [f, setF] = useState(EMPTY_VEH);
  const [photos, setPhotos] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [editPlate, setEditPlate] = useState(null);
  const photoRef = useRef();

  const myVehicles = userDC ? vehicles.filter(v=>v.dc===userDC) : vehicles;

  function handlePhotos(e) {
    const files = Array.from(e.target.files).slice(0,4);
    Promise.all(files.map(file=>new Promise(res=>{const r=new FileReader();r.onload=ev=>res(ev.target.result);r.readAsDataURL(file);}))).then(setPhotos);
  }

  function aiVerify() {
    if (!photos.length) { setAiStatus("noplate"); return; }
    setAiStatus("checking");
    setTimeout(()=>setAiStatus(f.plate&&f.plate.length>2?"match":"mismatch"),1500);
  }

  function add() {
    if (!f.plate) return;
    setVehicles(prev=>[...prev,{...f,status:"Active",fuelLevel:f.fuelCapacity,totalKM:0,maintHistory:[],photos}]);
    setDone(f.plate+" added!");
    setShowAdd(false); setF(EMPTY_VEH); setPhotos([]); setAiStatus(null);
  }

  function toggleStatus(plate) {
    setVehicles(prev=>prev.map(v=>v.plate===plate?{...v,status:v.status==="Active"?"Maintenance":"Active"}:v));
  }

  function toggleDC(plate,dc) {
    setVehicles(prev=>prev.map(v=>v.plate===plate?{...v,dc}:v));
    setDone(plate+" transferred to "+dc);
  }

  // Summary per DC
  function DCVehBox({ dc, color }) {
    const dv = vehicles.filter(v=>v.dc===dc);
    const active = dv.filter(v=>v.status==="Active").length;
    const maint = dv.filter(v=>v.status==="Maintenance").length;
    const expiring = dv.filter(v=>{
      if (!v.fahas) return false;
      const days = Math.ceil((new Date(v.fahas)-new Date())/(1000*60*60*24));
      return days <= 30;
    }).length;
    return (
      <Card style={{ borderTop:`4px solid ${color}` }}>
        <CardTitle style={{ color }}>📍 {dc} Distribution Center</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {[["🚗","Total",dv.length,color],["✅",t.active,active,"#10b981"],["🔧",t.maintenance,maint,"#f59e0b"],["⚠️",t.expired,expiring,"#ef4444"]].map(([icon,label,val,c])=>(
            <div key={label} style={{ textAlign:"center", background:"white", borderRadius:8, padding:"10px 6px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:18, marginBottom:2 }}>{icon}</div>
              <div style={{ fontWeight:800, fontSize:18, color:c }}>{val}</div>
              <div style={{ fontSize:11, color:"#94a3b8" }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:14, color:"#64748b" }}>{myVehicles.length} {t.registered}</div>
        {isAdmin && <Btn small onClick={()=>setShowAdd(!showAdd)}>🚗 {t.addVehicle}</Btn>}
      </div>

      {/* Overall Summary */}
      <Card style={{ borderTop:"4px solid #1A3A5C", marginBottom:16 }}>
        <CardTitle>🚗 All Fleet — Overview</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:10 }}>
          {[["🚗","Total",myVehicles.length,"#6366f1"],["✅",t.active,myVehicles.filter(v=>v.status==="Active").length,"#10b981"],["🔧",t.maintenance,myVehicles.filter(v=>v.status==="Maintenance").length,"#f59e0b"],["⚠️","Expiring Soon",myVehicles.filter(v=>{if(!v.fahas)return false;return Math.ceil((new Date(v.fahas)-new Date())/(1000*60*60*24))<=30;}).length,"#ef4444"]].map(([icon,label,val,c])=>(
            <div key={label} style={{ textAlign:"center", background:"#f8fafc", borderRadius:8, padding:"12px 6px" }}>
              <div style={{ fontSize:20, marginBottom:2 }}>{icon}</div>
              <div style={{ fontWeight:900, fontSize:22, color:c }}>{val}</div>
              <div style={{ fontSize:11, color:"#94a3b8" }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* DC Boxes — Admin sees all 3 */}
      {!userDC && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:16 }}>
          <DCVehBox dc="Riyadh" color="#1A3A5C" />
          <DCVehBox dc="Jeddah" color="#0f766e" />
          <DCVehBox dc="Dammam" color="#7c3aed" />
        </div>
      )}

      {showAdd && isAdmin && (
        <Card>
          <CardTitle>➕ {t.addVehicle}</CardTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
            <Input label={t.plate+" *"} value={f.plate} onChange={v=>setF({...f,plate:v})} required />
            <Select label={t.type+" *"} value={f.type} onChange={v=>setF({...f,type:v})} options={["Dyna","Bus"]} />
            <Select label={t.homeDC+" *"} value={f.dc} onChange={v=>setF({...f,dc:v})} options={DCS} />
            <Input label={t.brand} value={f.brand} onChange={v=>setF({...f,brand:v})} placeholder="Toyota" />
            <Input label={t.model} value={f.model} onChange={v=>setF({...f,model:v})} placeholder="Dyna 300" />
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
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:8 }}>📸 {t.photos}</label>
            <input ref={photoRef} type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display:"none" }} />
            <Btn small onClick={()=>photoRef.current.click()} color="#6366f1">📸 {t.uploadPhoto}</Btn>
            {photos.length>0&&(
              <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
                {photos.map((p,i)=><img key={i} src={p} alt={"v"+i} style={{ width:100, height:75, objectFit:"cover", borderRadius:8, border:"2px solid #e2e8f0" }} />)}
              </div>
            )}
          </div>
          <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:8, padding:"12px 14px", marginBottom:16 }}>
            <div style={{ fontWeight:600, fontSize:13, color:"#0369a1", marginBottom:8 }}>🤖 {t.aiCheck}</div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <Btn small onClick={aiVerify} color="#0369a1" disabled={aiStatus==="checking"}>{aiStatus==="checking"?t.aiChecking:"✔️ "+t.aiCheck}</Btn>
              {aiStatus==="match"&&<span style={{ color:"#065f46", fontWeight:600, fontSize:13 }}>{t.aiMatch}</span>}
              {aiStatus==="mismatch"&&<span style={{ color:"#991b1b", fontWeight:600, fontSize:13 }}>{t.aiMismatch}</span>}
              {aiStatus==="noplate"&&<span style={{ color:"#92400e", fontSize:13 }}>{t.aiNoPlate}</span>}
            </div>
          </div>
          <Btn onClick={add} color="#10b981" style={{ width:"100%" }}>✅ {t.addBtn}</Btn>
        </Card>
      )}

      {DCS.filter(dc=>!userDC||dc===userDC).map(dc=>{
        const dv = vehicles.filter(v=>v.dc===dc);
        if (!dv.length) return null;
        return (
          <Card key={dc}>
            <CardTitle>📍 {dc} Distribution Center — {dv.length} {t.vehicles}</CardTitle>
            {dv.map(v=>(
              <div key={v.plate} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"12px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{v.plate} <span style={{ fontSize:12, color:"#64748b" }}>({v.type}) {v.brand} {v.model}</span></div>
                  <div style={{ fontSize:11, color:"#94a3b8", marginBottom:6 }}>{t.fahas}: {v.fahas||"-"} | {t.insurance}: {v.insurance||"-"}</div>
                  {(v.photos||[]).length>0&&(
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {v.photos.map((p,i)=><img key={i} src={p} alt={"p"+i} style={{ width:70, height:52, objectFit:"cover", borderRadius:6, border:"1px solid #e2e8f0" }} />)}
                    </div>
                  )}
                </div>
                <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99, background:v.status==="Maintenance"?"#fef3c7":"#d1fae5", color:v.status==="Maintenance"?"#92400e":"#065f46" }}>{v.status}</span>
                {isAdmin&&(
                  <select value={v.dc} onChange={e=>toggleDC(v.plate,e.target.value)}
                    style={{ border:"1px solid #e2e8f0", borderRadius:6, padding:"5px 8px", fontSize:12, cursor:"pointer" }}>
                    {DCS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                )}
                <Btn small onClick={()=>toggleStatus(v.plate)} color={v.status==="Active"?"#f59e0b":"#10b981"}>
                  {v.status==="Active"?"🔧 Maintenance":"✅ Activate"}
                </Btn>
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}

function DriversTab({ users, setUsers, setDone, t, isAdmin, userDC }) {
  const [showAdd, setShowAdd] = useState(false);
  const [f, setF] = useState(EMPTY_DRV);
  const [editId, setEditId] = useState(null);

  const drivers = users.filter(u=>u.role==="driver"&&(!userDC||u.dc===userDC));

  function DCDrvBox({ dc, color }) {
    const dv = drivers.filter(d=>d.dc===dc);
    const active = dv.filter(d=>d.status==="Active").length;
    const inactive = dv.filter(d=>d.status==="Inactive").length;
    const leave = dv.filter(d=>d.status==="On Leave").length;
    const expiring = dv.filter(d=>{
      if (!d.licExp) return false;
      return Math.ceil((new Date(d.licExp)-new Date())/(1000*60*60*24))<=30;
    }).length;
    return (
      <Card style={{ borderTop:`4px solid ${color}` }}>
        <CardTitle style={{ color }}>📍 {dc} Distribution Center</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {[["👤","Total",dv.length,color],["✅",t.active,active,"#10b981"],["🏖️",t.onLeave,leave,"#f59e0b"],["⚠️",t.expired,expiring,"#ef4444"]].map(([icon,label,val,c])=>(
            <div key={label} style={{ textAlign:"center", background:"white", borderRadius:8, padding:"10px 6px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:18, marginBottom:2 }}>{icon}</div>
              <div style={{ fontWeight:800, fontSize:18, color:c }}>{val}</div>
              <div style={{ fontSize:11, color:"#94a3b8" }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  function save() {
    if (!f.name||!f.mobile) return;
    if (editId) {
      setUsers(prev=>prev.map(u=>u.uid===editId?{...u,...f}:u));
      setDone(f.name+" updated!");
    } else {
      setUsers(prev=>[...prev,{uid:"d"+Date.now(),...f,role:"driver",email:"",displayName:f.name,phone:f.mobile,viewDC:f.dc,location:"Distribution Center - "+f.dc}]);
      setDone(f.name+" added!");
    }
    setShowAdd(false); setF(EMPTY_DRV); setEditId(null);
  }

  function startEdit(u) {
    setEditId(u.uid);
    setF({name:u.name,mobile:u.phone||u.mobile||"",dc:u.dc||"Riyadh",licNo:u.licNo||"",licExp:u.licExp||"",driverCard:u.driverCard||"",driverCardExp:u.driverCardExp||"",status:u.status||"Active"});
    setShowAdd(true);
  }

  function toggleStatus(uid,current) {
    const next = current==="Active"?"Inactive":current==="Inactive"?"On Leave":"Active";
    setUsers(prev=>prev.map(u=>u.uid===uid?{...u,status:next}:u));
  }

  const allDrvs = users.filter(u=>u.role==="driver");

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:14, color:"#64748b" }}>{drivers.length} drivers</div>
        {isAdmin && <Btn small onClick={()=>{setShowAdd(!showAdd);setEditId(null);setF(EMPTY_DRV);}}>👤 {t.addDriver}</Btn>}
      </div>

      {/* Overall Summary */}
      <Card style={{ borderTop:"4px solid #1A3A5C", marginBottom:16 }}>
        <CardTitle>👤 All Drivers — Overview</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:10 }}>
          {[["👤","Total",allDrvs.length,"#6366f1"],["✅",t.active,allDrvs.filter(d=>d.status==="Active").length,"#10b981"],["🏖️",t.onLeave,allDrvs.filter(d=>d.status==="On Leave").length,"#f59e0b"],["⚠️",t.inactive,allDrvs.filter(d=>d.status==="Inactive").length,"#ef4444"]].map(([icon,label,val,c])=>(
            <div key={label} style={{ textAlign:"center", background:"#f8fafc", borderRadius:8, padding:"12px 6px" }}>
              <div style={{ fontSize:20, marginBottom:2 }}>{icon}</div>
              <div style={{ fontWeight:900, fontSize:22, color:c }}>{val}</div>
              <div style={{ fontSize:11, color:"#94a3b8" }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* DC Boxes */}
      {!userDC && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:16 }}>
          <DCDrvBox dc="Riyadh" color="#1A3A5C" />
          <DCDrvBox dc="Jeddah" color="#0f766e" />
          <DCDrvBox dc="Dammam" color="#7c3aed" />
        </div>
      )}

      {showAdd && (
        <Card>
          <CardTitle>{editId?"✎ Edit Driver":"➕ "+t.addDriver}</CardTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
            <div style={{ gridColumn:"1/-1" }}><Input label={t.driverName+" *"} value={f.name} onChange={v=>setF({...f,name:v})} required /></div>
            <Input label={t.mobile+" *"} value={f.mobile} onChange={v=>setF({...f,mobile:v})} required />
            <Select label={t.homeDC+" *"} value={f.dc} onChange={v=>setF({...f,dc:v})} options={DCS} required />
            <Input label={t.licNo+" *"} value={f.licNo} onChange={v=>setF({...f,licNo:v})} required />
            <Input label={t.licExp+" *"} value={f.licExp} onChange={v=>setF({...f,licExp:v})} type="date" required />
            <Input label={t.driverCard} value={f.driverCard} onChange={v=>setF({...f,driverCard:v})} />
            <Input label={t.driverCardExp} value={f.driverCardExp} onChange={v=>setF({...f,driverCardExp:v})} type="date" />
            <Select label={t.status} value={f.status} onChange={v=>setF({...f,status:v})} options={["Active","On Leave","Inactive"]} />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={save} color="#10b981" style={{ flex:1 }}>✅ {editId?t.save:t.addBtn}</Btn>
            <Btn onClick={()=>{setShowAdd(false);setEditId(null);setF(EMPTY_DRV);}} color="#64748b">{t.cancel}</Btn>
          </div>
        </Card>
      )}

      {DCS.filter(dc=>!userDC||dc===userDC).map(dc=>{
        const dv = users.filter(u=>u.role==="driver"&&u.dc===dc);
        if (!dv.length) return null;
        return (
          <Card key={dc}>
            <CardTitle>📍 {dc} Distribution Center — {dv.length} Drivers</CardTitle>
            {dv.map(d=>(
              <div key={d.uid} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:"#b45309", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:14, flexShrink:0 }}>{d.name.charAt(0)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{d.name}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{d.phone||d.mobile} | {d.dc} DC</div>
                  {d.licNo&&<div style={{ fontSize:11, color:"#6366f1" }}>📄 Lic: {d.licNo} | Exp: {d.licExp}</div>}
                  {d.driverCard&&<div style={{ fontSize:11, color:"#0891b2" }}>📷 Card: {d.driverCard} | Exp: {d.driverCardExp}</div>}
                </div>
                <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99, background:d.status==="Active"?"#d1fae5":d.status==="On Leave"?"#fef3c7":"#fee2e2", color:d.status==="Active"?"#065f46":d.status==="On Leave"?"#92400e":"#991b1b" }}>{d.status||"Active"}</span>
                <div style={{ display:"flex", gap:6 }}>
                  <Btn small onClick={()=>startEdit(d)} color="#6366f1">✎ {t.edit}</Btn>
                  <Btn small onClick={()=>toggleStatus(d.uid,d.status||"Active")} color="#f59e0b">↕ Status</Btn>
                </div>
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}

function DCsTab({ t }) {
  const dcs = [
    { dc:"Riyadh", ...DC_INFO[0], enAddr:t.addressRiyadh, arAddr:t.addressRiyadhAr },
    { dc:"Jeddah", ...DC_INFO[1], enAddr:t.addressJeddah, arAddr:t.addressJeddahAr },
    { dc:"Dammam", ...DC_INFO[2], enAddr:t.addressDammam, arAddr:t.addressDammamAr },
  ];
  return (
    <Card>
      <CardTitle>📍 {t.dcTitle}</CardTitle>
      {dcs.map(d=>(
        <div key={d.dc} style={{ border:"1px solid #e2e8f0", borderRadius:8, padding:14, marginBottom:8 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:8 }}>📍 Distribution Center - {d.dc}</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:6, fontSize:13, color:"#374151", marginBottom:8 }}>
            <div><b>Manager:</b> {d.manager}</div>
            <div><b>GPS:</b> {d.lat}, {d.lng}</div>
          </div>
          <div style={{ background:"#f8fafc", borderRadius:6, padding:"8px 12px", marginBottom:6 }}>
            <div style={{ fontSize:13, color:"#374151" }}>🇬🇧 {d.enAddr}</div>
          </div>
          <div style={{ background:"#f0f9ff", borderRadius:6, padding:"8px 12px", marginBottom:8, direction:"rtl" }}>
            <div style={{ fontSize:13, color:"#0369a1" }}>🇸🇦 {d.arAddr}</div>
          </div>
          <a href={"https://maps.google.com/?q="+d.lat+","+d.lng} target="_blank" rel="noreferrer"
            style={{ display:"inline-block", fontSize:12, color:"#6366f1", fontWeight:600 }}>
            📍 {t.viewMap} →
          </a>
        </div>
      ))}
    </Card>
  );
}

function StorageTab({ t }) {
  return (
    <Card>
      <CardTitle>🌡️ {t.storage}</CardTitle>
      {STORAGE_CONDITIONS.map(s=>(
        <div key={s.name} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid #f1f5f9" }}>
          <div style={{ width:14, height:14, borderRadius:"50%", background:s.color, flexShrink:0 }} />
          <div style={{ fontWeight:600, fontSize:14 }}>{s.name} <span style={{ fontSize:13, color:"#64748b", fontWeight:400 }}>({s.range})</span></div>
        </div>
      ))}
    </Card>
  );
}

function CitiesTab({ t }) {
  return (
    <Card>
      <CardTitle>🌆 {t.cities}</CardTitle>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {CITIES.map(c=><span key={c} style={{ background:"#f1f5f9", borderRadius:8, padding:"8px 16px", fontSize:14, fontWeight:600, color:"#374151" }}>📍 {c}</span>)}
      </div>
      <p style={{ fontSize:13, color:"#94a3b8", marginTop:12 }}>{t.contactAdmin}</p>
    </Card>
  );
}

function AllUsersTab({ users, setUsers, setDone, t }) {
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});

  function startEdit(u) {
    setEditId(u.uid);
    setForm({ name:u.name, displayName:u.displayName||"", dept:u.dept||"", role:u.role, location:u.location||"", status:u.status||"Active" });
  }

  function save() {
    setUsers(prev=>prev.map(u=>u.uid===editId?{...u,...form}:u));
    setDone(form.name+" updated!");
    setEditId(null); setForm({});
  }

  function deleteUser(uid) {
    setUsers(prev=>prev.map(u=>u.uid===uid?{...u,status:"Inactive"}:u));
    setDone("User deactivated.");
  }

  return (
    <div>
      <Card>
        <CardTitle>👥 {t.userDir}</CardTitle>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {[t.name,t.displayName,t.dept,t.role,t.location,"Password",t.status,"Actions"].map(h=>(
                  <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"2px solid #e2e8f0", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u,i)=>(
                <tr key={u.uid} style={{ background:i%2===0?"white":"#f8fafc" }}>
                  {editId===u.uid ? (
                    <>
                      <td style={{ padding:"8px 12px" }}><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{ border:"1px solid #e2e8f0", borderRadius:6, padding:"4px 8px", fontSize:13, width:100 }} /></td>
                      <td style={{ padding:"8px 12px" }}><input value={form.displayName} onChange={e=>setForm({...form,displayName:e.target.value})} style={{ border:"1px solid #e2e8f0", borderRadius:6, padding:"4px 8px", fontSize:13, width:100 }} /></td>
                      <td style={{ padding:"8px 12px" }}><input value={form.dept} onChange={e=>setForm({...form,dept:e.target.value})} style={{ border:"1px solid #e2e8f0", borderRadius:6, padding:"4px 8px", fontSize:13, width:80 }} /></td>
                      <td style={{ padding:"8px 12px" }}>
                        <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={{ border:"1px solid #e2e8f0", borderRadius:6, padding:"4px", fontSize:12 }}>
                          {Object.entries(ROLE_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                        </select>
                      </td>
                      <td style={{ padding:"8px 12px" }}><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} style={{ border:"1px solid #e2e8f0", borderRadius:6, padding:"4px 8px", fontSize:13, width:120 }} /></td>
                      <td style={{ padding:"8px 12px", color:"#94a3b8", fontSize:12 }}>spco2026</td>
                      <td style={{ padding:"8px 12px" }}>
                        <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={{ border:"1px solid #e2e8f0", borderRadius:6, padding:"4px", fontSize:12 }}>
                          {["Active","Inactive"].map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding:"8px 12px" }}>
                        <div style={{ display:"flex", gap:4 }}>
                          <Btn small onClick={save} color="#10b981">✅</Btn>
                          <Btn small onClick={()=>{setEditId(null);setForm({});}} color="#64748b">✕</Btn>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding:"10px 12px", fontWeight:600 }}>{u.name}</td>
                      <td style={{ padding:"10px 12px", color:"#64748b" }}>{u.displayName||"-"}</td>
                      <td style={{ padding:"10px 12px", color:"#64748b" }}>{u.dept||"-"}</td>
                      <td style={{ padding:"10px 12px" }}><span style={{ fontSize:12, fontWeight:600, padding:"2px 8px", borderRadius:99, background:"#f1f5f9", color:"#374151" }}>{ROLE_LABELS[u.role]||u.role}</span></td>
                      <td style={{ padding:"10px 12px", color:"#64748b", fontSize:12 }}>{u.location||"-"}</td>
                      <td style={{ padding:"10px 12px", color:"#94a3b8", fontSize:12 }}>••••••••</td>
                      <td style={{ padding:"10px 12px" }}><span style={{ fontSize:12, fontWeight:600, padding:"2px 8px", borderRadius:99, background:u.status==="Active"?"#d1fae5":"#fee2e2", color:u.status==="Active"?"#065f46":"#991b1b" }}>{u.status||"Active"}</span></td>
                      <td style={{ padding:"10px 12px" }}>
                        <div style={{ display:"flex", gap:4 }}>
                          <Btn small onClick={()=>startEdit(u)} color="#6366f1">✎</Btn>
                          <Btn small onClick={()=>deleteUser(u.uid)} color="#ef4444">🗑</Btn>
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
    </div>
  );
}
