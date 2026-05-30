import { useState } from "react";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg, TabBar, StatCard } from "../components/Shared.jsx";
import { MAINTENANCE_TYPES, DCS } from "../data/masterData.js";

const T = {
  en: {
    vehicles:"Vehicles", drivers:"Drivers", maintenance:"Maintenance Log",
    allFleet:"All Fleet — Overview", total:"Total", active:"Active",
    inMaint:"In Maintenance", avgFuel:"Avg Fuel", expiryAlerts:"Expiry Alerts",
    fuelLevel:"Fuel Level", totalKM:"Total KM", mileage:"Mileage",
    fahas:"Fahas", nextOil:"Next Oil", insurance:"Insurance",
    sendMaint:"Send to Maintenance", reactivate:"Reactivate",
    noMaint:"No maintenance history", onLeave:"On Leave", inactive:"Inactive",
    expired:"Expiring Soon", driverName:"Driver",
    allDrivers:"All Drivers — Overview",
    riyadhDC:"Riyadh Distribution Center",
    jeddahDC:"Jeddah Distribution Center",
    dammamDC:"Dammam Distribution Center",
    maintType:"Type", cost:"Cost (SAR)", startDate:"Start Date",
    returnDate:"Expected Return", notes:"Notes",
    confirm:"Confirm", cancel:"Cancel"
  },
  ar: {
    vehicles:"المركبات", drivers:"السائقون", maintenance:"سجل الصيانة",
    allFleet:"جميع الأسطول — نظرة عامة", total:"الإجمالي",
    active:"نشط", inMaint:"في الصيانة", avgFuel:"متوسط الوقود",
    expiryAlerts:"تنبيهات الانتهاء", fuelLevel:"مستوى الوقود",
    totalKM:"إجمالي الكيلومترات", mileage:"كفاءة الوقود",
    fahas:"الفحص", nextOil:"تغيير الزيت", insurance:"التأمين",
    sendMaint:"إرسال للصيانة", reactivate:"إعادة التفعيل",
    noMaint:"لا يوجد سجل صيانة", onLeave:"إجازة", inactive:"غير نشط",
    expired:"ينتهي قريباً", driverName:"السائق",
    allDrivers:"جميع السائقون — نظرة عامة",
    riyadhDC:"مركز توزيع الرياض",
    jeddahDC:"مركز توزيع جدة",
    dammamDC:"مركز توزيع الدمام",
    maintType:"النوع", cost:"التكلفة (SAR)",
    startDate:"تاريخ البدء", returnDate:"تاريخ العودة",
    notes:"ملاحظات", confirm:"تأكيد", cancel:"إلغاء"
  }
};

function dcLabel(dc, t) {
  if (dc==="Riyadh") return t.riyadhDC;
  if (dc==="Jeddah") return t.jeddahDC;
  return t.dammamDC;
}

const DC_COLORS = { Riyadh:"#1A3A5C", Jeddah:"#0f766e", Dammam:"#7c3aed" };

export default function Fleet({ user, vehicles, setVehicles, users, lang }) {
  const [tab, setTab] = useState("vehicles");
  const [done, setDone] = useState("");
  const rtl = lang === "ar";
  const t = T[lang] || T.en;
  const dc = user.dc;
  const isAdmin = user.role === "admin";

  const tabs = [
    ["vehicles","🚗",t.vehicles],
    ["drivers","👤",t.drivers],
    ["maintenance","🔧",t.maintenance],
  ];

  function flash(msg) { setDone(msg); setTimeout(()=>setDone(""),3000); }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      {tab==="vehicles"&&<VehiclesTab vehicles={vehicles} setVehicles={setVehicles} setDone={flash} t={t} dc={dc} isAdmin={isAdmin} user={user} />}
      {tab==="drivers"&&<DriversTab users={users} t={t} dc={dc} isAdmin={isAdmin} />}
      {tab==="maintenance"&&<MaintTab vehicles={vehicles} setVehicles={setVehicles} setDone={flash} t={t} dc={dc} user={user} />}
    </div>
  );
}

