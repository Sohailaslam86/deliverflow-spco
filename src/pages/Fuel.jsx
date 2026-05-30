import { useState } from "react";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg, StatCard, TabBar } from "../components/Shared.jsx";
import { DRIVERS_BY_DC, genId } from "../data/masterData.js";

const T = {
  en: {
    vehicleWise:"Vehicle Wise", fuelLogs:"Fuel Logs", efficiency:"Efficiency",
    addLog:"Add Fuel Log", totalLiters:"Total Liters", totalCost:"Total Cost",
    totalKM:"Total KM", avgEff:"Avg Efficiency", vehicle:"Vehicle", driver:"Driver",
    date:"Date", liters:"Liters Added", cost:"Cost (SAR)", tripKM:"Trip KM",
    save:"Save", cancel:"Cancel", currentFuel:"Current Fuel", lastRefill:"Last Refill",
    effTrend:"Efficiency", expected:"Expected Fuel", actual:"Actual Used",
    deviation:"Deviation", fraudAlert:"FRAUD ALERT", normal:"Normal",
    noData:"No fuel data yet", refillHistory:"Refill History",
    allVehicles:"All Vehicles Summary", calcEff:"Calculated efficiency"
  },
  ar: {
    vehicleWise:"حسب المركبة", fuelLogs:"سجلات الوقود", efficiency:"الكفاءة",
    addLog:"إضافة سجل وقود", totalLiters:"إجمالي اللترات", totalCost:"إجمالي التكلفة",
    totalKM:"إجمالي الكيلومترات", avgEff:"متوسط الكفاءة", vehicle:"المركبة",
    driver:"السائق", date:"التاريخ", liters:"اللترات المضافة", cost:"التكلفة (SAR)",
    tripKM:"كيلومترات الرحلة", save:"حفظ", cancel:"إلغاء",
    currentFuel:"الوقود الحالي", lastRefill:"آخر تعبئة", effTrend:"الكفاءة",
    expected:"الوقود المتوقع", actual:"الوقود الفعلي", deviation:"الانحراف",
    fraudAlert:"تحذير احتيال", normal:"طبيعي", noData:"لا توجد بيانات وقود",
    refillHistory:"سجل التعبئة", allVehicles:"ملخص جميع المركبات",
    calcEff:"كفاءة محسوبة"
  }
};

