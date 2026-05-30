import { useState } from "react";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg, TabBar, StatCard } from "../components/Shared.jsx";
import { MAINTENANCE_TYPES, DCS } from "../data/masterData.js";

const T = {
  en: {
    overview:"Overview", maintenance:"Maintenance", addVehicle:"Add Vehicle",
    allFleet:"All Fleet Summary", totalVeh:"Total Vehicles", active:"Active",
    inMaint:"In Maintenance", avgFuel:"Avg Fuel", expiryAlerts:"Expiry Alerts",
    fuelLevel:"Fuel Level", totalKM:"Total KM", mileage:"Mileage",
    fahas:"Fahas", nextOil:"Next Oil Change", insurance:"Insurance",
    sendMaint:"Send to Maintenance", reactivate:"Reactivate",
    maintHistory:"Maintenance History", noMaint:"No maintenance history yet",
    plate:"Plate Number", type:"Type", homeDC:"Home DC", brand:"Brand",
    model:"Model", chassis:"Chassis Number", year:"Year",
    fuelCap:"Fuel Capacity (L)", mileageKm:"Mileage (km/L)",
    fahasExp:"Fahas Expiry", istamaraExp:"Istimara Expiry", insExp:"Insurance Expiry",
    nextOilKM:"Next Oil KM", nextOilDate:"Next Oil Date",
    addBtn:"Add Vehicle", confirmMaint:"Confirm", cancel:"Cancel",
    maintType:"Maintenance Type", cost:"Cost (SAR)", startDate:"Start Date",
    returnDate:"Expected Return", notes:"Notes", reactivated:"Reactivated",
    sentMaint:"sent to maintenance", addedMsg:"Vehicle added!"
  },
  ar: {
    overview:"\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629",
    maintenance:"\u0627\u0644\u0635\u064a\u0627\u0646\u0629",
    addVehicle:"\u0625\u0636\u0627\u0641\u0629 \u0645\u0631\u0643\u0628\u0629",
    allFleet:"\u0645\u0644\u062e\u0635 \u0627\u0644\u0623\u0633\u0637\u0648\u0644",
    totalVeh:"\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0631\u0643\u0628\u0627\u062a",
    active:"\u0646\u0634\u0637\u0629", inMaint:"\u0641\u064a \u0627\u0644\u0635\u064a\u0627\u0646\u0629",
    avgFuel:"\u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u0648\u0642\u0648\u062f",
    expiryAlerts:"\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0627\u0646\u062a\u0647\u0627\u0621",
    fuelLevel:"\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0648\u0642\u0648\u062f",
    totalKM:"\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0643\u064a\u0644\u0648\u0645\u062a\u0631\u0627\u062a",
    mileage:"\u0627\u0633\u062a\u0647\u0644\u0627\u0643 \u0627\u0644\u0648\u0642\u0648\u062f",
    fahas:"\u0627\u0644\u0641\u062d\u0635", nextOil:"\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0632\u064a\u062a",
    insurance:"\u0627\u0644\u062a\u0623\u0645\u064a\u0646",
    sendMaint:"\u0625\u0631\u0633\u0627\u0644 \u0644\u0644\u0635\u064a\u0627\u0646\u0629",
    reactivate:"\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0641\u0639\u064a\u0644",
    maintHistory:"\u0633\u062c\u0644 \u0627\u0644\u0635\u064a\u0627\u0646\u0629",
    noMaint:"\u0644\u0627 \u064a\u0648\u062c\u062f \u0633\u062c\u0644 \u0635\u064a\u0627\u0646\u0629",
    plate:"\u0631\u0642\u0645 \u0627\u0644\u0644\u0648\u062d\u0629",
    type:"\u0627\u0644\u0646\u0648\u0639", homeDC:"\u0645\u0631\u0643\u0632 \u0627\u0644\u062a\u0648\u0632\u064a\u0639",
    brand:"\u0627\u0644\u0645\u0627\u0631\u0643\u0629", model:"\u0627\u0644\u0645\u0648\u062f\u064a\u0644",
    chassis:"\u0631\u0642\u0645 \u0627\u0644\u0647\u064a\u0643\u0644",
    year:"\u0633\u0646\u0629 \u0627\u0644\u0635\u0646\u0639",
    fuelCap:"\u0633\u0639\u0629 \u0627\u0644\u062e\u0632\u0627\u0646 (L)",
    mileageKm:"\u0627\u0633\u062a\u0647\u0644\u0627\u0643 \u0627\u0644\u0648\u0642\u0648\u062f (km/L)",
    fahasExp:"\u0627\u0646\u062a\u0647\u0627\u0621 \u0627\u0644\u0641\u062d\u0635",
    istamaraExp:"\u0627\u0646\u062a\u0647\u0627\u0621 \u0627\u0644\u0627\u0633\u062a\u0645\u0627\u0631\u0629",
    insExp:"\u0627\u0646\u062a\u0647\u0627\u0621 \u0627\u0644\u062a\u0623\u0645\u064a\u0646",
    nextOilKM:"\u0643\u064a\u0644\u0648\u0645\u062a\u0631\u0627\u062a \u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0632\u064a\u062a",
    nextOilDate:"\u062a\u0627\u0631\u064a\u062e \u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0632\u064a\u062a",
    addBtn:"\u0625\u0636\u0627\u0641\u0629 \u0645\u0631\u0643\u0628\u0629",
    confirmMaint:"\u062a\u0623\u0643\u064a\u062f", cancel:"\u0625\u0644\u063a\u0627\u0621",
    maintType:"\u0646\u0648\u0639 \u0627\u0644\u0635\u064a\u0627\u0646\u0629",
    cost:"\u0627\u0644\u062a\u0643\u0644\u0641\u0629 (SAR)",
    startDate:"\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0628\u062f\u0621",
    returnDate:"\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0639\u0648\u062f\u0629",
    notes:"\u0645\u0644\u0627\u062d\u0638\u0627\u062a",
    reactivated:"\u062a\u0645 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0641\u0639\u064a\u0644",
    sentMaint:"\u062a\u0645 \u0625\u0631\u0633\u0627\u0644\u0647\u0627 \u0644\u0644\u0635\u064a\u0627\u0646\u0629",
    addedMsg:"\u062a\u0645 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0631\u0643\u0628\u0629"
  }
};

