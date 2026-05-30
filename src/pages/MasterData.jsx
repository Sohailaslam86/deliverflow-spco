import { useState, useRef } from "react";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg, TabBar } from "../components/Shared.jsx";
import { STORAGE_CONDITIONS, CITIES, DCS, DC_GPS } from "../data/masterData.js";

const T = {
  en: {
    vehicles:"Vehicles", dcs:"DC Locations", storage:"Storage Conditions", cities:"Cities",
    addVehicle:"Add Vehicle", plate:"Plate Number", type:"Type", homeDC:"Home DC",
    brand:"Brand", model:"Model", chassis:"Chassis", year:"Year",
    fuelCap:"Fuel Capacity (L)", mileage:"Mileage (km/L)",
    fahas:"Fahas Expiry", istimara:"Istimara Expiry", insurance:"Insurance Expiry",
    nextOilKM:"Next Oil KM", nextOilDate:"Next Oil Date",
    photos:"Vehicle Photos (up to 4)", uploadPhoto:"Upload Photo",
    aiCheck:"AI Plate Verify", aiChecking:"Verifying...",
    aiMatch:"\u2705 Plate verified!", aiMismatch:"\u26a0\ufe0f Plate mismatch — check photo",
    aiNoPlate:"Take photo first", addBtn:"Add Vehicle", transfer:"Transfer DC",
    registered:"vehicles registered", noPhotos:"No photos uploaded",
    dcLoc:"Distribution Center Locations", viewMap:"View on Map",
    storageTitle:"Storage Conditions", citiesTitle:"Delivery Cities",
    contactAdmin:"Contact admin to add new delivery cities"
  },
  ar: {
    vehicles:"\u0627\u0644\u0645\u0631\u0643\u0628\u0627\u062a",
    dcs:"\u0645\u0648\u0627\u0642\u0639 \u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u062a\u0648\u0632\u064a\u0639",
    storage:"\u0638\u0631\u0648\u0641 \u0627\u0644\u062a\u062e\u0632\u064a\u0646",
    cities:"\u0645\u062f\u0646 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    addVehicle:"\u0625\u0636\u0627\u0641\u0629 \u0645\u0631\u0643\u0628\u0629",
    plate:"\u0631\u0642\u0645 \u0627\u0644\u0644\u0648\u062d\u0629",
    type:"\u0627\u0644\u0646\u0648\u0639", homeDC:"\u0645\u0631\u0643\u0632 \u0627\u0644\u062a\u0648\u0632\u064a\u0639",
    brand:"\u0627\u0644\u0645\u0627\u0631\u0643\u0629", model:"\u0627\u0644\u0645\u0648\u062f\u064a\u0644",
    chassis:"\u0631\u0642\u0645 \u0627\u0644\u0647\u064a\u0643\u0644", year:"\u0627\u0644\u0633\u0646\u0629",
    fuelCap:"\u0633\u0639\u0629 \u0627\u0644\u062e\u0632\u0627\u0646",
    mileage:"\u0643\u0641\u0627\u0621\u0629 \u0627\u0644\u0648\u0642\u0648\u062f",
    fahas:"\u0627\u0646\u062a\u0647\u0627\u0621 \u0627\u0644\u0641\u062d\u0635",
    istimara:"\u0627\u0646\u062a\u0647\u0627\u0621 \u0627\u0644\u0627\u0633\u062a\u0645\u0627\u0631\u0629",
    insurance:"\u0627\u0646\u062a\u0647\u0627\u0621 \u0627\u0644\u062a\u0623\u0645\u064a\u0646",
    nextOilKM:"\u0643\u0645 \u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0632\u064a\u062a",
    nextOilDate:"\u062a\u0627\u0631\u064a\u062e \u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0632\u064a\u062a",
    photos:"\u0635\u0648\u0631 \u0627\u0644\u0645\u0631\u0643\u0628\u0629",
    uploadPhoto:"\u0631\u0641\u0639 \u0635\u0648\u0631\u0629",
    aiCheck:"\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0644\u0648\u062d\u0629",
    aiChecking:"\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0642\u0642...",
    aiMatch:"\u2705 \u062a\u0645 \u0627\u0644\u062a\u062d\u0642\u0642!",
    aiMismatch:"\u26a0\ufe0f \u0627\u0644\u0644\u0648\u062d\u0629 \u063a\u064a\u0631 \u0645\u0637\u0627\u0628\u0642\u0629",
    aiNoPlate:"\u0627\u0644\u062a\u0642\u0637 \u0635\u0648\u0631\u0629 \u0623\u0648\u0644\u0627\u064b",
    addBtn:"\u0625\u0636\u0627\u0641\u0629 \u0645\u0631\u0643\u0628\u0629",
    transfer:"\u0646\u0642\u0644 DC",
    registered:"\u0645\u0631\u0643\u0628\u0629 \u0645\u0633\u062c\u0644\u0629",
    noPhotos:"\u0644\u0627 \u062a\u0648\u062c\u062f \u0635\u0648\u0631",
    dcLoc:"\u0645\u0648\u0627\u0642\u0639 \u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u062a\u0648\u0632\u064a\u0639",
    viewMap:"\u0639\u0631\u0636 \u0639\u0644\u0649 \u0627\u0644\u062e\u0631\u064a\u0637\u0629",
    storageTitle:"\u0638\u0631\u0648\u0641 \u0627\u0644\u062a\u062e\u0632\u064a\u0646",
    citiesTitle:"\u0645\u062f\u0646 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    contactAdmin:"\u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0644\u0625\u0636\u0627\u0641\u0629 \u0645\u062f\u0646 \u062c\u062f\u064a\u062f\u0629"
  }
};