export default function Fuel({ user, fuelLogs, setFuelLogs, vehicles, setVehicles, lang }) {
  const [tab, setTab] = useState("vehicleWise");
  const [showForm, setShowForm] = useState(false);
  const [done, setDone] = useState("");
  const [form, setForm] = useState({ date:new Date().toISOString().split("T")[0], vehicle:"", driver:"", liters:"", sar:"", tripKM:"" });
  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const dc = user.dc||"Riyadh";
  const isAdmin = user.role==="admin";
  const myLogs = isAdmin?fuelLogs:fuelLogs.filter(l=>l.dc===dc);
  const myVehicles = isAdmin?vehicles:vehicles.filter(v=>v.dc===dc);
  const totLiters = myLogs.reduce((s,l)=>s+l.liters,0);
  const totSAR = myLogs.reduce((s,l)=>s+l.sar,0);
  const totKM = myLogs.reduce((s,l)=>s+l.tripKM,0);

  const tabs = [["vehicleWise","🚗",t.vehicleWise],["logs","📋",t.fuelLogs],["efficiency","📊",t.efficiency]];

  function addLog() {
    if (!form.vehicle||!form.liters) return;
    const id = genId("FUEL");
    setFuelLogs(prev=>[...prev,{id,...form,liters:Number(form.liters),sar:Number(form.sar),tripKM:Number(form.tripKM),dc}]);
    setVehicles(prev=>prev.map(v=>v.plate===form.vehicle?{...v,fuelLevel:Math.min((v.fuelLevel||0)+Number(form.liters),v.fuelCapacity||80),totalKM:(v.totalKM||0)+Number(form.tripKM),lastRefillDate:form.date,lastRefillLiters:Number(form.liters)}:v));
    setDone(id+" added!"); setShowForm(false);
    setForm({date:new Date().toISOString().split("T")[0],vehicle:"",driver:"",liters:"",sar:"",tripKM:""});
    setTimeout(()=>setDone(""),3000);
  }

  const vStats = myVehicles.map(v=>{
    const logs = myLogs.filter(l=>l.vehicle===v.plate).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const tL=logs.reduce((s,l)=>s+l.liters,0);
    const tKM=logs.reduce((s,l)=>s+l.tripKM,0);
    const tSAR=logs.reduce((s,l)=>s+l.sar,0);
    const eff=tL>0?(tKM/tL).toFixed(1):"-";
    const expectedFuel=tKM>0&&v.mileage?(tKM/v.mileage).toFixed(1):"-";
    const deviation=tL>0&&expectedFuel!=="-"?(tL-Number(expectedFuel)).toFixed(1):null;
    return {v,logs,tL,tKM,tSAR,eff,expectedFuel,deviation,lastLog:logs[0]||null};
  });

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12, marginBottom:16 }}>
        <StatCard icon="⛽" label={t.totalLiters} value={totLiters+"L"} color="#f59e0b" />
        <StatCard icon="💰" label={t.totalCost} value={"SAR "+totSAR} color="#ef4444" />
        <StatCard icon="🛣️" label={t.totalKM} value={totKM+" km"} color="#6366f1" />
        <StatCard icon="📊" label={t.avgEff} value={totKM&&totLiters?(totKM/totLiters).toFixed(1)+" km/L":"-"} color="#10b981" />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
        <Btn small onClick={()=>setShowForm(!showForm)}>⛽ {t.addLog}</Btn>
      </div>

      {showForm&&(
        <Card>
          <CardTitle>⛽ {t.addLog}</CardTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
            <Input label={"📅 "+t.date} value={form.date} onChange={v=>setForm({...form,date:v})} type="date" />
            <div style={{ marginBottom:12 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:5 }}>🚗 {t.vehicle} *</label>
              <select value={form.vehicle} onChange={e=>setForm({...form,vehicle:e.target.value})}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", background:"white", boxSizing:"border-box" }}>
                <option value="">Select vehicle...</option>
                {myVehicles.map(v=><option key={v.plate} value={v.plate}>{v.plate} — {v.fuelLevel||0}L/{v.fuelCapacity||80}L ({Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100)}%)</option>)}
              </select>
            </div>
            <Select label={"👤 "+t.driver} value={form.driver} onChange={v=>setForm({...form,driver:v})} options={DRIVERS_BY_DC[isAdmin?"Riyadh":dc]||[]} />
            <Input label={"⛽ "+t.liters+" *"} value={form.liters} onChange={v=>setForm({...form,liters:v})} type="number" placeholder="45" required />
            <Input label={"💰 "+t.cost} value={form.sar} onChange={v=>setForm({...form,sar:v})} type="number" placeholder="90" />
            <Input label={"🛣️ "+t.tripKM} value={form.tripKM} onChange={v=>setForm({...form,tripKM:v})} type="number" placeholder="350" />
          </div>
          {form.liters&&form.tripKM&&<div style={{ background:"#f0fdf4", padding:"8px 14px", borderRadius:8, fontSize:13, marginBottom:12 }}>📊 {t.calcEff}: <b>{(Number(form.tripKM)/Number(form.liters)).toFixed(1)} km/L</b></div>}
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={addLog} color="#10b981" disabled={!form.vehicle||!form.liters}>✅ {t.save}</Btn>
            <Btn onClick={()=>setShowForm(false)} color="#64748b">{t.cancel}</Btn>
          </div>
        </Card>
      )}

      {tab==="vehicleWise"&&(
        <div>
          <Card style={{ borderTop:"4px solid #1A3A5C", marginBottom:16 }}>
            <CardTitle>🚗 {t.allVehicles}</CardTitle>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#f8fafc" }}>
                    {[t.vehicle,"DC",t.currentFuel,t.lastRefill,t.effTrend].map(h=>(
                      <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"2px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vStats.map(({v,eff,lastLog})=>(
                    <tr key={v.plate} style={{ borderBottom:"1px solid #f1f5f9" }}>
                      <td style={{ padding:"10px 12px", fontWeight:700, color:"#6366f1" }}>{v.plate}</td>
                      <td style={{ padding:"10px 12px", color:"#64748b" }}>{v.dc}</td>
                      <td style={{ padding:"10px 12px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ flex:1, background:"#f1f5f9", borderRadius:99, height:6, overflow:"hidden", minWidth:60 }}>
                            <div style={{ width:`${Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100)}%`, height:"100%", background:(v.fuelLevel||0)/(v.fuelCapacity||80)<0.25?"#ef4444":"#10b981" }} />
                          </div>
                          <span style={{ fontSize:12, fontWeight:600 }}>{v.fuelLevel||0}L</span>
                        </div>
                      </td>
                      <td style={{ padding:"10px 12px", color:"#64748b" }}>{lastLog?lastLog.date+" ("+lastLog.liters+"L)":"-"}</td>
                      <td style={{ padding:"10px 12px", fontWeight:700, color:Number(eff)>=10?"#10b981":Number(eff)>=7?"#f59e0b":"#ef4444" }}>{eff} km/L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {vStats.filter(s=>s.logs.length>0).map(({v,logs,tL,tKM,tSAR,eff,expectedFuel,deviation,lastLog})=>(
            <Card key={v.plate}>
              <CardTitle>🚗 {v.plate} <span style={{ fontSize:12, color:"#64748b", fontWeight:400 }}>({v.type}) {v.dc} DC</span></CardTitle>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:8, marginBottom:12 }}>
                <StatCard icon="⛽" label={t.currentFuel} value={(v.fuelLevel||0)+"L"} color="#0891b2" />
                <StatCard icon="🛣️" label={t.totalKM} value={tKM+"km"} color="#6366f1" />
                <StatCard icon="📊" label={t.effTrend} value={eff+" km/L"} color="#10b981" />
                <StatCard icon="💰" label={t.totalCost} value={"SAR "+tSAR} color="#f59e0b" />
              </div>
              {deviation!==null&&(
                <div style={{ background:Math.abs(Number(deviation))>5?"#fee2e2":"#d1fae5", borderRadius:8, padding:"8px 14px", fontSize:13, fontWeight:600, color:Math.abs(Number(deviation))>5?"#991b1b":"#065f46", marginBottom:12 }}>
                  {Math.abs(Number(deviation))>5?"⚠️ "+t.fraudAlert+": "+t.expected+" "+expectedFuel+"L vs "+t.actual+" "+tL+"L":"✅ "+t.normal+" ("+t.deviation+": "+Number(deviation).toFixed(1)+"L)"}
                </div>
              )}
              <div style={{ fontWeight:600, fontSize:13, marginBottom:6 }}>📜 {t.refillHistory}</div>
              {logs.slice(0,5).map(log=>(
                <div key={log.id} style={{ display:"flex", gap:12, padding:"6px 0", borderBottom:"1px solid #f1f5f9", fontSize:12, flexWrap:"wrap" }}>
                  <span style={{ color:"#64748b" }}>📅 {log.date}</span>
                  <span>👤 {log.driver||"-"}</span>
                  <span style={{ color:"#f59e0b", fontWeight:600 }}>⛽ +{log.liters}L</span>
                  <span style={{ color:"#ef4444" }}>💰 SAR {log.sar}</span>
                  <span>🛣️ {log.tripKM}km</span>
                  <span style={{ fontWeight:700, color:"#10b981" }}>{log.liters>0?(log.tripKM/log.liters).toFixed(1):"—"} km/L</span>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}

      {tab==="logs"&&(
        <Card>
          <CardTitle>📋 {t.fuelLogs} ({myLogs.length})</CardTitle>
          {myLogs.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>{t.noData}</div>}
          {[...myLogs].reverse().map(log=>(
            <div key={log.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
              <span style={{ fontWeight:700, fontSize:13, color:"#6366f1", minWidth:90 }}>{log.vehicle}</span>
              <span style={{ fontSize:13, flex:1, minWidth:100 }}>{log.driver||"-"}</span>
              <span>⛽ {log.liters}L</span>
              <span>💰 SAR {log.sar}</span>
              <span>🛣️ {log.tripKM}km</span>
              <span style={{ fontWeight:700, color:"#10b981" }}>{log.liters>0?(log.tripKM/log.liters).toFixed(1):"-"} km/L</span>
              <span style={{ color:"#94a3b8", fontSize:12 }}>📅 {log.date}</span>
            </div>
          ))}
        </Card>
      )}

      {tab==="efficiency"&&(
        <Card>
          <CardTitle>📊 {t.efficiency} & Fraud Detection</CardTitle>
          {vStats.filter(s=>s.tL>0).length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>{t.noData}</div>}
          {vStats.filter(s=>s.tL>0).map(({v,tL,tKM,tSAR,eff,expectedFuel,deviation})=>(
            <div key={v.plate} style={{ padding:"12px 0", borderBottom:"1px solid #f1f5f9" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6, marginBottom:6 }}>
                <span style={{ fontWeight:700, fontSize:14 }}>{v.plate} <span style={{ fontSize:12, color:"#64748b" }}>({v.type}) {v.dc}</span></span>
                <span style={{ fontWeight:800, fontSize:18, color:Number(eff)>=10?"#10b981":Number(eff)>=7?"#f59e0b":"#ef4444" }}>{eff} km/L</span>
              </div>
              <div style={{ display:"flex", gap:16, fontSize:13, color:"#64748b", flexWrap:"wrap", marginBottom:6 }}>
                <span>⛽ {t.actual}: {tL}L</span><span>🛣️ {tKM}km</span>
                <span>💰 SAR {tSAR}</span><span>📊 {t.expected}: {expectedFuel}L</span>
              </div>
              {deviation!==null&&(
                <div style={{ fontSize:12, fontWeight:600, padding:"6px 10px", borderRadius:6, background:Math.abs(Number(deviation))>5?"#fee2e2":"#d1fae5", color:Math.abs(Number(deviation))>5?"#991b1b":"#065f46" }}>
                  {Math.abs(Number(deviation))>5?"⚠️ "+t.fraudAlert+": "+Number(deviation).toFixed(1)+"L discrepancy":"✅ "+t.normal+" ("+t.deviation+": "+Number(deviation).toFixed(1)+"L)"}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
