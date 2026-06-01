import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg, StatCard, TabBar } from "../components/Shared.jsx";
import { genId } from "../data/masterData.js";

const T = {
  en: {
    vehicleWise:"Vehicle Wise", fuelLogs:"Fuel Logs", efficiency:"Efficiency",
    addLog:"Add Fuel Log", totalLiters:"Total Liters", totalCost:"Total Cost",
    totalKM:"Total KM", avgEff:"Avg Efficiency", vehicle:"Vehicle", driver:"Driver",
    date:"Date", liters:"Liters Added", cost:"Cost (SAR)", tripKM:"Trip KM",
    save:"Save", cancel:"Cancel", currentFuel:"Current Fuel",
    effTrend:"Efficiency", expected:"Expected Fuel", actual:"Actual Used",
    deviation:"Deviation", deviationAlert:"DEVIATION ALERT", normal:"Normal",
    noData:"No fuel data yet", refillHistory:"Refill History",
    allVehicles:"All Vehicles — Fuel Overview", calcEff:"Calculated efficiency",
    overall:"Overall Fuel Summary",
    riyadhDC:"Riyadh Distribution Center",
    jeddahDC:"Jeddah Distribution Center",
    dammamDC:"Dammam Distribution Center"
  },
  ar: {
    vehicleWise:"حسب المركبة", fuelLogs:"سجلات الوقود", efficiency:"الكفاءة",
    addLog:"إضافة سجل وقود", totalLiters:"إجمالي اللترات", totalCost:"إجمالي التكلفة",
    totalKM:"إجمالي الكيلومترات", avgEff:"متوسط الكفاءة", vehicle:"المركبة",
    driver:"السائق", date:"التاريخ", liters:"اللترات المضافة", cost:"التكلفة (SAR)",
    tripKM:"كيلومترات الرحلة", save:"حفظ", cancel:"إلغاء",
    currentFuel:"الوقود الحالي", effTrend:"الكفاءة",
    expected:"الوقود المتوقع", actual:"الوقود الفعلي", deviation:"الانحراف",
    deviationAlert:"تنبيه انحراف", normal:"طبيعي",
    noData:"لا توجد بيانات وقود", refillHistory:"سجل التعبئة",
    allVehicles:"جميع المركبات", calcEff:"كفاءة محسوبة",
    overall:"ملخص الوقود الإجمالي",
    riyadhDC:"مركز توزيع الرياض",
    jeddahDC:"مركز توزيع جدة",
    dammamDC:"مركز توزيع الدمام"
  }
};

const DC_COLORS = { Riyadh:"#1A3A5C", Jeddah:"#0f766e", Dammam:"#7c3aed" };

function dcLabel(dc, t) {
  if (dc==="Riyadh") return t.riyadhDC;
  if (dc==="Jeddah") return t.jeddahDC;
  return t.dammamDC;
}

// Central DC filter
function getUserDC(user) {
  if (!user.dc || user.dc === "Head Office") return null;
  return user.dc;
}

function DCFuelBox({ dc, fuelLogs, vehicles, t }) {
  const color = DC_COLORS[dc];
  const logs = fuelLogs.filter(l=>l.dc===dc);
  const veh = vehicles.filter(v=>v.dc===dc);
  const tL = logs.reduce((s,l)=>s+(l.liters||0),0);
  const tKM = logs.reduce((s,l)=>s+(l.tripKM||0),0);
  const tSAR = logs.reduce((s,l)=>s+(l.sar||0),0);
  const avgFuel = veh.length>0?Math.round(veh.reduce((s,v)=>s+(v.fuelLevel||0),0)/veh.length):0;
  return (
    <Card style={{ borderTop:`4px solid ${color}` }}>
      <CardTitle style={{ color }}>📍 {dcLabel(dc,t)}</CardTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:8 }}>
        <StatCard icon="⛽" label={t.totalLiters} value={tL+"L"} color="#f59e0b" />
        <StatCard icon="💰" label={t.totalCost} value={"SAR "+tSAR} color="#ef4444" />
        <StatCard icon="🛣️" label={t.totalKM} value={tKM+"km"} color="#6366f1" />
        <StatCard icon="📊" label={t.avgEff} value={tL>0?(tKM/tL).toFixed(1)+" km/L":"-"} color="#10b981" />
      </div>
      <div style={{ fontSize:13, color:"#64748b" }}>⛽ Avg Fuel Level: {avgFuel}L</div>
    </Card>
  );
}