function VehiclesTab({ vehicles, setVehicles, setDone, t, dc, isAdmin, user }) {
  const [showMaint, setShowMaint] = useState(null);
  const [maintForm, setMaintForm] = useState({ type:"Scheduled Service", startDate:"", returnDate:"", cost:"", notes:"" });

  const myVehicles = dc ? vehicles.filter(v=>v.dc===dc) : vehicles;
  const totalV = myVehicles.length;
  const activeV = myVehicles.filter(v=>v.status==="Active").length;
  const maintV = myVehicles.filter(v=>v.status==="Maintenance").length;
  const avgFuel = totalV>0?Math.round(myVehicles.reduce((s,v)=>s+(v.fuelLevel||0),0)/totalV):0;

  function sendMaint(plate) {
    setVehicles(prev=>prev.map(v=>v.plate===plate?{...v,status:"Maintenance",maintHistory:[...(v.maintHistory||[]),{...maintForm,date:new Date().toLocaleDateString(),addedBy:user.name}]}:v));
    setShowMaint(null);
    setDone(plate+" sent to maintenance");
  }

  function reactivate(plate) {
    setVehicles(prev=>prev.map(v=>v.plate===plate?{...v,status:"Active"}:v));
    setDone(plate+" reactivated");
  }

  // Expiry alerts
  const alerts = myVehicles.filter(v=>{
    if (!v.fahas) return false;
    return Math.ceil((new Date(v.fahas)-new Date())/(1000*60*60*24))<=60;
  });

  function DCVehBox({ dcName }) {
    const color = DC_COLORS[dcName];
    const dv = vehicles.filter(v=>v.dc===dcName);
    const act = dv.filter(v=>v.status==="Active").length;
    const mnt = dv.filter(v=>v.status==="Maintenance").length;
    const exp = dv.filter(v=>{if(!v.fahas)return false;return Math.ceil((new Date(v.fahas)-new Date())/(1000*60*60*24))<=30;}).length;
    return (
      <Card style={{ borderTop:`4px solid ${color}` }}>
        <CardTitle style={{ color }}>📍 {dcLabel(dcName,t)}</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {[["🚗","Total",dv.length,color],["✅",t.active,act,"#10b981"],["🔧",t.inMaint,mnt,"#f59e0b"],["⚠️",t.expired,exp,"#ef4444"]].map(([icon,label,val,c])=>(
            <div key={label} style={{ textAlign:"center", background:"white", borderRadius:8, padding:"10px 4px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:16 }}>{icon}</div>
              <div style={{ fontWeight:800, fontSize:18, color:c }}>{val}</div>
              <div style={{ fontSize:10, color:"#94a3b8" }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div>
      {alerts.length>0&&(
        <Card style={{ border:"1px solid #fbbf24", marginBottom:16 }}>
          <CardTitle>⚠️ {t.expiryAlerts}</CardTitle>
          {alerts.map(v=>{
            const days = Math.ceil((new Date(v.fahas)-new Date())/(1000*60*60*24));
            return <div key={v.plate} style={{ padding:"6px 0", borderBottom:"1px solid #f1f5f9", fontSize:13, color:days<0?"#991b1b":"#92400e" }}>🔔 {v.plate} — Fahas: {v.fahas} ({days<0?Math.abs(days)+"d EXPIRED":days+"d left"})</div>;
          })}
        </Card>
      )}

      {/* Overall Summary */}
      <Card style={{ borderTop:"4px solid #1A3A5C", marginBottom:16 }}>
        <CardTitle>🚗 {t.allFleet}</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10 }}>
          <StatCard icon="🚗" label={t.total} value={totalV} color="#6366f1" />
          <StatCard icon="✅" label={t.active} value={activeV} color="#10b981" />
          <StatCard icon="🔧" label={t.inMaint} value={maintV} color="#f59e0b" />
          <StatCard icon="⛽" label={t.avgFuel} value={avgFuel+"L"} color="#0891b2" />
        </div>
      </Card>

      {/* 3 DC Boxes — Admin sees all */}
      {!dc&&(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:16 }}>
          <DCVehBox dcName="Riyadh" />
          <DCVehBox dcName="Jeddah" />
          <DCVehBox dcName="Dammam" />
        </div>
      )}

      {/* Vehicle List */}
      {DCS.filter(d=>!dc||d===dc).map(d=>{
        const dv = myVehicles.filter(v=>v.dc===d);
        if (!dv.length) return null;
        return (
          <Card key={d}>
            <CardTitle>📍 {dcLabel(d,t)} — {dv.length} {t.vehicles}</CardTitle>
            {dv.map(v=>(
              <div key={v.plate} style={{ border:`1px solid ${v.status==="Maintenance"?"#fbbf24":"#e2e8f0"}`, borderRadius:8, padding:12, marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                  <div>
                    <span style={{ fontWeight:700, fontSize:15 }}>{v.plate}</span>
                    <span style={{ fontSize:13, color:"#64748b", marginLeft:8 }}>({v.type}) {v.brand} {v.model}</span>
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99, background:v.status==="Maintenance"?"#fef3c7":"#d1fae5", color:v.status==="Maintenance"?"#92400e":"#065f46" }}>{v.status}</span>
                </div>
                <div style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748b", marginBottom:3 }}>
                    <span>⛽ {t.fuelLevel}: {v.fuelLevel||0}L / {v.fuelCapacity||80}L</span>
                    <span>{Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100)}%</span>
                  </div>
                  <div style={{ background:"#f1f5f9", borderRadius:99, height:6, overflow:"hidden" }}>
                    <div style={{ width:`${Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100)}%`, height:"100%", background:(v.fuelLevel||0)/(v.fuelCapacity||80)<0.25?"#ef4444":"#10b981", borderRadius:99 }} />
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:4, fontSize:12, color:"#64748b", marginBottom:8 }}>
                  <span>🛣️ {t.totalKM}: {(v.totalKM||0).toLocaleString()}</span>
                  <span>📊 {v.mileage||12} km/L</span>
                  {v.fahas&&<span>🔧 {t.fahas}: {v.fahas}</span>}
                  {v.nextOilKM&&<span>🔩 {t.nextOil}: {v.nextOilKM} KM</span>}
                  {v.insurance&&<span>🛡️ {t.insurance}: {v.insurance}</span>}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {v.status==="Active"?(
                    <Btn small onClick={()=>{setShowMaint(v.plate);setMaintForm({type:"Scheduled Service",startDate:"",returnDate:"",cost:"",notes:""});}} color="#f59e0b">🔧 {t.sendMaint}</Btn>
                  ):(
                    <Btn small onClick={()=>reactivate(v.plate)} color="#10b981">✅ {t.reactivate}</Btn>
                  )}
                </div>
                {showMaint===v.plate&&(
                  <div style={{ marginTop:10, padding:12, background:"#f8fafc", borderRadius:8 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
                      <Select label={t.maintType} value={maintForm.type} onChange={v=>setMaintForm({...maintForm,type:v})} options={MAINTENANCE_TYPES} />
                      <Input label={t.cost} value={maintForm.cost} onChange={v=>setMaintForm({...maintForm,cost:v})} type="number" />
                      <Input label={t.startDate} value={maintForm.startDate} onChange={v=>setMaintForm({...maintForm,startDate:v})} type="date" />
                      <Input label={t.returnDate} value={maintForm.returnDate} onChange={v=>setMaintForm({...maintForm,returnDate:v})} type="date" />
                      <div style={{ gridColumn:"1/-1" }}><Input label={t.notes} value={maintForm.notes} onChange={v=>setMaintForm({...maintForm,notes:v})} /></div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <Btn small onClick={()=>sendMaint(v.plate)} color="#f59e0b">✅ {t.confirm}</Btn>
                      <Btn small onClick={()=>setShowMaint(null)} color="#64748b">{t.cancel}</Btn>
                    </div>
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

function DriversTab({ users, t, dc, isAdmin }) {
  const allDrv = users.filter(u=>u.role==="driver");
  const myDrv = dc ? allDrv.filter(d=>d.dc===dc) : allDrv;

  function DCDrvBox({ dcName }) {
    const color = DC_COLORS[dcName];
    const dv = allDrv.filter(d=>d.dc===dcName);
    const act = dv.filter(d=>d.status==="Active").length;
    const leave = dv.filter(d=>d.status==="On Leave").length;
    const inact = dv.filter(d=>d.status==="Inactive").length;
    const exp = dv.filter(d=>{if(!d.licExp)return false;return Math.ceil((new Date(d.licExp)-new Date())/(1000*60*60*24))<=30;}).length;
    return (
      <Card style={{ borderTop:`4px solid ${color}` }}>
        <CardTitle style={{ color }}>📍 {dcLabel(dcName,t)}</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {[["👤","Total",dv.length,color],["✅",t.active,act,"#10b981"],["🏖️",t.onLeave,leave,"#f59e0b"],["⚠️",t.expired,exp,"#ef4444"]].map(([icon,label,val,c])=>(
            <div key={label} style={{ textAlign:"center", background:"white", borderRadius:8, padding:"10px 4px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:16 }}>{icon}</div>
              <div style={{ fontWeight:800, fontSize:18, color:c }}>{val}</div>
              <div style={{ fontSize:10, color:"#94a3b8" }}>{label}</div>
            </div>
          ))}
        </div>
        {dv.map(d=>(
          <div key={d.uid} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"#b45309", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:13, flexShrink:0 }}>{d.name.charAt(0)}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:13 }}>{d.name}</div>
              <div style={{ fontSize:11, color:"#64748b" }}>{d.phone||d.mobile}</div>
              {d.licExp&&<div style={{ fontSize:11, color:"#6366f1" }}>Lic Exp: {d.licExp}</div>}
            </div>
            <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:99, background:d.status==="Active"?"#d1fae5":d.status==="On Leave"?"#fef3c7":"#fee2e2", color:d.status==="Active"?"#065f46":d.status==="On Leave"?"#92400e":"#991b1b" }}>{d.status||"Active"}</span>
          </div>
        ))}
      </Card>
    );
  }

  return (
    <div>
      {/* Overall */}
      <Card style={{ borderTop:"4px solid #1A3A5C", marginBottom:16 }}>
        <CardTitle>👤 {t.allDrivers}</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10 }}>
          <StatCard icon="👤" label={t.total} value={allDrv.length} color="#6366f1" />
          <StatCard icon="✅" label={t.active} value={allDrv.filter(d=>d.status==="Active").length} color="#10b981" />
          <StatCard icon="🏖️" label={t.onLeave} value={allDrv.filter(d=>d.status==="On Leave").length} color="#f59e0b" />
          <StatCard icon="⚠️" label={t.inactive} value={allDrv.filter(d=>d.status==="Inactive").length} color="#ef4444" />
        </div>
      </Card>

      {/* DC Boxes */}
      {!dc&&(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:16 }}>
          <DCDrvBox dcName="Riyadh" />
          <DCDrvBox dcName="Jeddah" />
          <DCDrvBox dcName="Dammam" />
        </div>
      )}

      {dc&&(
        <Card>
          <CardTitle>📍 {dcLabel(dc,t)} — {myDrv.length} Drivers</CardTitle>
          {myDrv.map(d=>(
            <div key={d.uid} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:"#b45309", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:14, flexShrink:0 }}>{d.name.charAt(0)}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{d.name}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{d.phone||d.mobile}</div>
                {d.licNo&&<div style={{ fontSize:11, color:"#6366f1" }}>📄 Lic: {d.licNo} | Exp: {d.licExp}</div>}
              </div>
              <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99, background:d.status==="Active"?"#d1fae5":d.status==="On Leave"?"#fef3c7":"#fee2e2", color:d.status==="Active"?"#065f46":d.status==="On Leave"?"#92400e":"#991b1b" }}>{d.status||"Active"}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function MaintTab({ vehicles, setVehicles, setDone, t, dc, user }) {
  const myV = dc ? vehicles.filter(v=>v.dc===dc) : vehicles;
  const withHist = myV.filter(v=>(v.maintHistory||[]).length>0);
  return (
    <Card>
      <CardTitle>🔧 {t.maintenance}</CardTitle>
      {withHist.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>{t.noMaint}</div>}
      {withHist.map(v=>(
        <div key={v.plate} style={{ marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>🚗 {v.plate} ({v.type}) — {v.dc} DC</div>
          {(v.maintHistory||[]).map((m,i)=>(
            <div key={i} style={{ background:"#f8fafc", borderRadius:8, padding:"10px 14px", marginBottom:6, fontSize:13 }}>
              <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:4 }}>
                <span style={{ fontWeight:600 }}>🔧 {m.type}</span>
                <span style={{ color:"#64748b" }}>📅 {m.date}</span>
              </div>
              <div style={{ color:"#64748b", marginTop:2 }}>
                {m.startDate&&<span>Start: {m.startDate} </span>}
                {m.returnDate&&<span>| Return: {m.returnDate} </span>}
                {m.cost&&<span>| SAR {m.cost}</span>}
              </div>
              {m.notes&&<div style={{ color:"#374151", marginTop:2 }}>📝 {m.notes}</div>}
              {m.addedBy&&<div style={{ color:"#94a3b8", fontSize:11, marginTop:2 }}>By: {m.addedBy}</div>}
            </div>
          ))}
        </div>
      ))}
    </Card>
  );
}