const EMPTY = { plate:"", type:"Dyna", dc:"Riyadh", brand:"", model:"", chassis:"", year:"", fahas:"", istimara:"", insurance:"", fuelCapacity:80, mileage:12, nextOilKM:"", nextOilDate:"" };

export default function MasterData({ vehicles, setVehicles, lang }) {
  const [tab, setTab] = useState("vehicles");
  const [done, setDone] = useState("");
  const rtl = lang === "ar";
  const t = T[lang] || T.en;

  const tabs = [
    ["vehicles","\ud83d\ude97",t.vehicles],
    ["dcs","\ud83d\udccd",t.dcs],
    ["storage","\ud83c\udf21\ufe0f",t.storage],
    ["cities","\ud83c\udf06",t.cities]
  ];

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      {tab==="vehicles"&&<VehiclesTab vehicles={vehicles} setVehicles={setVehicles} setDone={setDone} t={t} />}
      {tab==="dcs"&&<DCsTab t={t} />}
      {tab==="storage"&&<StorageTab t={t} />}
      {tab==="cities"&&<CitiesTab t={t} />}
    </div>
  );
}

function VehiclesTab({ vehicles, setVehicles, setDone, t }) {
  const [showAdd, setShowAdd] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [photos, setPhotos] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const photoRef = useRef();

  function handlePhotos(e) {
    const files = Array.from(e.target.files).slice(0,4);
    const readers = files.map(file => new Promise(res => {
      const r = new FileReader();
      r.onload = ev => res(ev.target.result);
      r.readAsDataURL(file);
    }));
    Promise.all(readers).then(results => setPhotos(results));
  }

  function aiVerify() {
    if (!photos.length) { setAiStatus("noplate"); return; }
    setAiStatus("checking");
    setTimeout(() => {
      // Simulate AI check — in real system calls Claude API
      const plateInPhoto = f.plate && f.plate.length > 2;
      setAiStatus(plateInPhoto ? "match" : "mismatch");
    }, 1500);
  }

  function add() {
    if (!f.plate) return;
    setVehicles(prev => [...prev, { ...f, status:"Active", fuelLevel:f.fuelCapacity, totalKM:0, maintHistory:[], photos }]);
    setDone(t.addBtn+": "+f.plate);
    setShowAdd(false); setF(EMPTY); setPhotos([]); setAiStatus(null);
    setTimeout(()=>setDone(""),3000);
  }

  function toggleDC(plate, dc) {
    setVehicles(prev => prev.map(v => v.plate===plate?{...v,dc}:v));
    setDone(plate+" transferred to "+dc+" DC");
    setTimeout(()=>setDone(""),3000);
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:14, color:"#64748b" }}>{vehicles.length} {t.registered}</div>
        <Btn small onClick={()=>setShowAdd(!showAdd)}>\ud83d\ude97 {t.addVehicle}</Btn>
      </div>

      {showAdd && (
        <Card>
          <CardTitle>\u2795 {t.addVehicle}</CardTitle>
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

          {/* Photos */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:8 }}>\ud83d\udcf8 {t.photos}</label>
            <input ref={photoRef} type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display:"none" }} />
            <Btn small onClick={()=>photoRef.current.click()} color="#6366f1">\ud83d\udcf8 {t.uploadPhoto}</Btn>
            {photos.length > 0 && (
              <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
                {photos.map((p,i) => (
                  <img key={i} src={p} alt={"Vehicle "+i} style={{ width:100, height:75, objectFit:"cover", borderRadius:8, border:"2px solid #e2e8f0" }} />
                ))}
              </div>
            )}
            {photos.length === 0 && <div style={{ fontSize:12, color:"#94a3b8", marginTop:6 }}>{t.noPhotos}</div>}
          </div>

          {/* AI Plate Verification */}
          <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:8, padding:"12px 14px", marginBottom:16 }}>
            <div style={{ fontWeight:600, fontSize:13, color:"#0369a1", marginBottom:8 }}>\ud83e\udd16 {t.aiCheck}</div>
            <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
              <Btn small onClick={aiVerify} color="#0369a1" disabled={aiStatus==="checking"}>
                {aiStatus==="checking"?t.aiChecking:"\u2714\ufe0f "+t.aiCheck}
              </Btn>
              {aiStatus==="match"&&<span style={{ color:"#065f46", fontWeight:600, fontSize:13 }}>{t.aiMatch}</span>}
              {aiStatus==="mismatch"&&<span style={{ color:"#991b1b", fontWeight:600, fontSize:13 }}>{t.aiMismatch}</span>}
              {aiStatus==="noplate"&&<span style={{ color:"#92400e", fontSize:13 }}>{t.aiNoPlate}</span>}
            </div>
          </div>

          <Btn onClick={add} color="#10b981" style={{ width:"100%" }}>\u2705 {t.addBtn}</Btn>
        </Card>
      )}

      {DCS.map(dc => {
        const dv = vehicles.filter(v => v.dc === dc);
        if (!dv.length) return null;
        return (
          <Card key={dc}>
            <CardTitle>\ud83d\udccd {dc} DC — {dv.length} {t.vehicles}</CardTitle>
            {dv.map(v => (
              <div key={v.plate} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"12px 0", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{v.plate} <span style={{ fontSize:12, color:"#64748b" }}>({v.type}) {v.brand} {v.model}</span></div>
                  <div style={{ fontSize:11, color:"#94a3b8", marginBottom:6 }}>
                    {t.fahas}: {v.fahas||"-"} | {t.istimara}: {v.istimara||"-"} | {t.insurance}: {v.insurance||"-"}
                  </div>
                  {/* Vehicle photos */}
                  {(v.photos||[]).length > 0 && (
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {v.photos.map((p,i) => (
                        <img key={i} src={p} alt={"Photo "+i} style={{ width:70, height:52, objectFit:"cover", borderRadius:6, border:"1px solid #e2e8f0" }} />
                      ))}
                    </div>
                  )}
                </div>
                <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99, background:v.status==="Maintenance"?"#fef3c7":"#d1fae5", color:v.status==="Maintenance"?"#92400e":"#065f46" }}>{v.status}</span>
                <select value={v.dc} onChange={e=>toggleDC(v.plate,e.target.value)}
                  style={{ border:"1px solid #e2e8f0", borderRadius:6, padding:"5px 8px", fontSize:12, cursor:"pointer" }}>
                  {DCS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
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
    { dc:"Riyadh DC", city:"Riyadh", lat:DC_GPS.Riyadh.lat, lng:DC_GPS.Riyadh.lng, manager:"AlWaleed Qahtani" },
    { dc:"Jeddah DC", city:"Jeddah", lat:DC_GPS.Jeddah.lat, lng:DC_GPS.Jeddah.lng, manager:"Muhammad Anas" },
    { dc:"Dammam DC", city:"Dammam", lat:DC_GPS.Dammam.lat, lng:DC_GPS.Dammam.lng, manager:"Muhammad Saleh" },
  ];
  return (
    <Card>
      <CardTitle>\ud83d\udccd {t.dcLoc}</CardTitle>
      {dcs.map(d=>(
        <div key={d.dc} style={{ border:"1px solid #e2e8f0", borderRadius:8, padding:14, marginBottom:8 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:8 }}>\ud83d\udccd {d.dc}</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:6, fontSize:13, color:"#374151" }}>
            <div><b>City:</b> {d.city}</div>
            <div><b>Manager:</b> {d.manager}</div>
            <div><b>GPS Lat:</b> {d.lat}</div>
            <div><b>GPS Lng:</b> {d.lng}</div>
          </div>
          <a href={"https://maps.google.com/?q="+d.lat+","+d.lng} target="_blank" rel="noreferrer"
            style={{ display:"inline-block", marginTop:8, fontSize:12, color:"#6366f1", fontWeight:600 }}>
            \ud83d\udccd {t.viewMap} \u2192
          </a>
        </div>
      ))}
    </Card>
  );
}

function StorageTab({ t }) {
  return (
    <Card>
      <CardTitle>\ud83c\udf21\ufe0f {t.storageTitle}</CardTitle>
      {STORAGE_CONDITIONS.map(s=>(
        <div key={s.name} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid #f1f5f9" }}>
          <div style={{ width:14, height:14, borderRadius:"50%", background:s.color, flexShrink:0 }} />
          <div>
            <div style={{ fontWeight:600, fontSize:14 }}>{s.name} <span style={{ fontSize:13, color:"#64748b", fontWeight:400 }}>({s.range})</span></div>
          </div>
        </div>
      ))}
    </Card>
  );
}

function CitiesTab({ t }) {
  return (
    <Card>
      <CardTitle>\ud83c\udf06 {t.citiesTitle}</CardTitle>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {CITIES.map(c=><span key={c} style={{ background:"#f1f5f9", borderRadius:8, padding:"8px 16px", fontSize:14, fontWeight:600, color:"#374151" }}>\ud83d\udccd {c}</span>)}
      </div>
      <p style={{ fontSize:13, color:"#94a3b8", marginTop:12 }}>{t.contactAdmin}</p>
    </Card>
  );
}