export default function Fuel({ user, fuelLogs, setFuelLogs, vehicles, setVehicles, lang }) {
  const [tab, setTab] = useState("vehicleWise");
  const [showForm, setShowForm] = useState(false);
  const [done, setDone] = useState("");
  const [fsVehicles, setFsVehicles] = useState([]);
  const [fsDrivers, setFsDrivers] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    vehicle:"", driver:"", liters:"", sar:"", tripKM:""
  });

  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const isAdmin = user.role==="admin";

  // DC filter — sirf apna DC
  const userDC = getUserDC(user);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const vSnap = await getDocs(collection(db, "vehicles"));
      setFsVehicles(vSnap.docs.map(d=>({id:d.id,...d.data()})));
      const uSnap = await getDocs(collection(db, "users"));
      setFsDrivers(uSnap.docs.map(d=>({uid:d.id,...d.data()})).filter(u=>u.role==="driver"));
    } catch(e) { console.error(e); }
  }

  const allVehicles = fsVehicles.length>0 ? fsVehicles : vehicles;
  const allDrivers = fsDrivers;

  // Filter by DC
  const myVehicles = userDC ? allVehicles.filter(v=>v.dc===userDC) : allVehicles;
  const myDrivers = userDC ? allDrivers.filter(d=>d.dc===userDC) : allDrivers;
  const myLogs = userDC ? fuelLogs.filter(l=>l.dc===userDC) : fuelLogs;

  const totLiters = myLogs.reduce((s,l)=>s+(l.liters||0),0);
  const totSAR = myLogs.reduce((s,l)=>s+(l.sar||0),0);
  const totKM = myLogs.reduce((s,l)=>s+(l.tripKM||0),0);

  const tabs = [["vehicleWise","🚗",t.vehicleWise],["logs","📋",t.fuelLogs],["efficiency","📊",t.efficiency]];

  function addLog() {
    if (!form.vehicle||!form.liters) return;
    const id = genId("FUEL");
    const dc = userDC || (myVehicles.find(v=>v.plate===form.vehicle)?.dc||"Riyadh");
    setFuelLogs(prev=>[...prev,{id,...form,liters:Number(form.liters),sar:Number(form.sar),tripKM:Number(form.tripKM),dc}]);
    setVehicles(prev=>prev.map(v=>v.plate===form.vehicle?{...v,fuelLevel:Math.min((v.fuelLevel||0)+Number(form.liters),v.fuelCapacity||80),totalKM:(v.totalKM||0)+Number(form.tripKM)}:v));
    setDone(id+" added!"); setShowForm(false);
    setForm({date:new Date().toISOString().split("T")[0],vehicle:"",driver:"",liters:"",sar:"",tripKM:""});
    setTimeout(()=>setDone(""),3000);
  }

  const vStats = myVehicles.map(v=>{
    const logs = myLogs.filter(l=>l.vehicle===v.plate).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const tL=logs.reduce((s,l)=>s+(l.liters||0),0);
    const tKM=logs.reduce((s,l)=>s+(l.tripKM||0),0);
    const tSAR=logs.reduce((s,l)=>s+(l.sar||0),0);
    const eff=tL>0?(tKM/tL).toFixed(1):"-";
    const expectedFuel=tKM>0&&v.mileage?(tKM/v.mileage).toFixed(1):"-";
    const deviation=tL>0&&expectedFuel!=="-"?(tL-Number(expectedFuel)).toFixed(1):null;
    return {v,logs,tL,tKM,tSAR,eff,expectedFuel,deviation,lastLog:logs[0]||null};
  });

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}

      {/* Overall Summary */}
      <Card style={{ borderTop:"4px solid #1A3A5C", marginBottom:16 }}>
        <CardTitle>
          ⛽ {t.overall} — {userDC ? dcLabel(userDC,t) : "All Distribution Centers"}
        </CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12 }}>
          <StatCard icon="⛽" label={t.totalLiters} value={totLiters+"L"} color="#f59e0b" />
          <StatCard icon="💰" label={t.totalCost} value={"SAR "+totSAR} color="#ef4444" />
          <StatCard icon="🛣️" label={t.totalKM} value={totKM+" km"} color="#6366f1" />
          <StatCard icon="📊" label={t.avgEff} value={totKM&&totLiters?(totKM/totLiters).toFixed(1)+" km/L":"-"} color="#10b981" />
        </div>
      </Card>

      {/* DC Boxes — Admin only */}
      {isAdmin&&(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:16 }}>
          <DCFuelBox dc="Riyadh" fuelLogs={fuelLogs} vehicles={allVehicles} t={t} />
          <DCFuelBox dc="Jeddah" fuelLogs={fuelLogs} vehicles={allVehicles} t={t} />
          <DCFuelBox dc="Dammam" fuelLogs={fuelLogs} vehicles={allVehicles} t={t} />
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
        <Btn small onClick={()=>setShowForm(!showForm)}>⛽ {t.addLog}</Btn>
      </div>

      {showForm&&(
        <Card>
          <CardTitle>⛽ {t.addLog}</CardTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#374151", marginBottom:6 }}>📅 {t.date}</label>
              <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none", boxSizing:"border-box" }} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#374151", marginBottom:6 }}>🚗 {t.vehicle} *</label>
              <select value={form.vehicle} onChange={e=>setForm({...form,vehicle:e.target.value})}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none", background:"white", boxSizing:"border-box" }}>
                <option value="">Select vehicle...</option>
                {myVehicles.map(v=><option key={v.plate||v.id} value={v.plate}>{v.plate} — {v.fuelLevel||0}L/{v.fuelCapacity||80}L</option>)}
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#374151", marginBottom:6 }}>👤 {t.driver}</label>
              <select value={form.driver} onChange={e=>setForm({...form,driver:e.target.value})}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none", background:"white", boxSizing:"border-box" }}>
                <option value="">Select driver...</option>
                {myDrivers.map(d=><option key={d.uid} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#374151", marginBottom:6 }}>⛽ {t.liters} *</label>
              <input type="number" value={form.liters} onChange={e=>setForm({...form,liters:e.target.value})} placeholder="45"
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none", boxSizing:"border-box" }} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#374151", marginBottom:6 }}>💰 {t.cost}</label>
              <input type="number" value={form.sar} onChange={e=>setForm({...form,sar:e.target.value})} placeholder="90"
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none", boxSizing:"border-box" }} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#374151", marginBottom:6 }}>🛣️ {t.tripKM}</label>
              <input type="number" value={form.tripKM} onChange={e=>setForm({...form,tripKM:e.target.value})} placeholder="350"
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none", boxSizing:"border-box" }} />
            </div>
          </div>
          {form.liters&&form.tripKM&&(
            <div style={{ background:"#f0fdf4", padding:"10px 14px", borderRadius:8, fontSize:14, marginBottom:14 }}>
              📊 {t.calcEff}: <b>{(Number(form.tripKM)/Number(form.liters)).toFixed(1)} km/L</b>
            </div>
          )}
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={addLog} color="#10b981" disabled={!form.vehicle||!form.liters}>✅ {t.save}</Btn>
            <Btn onClick={()=>setShowForm(false)} color="#64748b">{t.cancel}</Btn>
          </div>
        </Card>
      )}

      {tab==="vehicleWise"&&(
        <div>
          <Card>
            <CardTitle>🚗 {t.allVehicles}</CardTitle>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
                <thead>
                  <tr style={{ background:"#f8fafc" }}>
                    {[t.vehicle,"Distribution Center",t.currentFuel,"Last Refill",t.effTrend].map(h=>(
                      <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"2px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vStats.map(({v,eff,lastLog})=>(
                    <tr key={v.plate||v.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                      <td style={{ padding:"12px 14px", fontWeight:700, color:"#6366f1" }}>{v.plate}</td>
                      <td style={{ padding:"12px 14px", color:"#64748b" }}>{dcLabel(v.dc,t)||v.dc}</td>
                      <td style={{ padding:"12px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ flex:1, background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden", minWidth:60 }}>
                            <div style={{ width:`${Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100)}%`, height:"100%", background:(v.fuelLevel||0)/(v.fuelCapacity||80)<0.25?"#ef4444":"#10b981" }} />
                          </div>
                          <span style={{ fontSize:13, fontWeight:600 }}>{v.fuelLevel||0}L</span>
                        </div>
                      </td>
                      <td style={{ padding:"12px 14px", color:"#64748b" }}>{lastLog?lastLog.date+" ("+lastLog.liters+"L)":"-"}</td>
                      <td style={{ padding:"12px 14px", fontWeight:700, color:Number(eff)>=10?"#10b981":Number(eff)>=7?"#f59e0b":"#ef4444" }}>{eff} km/L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab==="logs"&&(
        <Card>
          <CardTitle>📋 {t.fuelLogs} ({myLogs.length})</CardTitle>
          {myLogs.length===0&&<div style={{ textAlign:"center", padding:24, color:"#94a3b8", fontSize:15 }}>{t.noData}</div>}
          {[...myLogs].reverse().map(log=>(
            <div key={log.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
              <span style={{ fontWeight:700, fontSize:14, color:"#6366f1", minWidth:90 }}>{log.vehicle}</span>
              <span style={{ fontSize:14, flex:1, minWidth:100 }}>{log.driver||"-"}</span>
              <span>⛽ {log.liters}L</span>
              <span>💰 SAR {log.sar}</span>
              <span>🛣️ {log.tripKM}km</span>
              <span style={{ fontWeight:700, color:"#10b981" }}>{log.liters>0?(log.tripKM/log.liters).toFixed(1):"-"} km/L</span>
              <span style={{ color:"#94a3b8", fontSize:13 }}>📅 {log.date}</span>
            </div>
          ))}
        </Card>
      )}

      {tab==="efficiency"&&(
        <Card>
          <CardTitle>📊 {t.efficiency}</CardTitle>
          {vStats.filter(s=>s.tL>0).length===0&&<div style={{ textAlign:"center", padding:24, color:"#94a3b8", fontSize:15 }}>{t.noData}</div>}
          {vStats.filter(s=>s.tL>0).map(({v,tL,tKM,tSAR,eff,expectedFuel,deviation})=>(
            <div key={v.plate||v.id} style={{ padding:"14px 0", borderBottom:"1px solid #f1f5f9" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                <span style={{ fontWeight:700, fontSize:15 }}>{v.plate} <span style={{ fontSize:13, color:"#64748b", fontWeight:400 }}>({v.type}) {dcLabel(v.dc,t)||v.dc}</span></span>
                <span style={{ fontWeight:800, fontSize:20, color:Number(eff)>=10?"#10b981":Number(eff)>=7?"#f59e0b":"#ef4444" }}>{eff} km/L</span>
              </div>
              <div style={{ display:"flex", gap:16, fontSize:14, color:"#64748b", flexWrap:"wrap", marginBottom:8 }}>
                <span>⛽ {t.actual}: {tL}L</span>
                <span>🛣️ {tKM}km</span>
                <span>💰 SAR {tSAR}</span>
                <span>📊 {t.expected}: {expectedFuel}L</span>
              </div>
              {deviation!==null&&(
                <div style={{ fontSize:13, fontWeight:600, padding:"8px 12px", borderRadius:8, background:Math.abs(Number(deviation))>5?"#fee2e2":"#d1fae5", color:Math.abs(Number(deviation))>5?"#991b1b":"#065f46" }}>
                  {Math.abs(Number(deviation))>5?"⚠️ "+t.deviationAlert+": "+Number(deviation).toFixed(1)+"L difference":"✅ "+t.normal+" ("+t.deviation+": "+Number(deviation).toFixed(1)+"L)"}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