const EMPTY_ADD = { plate:"", type:"Dyna", dc:"Riyadh", brand:"", model:"", chassis:"", year:"", fahas:"", istimara:"", insurance:"", fuelCapacity:80, mileage:12, nextOilKM:"", nextOilDate:"" };

export default function Fleet({ user, vehicles, setVehicles, lang }) {
  const [tab, setTab] = useState("overview");
  const [done, setDone] = useState("");
  const [showMaint, setShowMaint] = useState(null);
  const [maintForm, setMaintForm] = useState({ type:"Scheduled Service", startDate:"", returnDate:"", cost:"", notes:"" });
  const [addForm, setAddForm] = useState(EMPTY_ADD);

  const rtl = lang === "ar";
  const t = T[lang] || T.en;
  const dc = user.dc;
  const myVehicles = dc ? vehicles.filter(v => v.dc === dc) : vehicles;
  const isAdmin = user.role === "admin";

  const tabs = [
    ["overview","\ud83d\ude97",t.overview],
    ["maintenance","\ud83d\udd27",t.maintenance],
    ...(isAdmin ? [["add","\u2795",t.addVehicle]] : [])
  ];

  function flash(msg) { setDone(msg); setTimeout(() => setDone(""), 3000); }

  function sendMaint(plate) {
    setVehicles(prev => prev.map(v => v.plate === plate ? {
      ...v, status:"Maintenance",
      maintHistory:[...(v.maintHistory||[]),{ ...maintForm, date:new Date().toLocaleDateString(), addedBy:user.name }]
    } : v));
    setShowMaint(null);
    flash(plate + " " + t.sentMaint);
  }

  function reactivate(plate) {
    setVehicles(prev => prev.map(v => v.plate === plate ? { ...v, status:"Active" } : v));
    flash(plate + " " + t.reactivated);
  }

  function addVehicle() {
    if (!addForm.plate) return;
    setVehicles(prev => [...prev, { ...addForm, status:"Active", fuelLevel:addForm.fuelCapacity, totalKM:0, maintHistory:[], photos:[] }]);
    setAddForm(EMPTY_ADD);
    flash(t.addedMsg);
    setTab("overview");
  }

  // Expiry alerts
  const alerts = myVehicles.filter(v => {
    if (!v.fahas) return false;
    const days = Math.ceil((new Date(v.fahas) - new Date()) / (1000*60*60*24));
    return days <= 60;
  });

  // Summary stats for all fleet
  const totalV = myVehicles.length;
  const activeV = myVehicles.filter(v => v.status === "Active").length;
  const maintV = myVehicles.filter(v => v.status === "Maintenance").length;
  const avgFuel = totalV > 0 ? Math.round(myVehicles.reduce((s,v) => s+(v.fuelLevel||0),0)/totalV) : 0;

  function DCFleetBox({ dcName, color }) {
    const dcV = vehicles.filter(v => v.dc === dcName);
    if (!dcV.length) return null;
    const act = dcV.filter(v => v.status === "Active").length;
    const mnt = dcV.filter(v => v.status === "Maintenance").length;
    const af = dcV.length > 0 ? Math.round(dcV.reduce((s,v)=>s+(v.fuelLevel||0),0)/dcV.length) : 0;
    return (
      <Card style={{ borderTop:`4px solid ${color}` }}>
        <CardTitle style={{ color }}>\ud83d\udccd {dcName} Distribution Center</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:12 }}>
          <StatCard icon="\ud83d\ude97" label={t.totalVeh} value={dcV.length} color={color} />
          <StatCard icon="\u2705" label={t.active} value={act} color="#10b981" />
          <StatCard icon="\ud83d\udd27" label={t.inMaint} value={mnt} color="#f59e0b" />
          <StatCard icon="\u26fd" label={t.avgFuel} value={af+"L"} color="#0891b2" />
        </div>
        {dcV.map(v => (
          <div key={v.plate} style={{ border:`1px solid ${v.status==="Maintenance"?"#fbbf24":"#e2e8f0"}`, borderRadius:8, padding:12, marginBottom:6 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6, marginBottom:6 }}>
              <span style={{ fontWeight:700 }}>{v.plate} <span style={{ fontSize:12, color:"#64748b" }}>({v.type}) {v.brand} {v.model}</span></span>
              <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99, background:v.status==="Maintenance"?"#fef3c7":"#d1fae5", color:v.status==="Maintenance"?"#92400e":"#065f46" }}>{v.status}</span>
            </div>
            <div style={{ marginBottom:6 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748b", marginBottom:3 }}>
                <span>\u26fd {t.fuelLevel}: {v.fuelLevel||0}L / {v.fuelCapacity||80}L</span>
                <span>{Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100)}%</span>
              </div>
              <div style={{ background:"#f1f5f9", borderRadius:99, height:6, overflow:"hidden" }}>
                <div style={{ width:`${Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100)}%`, height:"100%", background:(v.fuelLevel||0)/(v.fuelCapacity||80)<0.25?"#ef4444":"#10b981", borderRadius:99 }} />
              </div>
            </div>
            <div style={{ display:"flex", gap:12, fontSize:12, color:"#64748b", flexWrap:"wrap" }}>
              {v.fahas&&<span>\ud83d\udd27 {t.fahas}: {v.fahas}</span>}
              {v.insurance&&<span>\ud83d\udee1\ufe0f {t.insurance}: {v.insurance}</span>}
              <span>\ud83d\udee3\ufe0f {v.totalKM||0} KM</span>
            </div>
          </div>
        ))}
      </Card>
    );
  }

  return (
    <div style={{ direction: rtl ? "rtl" : "ltr" }}>
      {done && <SuccessMsg msg={done} />}

      {/* Expiry Alerts */}
      {alerts.length > 0 && (
        <Card style={{ border:"1px solid #fbbf24" }}>
          <CardTitle>\u26a0\ufe0f {t.expiryAlerts}</CardTitle>
          {alerts.map(v => {
            const days = Math.ceil((new Date(v.fahas) - new Date()) / (1000*60*60*24));
            return (
              <div key={v.plate} style={{ padding:"6px 0", borderBottom:"1px solid #f1f5f9", fontSize:13, color:days<0?"#991b1b":"#92400e" }}>
                \ud83d\udd14 {v.plate} — Fahas: {v.fahas} ({days<0?Math.abs(days)+" days EXPIRED":days+" days left"})
              </div>
            );
          })}
        </Card>
      )}

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div>
          {/* Overall Summary Box */}
          <Card style={{ borderTop:"4px solid #1A3A5C" }}>
            <CardTitle>\ud83d\ude97 {t.allFleet}</CardTitle>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:12 }}>
              <StatCard icon="\ud83d\ude97" label={t.totalVeh} value={totalV} color="#6366f1" />
              <StatCard icon="\u2705" label={t.active} value={activeV} color="#10b981" />
              <StatCard icon="\ud83d\udd27" label={t.inMaint} value={maintV} color="#f59e0b" />
              <StatCard icon="\u26fd" label={t.avgFuel} value={avgFuel+"L"} color="#0891b2" />
            </div>
          </Card>

          {/* DC Boxes — Admin sees all 3, Manager sees own */}
          {!dc ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
              <DCFleetBox dcName="Riyadh" color="#1A3A5C" />
              <DCFleetBox dcName="Jeddah" color="#0f766e" />
              <DCFleetBox dcName="Dammam" color="#7c3aed" />
            </div>
          ) : (
            <div>
              {myVehicles.map(v => (
                <Card key={v.plate} style={{ border:`1px solid ${v.status==="Maintenance"?"#fbbf24":"#e2e8f0"}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                    <div>
                      <span style={{ fontWeight:700, fontSize:15 }}>{v.plate}</span>
                      <span style={{ fontSize:13, color:"#64748b", marginLeft:8 }}>({v.type}) {v.brand} {v.model}</span>
                    </div>
                    <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99, background:v.status==="Maintenance"?"#fef3c7":"#d1fae5", color:v.status==="Maintenance"?"#92400e":"#065f46" }}>{v.status}</span>
                  </div>
                  {/* Fuel Bar */}
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748b", marginBottom:4 }}>
                      <span>\u26fd {t.fuelLevel}: {v.fuelLevel||0}L / {v.fuelCapacity||80}L</span>
                      <span>{Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100)}%</span>
                    </div>
                    <div style={{ background:"#f1f5f9", borderRadius:99, height:8, overflow:"hidden" }}>
                      <div style={{ width:`${Math.round((v.fuelLevel||0)/(v.fuelCapacity||80)*100)}%`, height:"100%", background:(v.fuelLevel||0)/(v.fuelCapacity||80)<0.25?"#ef4444":"#10b981", borderRadius:99 }} />
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:4, fontSize:12, color:"#64748b", marginBottom:8 }}>
                    <span>\ud83d\udee3\ufe0f {t.totalKM}: {(v.totalKM||0).toLocaleString()}</span>
                    <span>\ud83d\udcca {t.mileage}: {v.mileage||12} km/L</span>
                    {v.fahas&&<span>\ud83d\udd27 {t.fahas}: {v.fahas}</span>}
                    {v.nextOilKM&&<span>\ud83d\udd29 {t.nextOil}: {v.nextOilKM} KM</span>}
                    {v.insurance&&<span>\ud83d\udee1\ufe0f {t.insurance}: {v.insurance}</span>}
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {v.status === "Active" ? (
                      <Btn small onClick={() => { setShowMaint(v.plate); setMaintForm({ type:"Scheduled Service", startDate:"", returnDate:"", cost:"", notes:"" }); }} color="#f59e0b">
                        \ud83d\udd27 {t.sendMaint}
                      </Btn>
                    ) : (
                      <Btn small onClick={() => reactivate(v.plate)} color="#10b981">\u2705 {t.reactivate}</Btn>
                    )}
                  </div>
                  {showMaint === v.plate && (
                    <div style={{ marginTop:12, padding:12, background:"#f8fafc", borderRadius:8 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
                        <Select label={t.maintType} value={maintForm.type} onChange={val=>setMaintForm({...maintForm,type:val})} options={MAINTENANCE_TYPES} />
                        <Input label={t.cost} value={maintForm.cost} onChange={val=>setMaintForm({...maintForm,cost:val})} type="number" />
                        <Input label={t.startDate} value={maintForm.startDate} onChange={val=>setMaintForm({...maintForm,startDate:val})} type="date" />
                        <Input label={t.returnDate} value={maintForm.returnDate} onChange={val=>setMaintForm({...maintForm,returnDate:val})} type="date" />
                        <div style={{ gridColumn:"1/-1" }}><Input label={t.notes} value={maintForm.notes} onChange={val=>setMaintForm({...maintForm,notes:val})} /></div>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <Btn small onClick={() => sendMaint(v.plate)} color="#f59e0b">\u2705 {t.confirmMaint}</Btn>
                        <Btn small onClick={() => setShowMaint(null)} color="#64748b">{t.cancel}</Btn>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MAINTENANCE LOG */}
      {tab === "maintenance" && (
        <Card>
          <CardTitle>\ud83d\udd27 {t.maintHistory}</CardTitle>
          {myVehicles.filter(v => (v.maintHistory||[]).length > 0).length === 0 && (
            <div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>{t.noMaint}</div>
          )}
          {myVehicles.filter(v => (v.maintHistory||[]).length > 0).map(v => (
            <div key={v.plate} style={{ marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>\ud83d\ude97 {v.plate} ({v.type}) — {v.dc} DC</div>
              {(v.maintHistory||[]).map((m,i) => (
                <div key={i} style={{ background:"#f8fafc", borderRadius:8, padding:"10px 14px", marginBottom:6, fontSize:13 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:4 }}>
                    <span style={{ fontWeight:600 }}>\ud83d\udd27 {m.type}</span>
                    <span style={{ color:"#64748b" }}>\ud83d\udcc5 {m.date}</span>
                  </div>
                  <div style={{ color:"#64748b", marginTop:2 }}>
                    {m.startDate&&<span>Start: {m.startDate} </span>}
                    {m.returnDate&&<span>| Return: {m.returnDate} </span>}
                    {m.cost&&<span>| SAR {m.cost}</span>}
                  </div>
                  {m.notes&&<div style={{ color:"#374151", marginTop:2 }}>\ud83d\udcdd {m.notes}</div>}
                  {m.addedBy&&<div style={{ color:"#94a3b8", fontSize:11, marginTop:2 }}>By: {m.addedBy}</div>}
                </div>
              ))}
            </div>
          ))}
        </Card>
      )}

      {/* ADD VEHICLE — Admin only */}
      {tab === "add" && isAdmin && (
        <Card>
          <CardTitle>\u2795 {t.addVehicle}</CardTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
            <Input label={t.plate+" *"} value={addForm.plate} onChange={v=>setAddForm({...addForm,plate:v})} placeholder="ABC-1234" required />
            <Select label={t.type+" *"} value={addForm.type} onChange={v=>setAddForm({...addForm,type:v})} options={["Dyna","Bus"]} />
            <Select label={t.homeDC+" *"} value={addForm.dc} onChange={v=>setAddForm({...addForm,dc:v})} options={DCS} />
            <Input label={t.brand} value={addForm.brand} onChange={v=>setAddForm({...addForm,brand:v})} placeholder="Toyota" />
            <Input label={t.model} value={addForm.model} onChange={v=>setAddForm({...addForm,model:v})} placeholder="Dyna 300" />
            <Input label={t.chassis} value={addForm.chassis} onChange={v=>setAddForm({...addForm,chassis:v})} />
            <Input label={t.year} value={addForm.year} onChange={v=>setAddForm({...addForm,year:v})} type="number" />
            <Input label={t.fuelCap} value={addForm.fuelCapacity} onChange={v=>setAddForm({...addForm,fuelCapacity:Number(v)})} type="number" />
            <Input label={t.mileageKm} value={addForm.mileage} onChange={v=>setAddForm({...addForm,mileage:Number(v)})} type="number" />
            <Input label={t.fahasExp} value={addForm.fahas} onChange={v=>setAddForm({...addForm,fahas:v})} type="date" />
            <Input label={t.istamaraExp} value={addForm.istimara} onChange={v=>setAddForm({...addForm,istimara:v})} type="date" />
            <Input label={t.insExp} value={addForm.insurance} onChange={v=>setAddForm({...addForm,insurance:v})} type="date" />
            <Input label={t.nextOilKM} value={addForm.nextOilKM} onChange={v=>setAddForm({...addForm,nextOilKM:v})} type="number" />
            <Input label={t.nextOilDate} value={addForm.nextOilDate} onChange={v=>setAddForm({...addForm,nextOilDate:v})} type="date" />
          </div>
          <Btn onClick={addVehicle} color="#10b981" style={{ width:"100%", marginTop:8 }}>\u2705 {t.addBtn}</Btn>
        </Card>
      )}
    </div>
  );
}
