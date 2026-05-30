import { useState } from "react";
import { Card, CardTitle, Btn, SuccessMsg, Badge } from "../components/Shared.jsx";

const T = {
  en: {
    pending:"Pending Deliveries", completed:"Completed", total:"Total",
    remaining:"Remaining", inCity:"In-City", outCity:"Out-City",
    startDelivery:"Start Delivery", gpsStep:"Step 1: Get GPS Location (Required)",
    podStep:"Step 2: Take POD Photo (Required)", markDelivered:"Mark Delivered",
    markFailed:"Mark Failed", cancel:"Cancel", getGPS:"Get My Location",
    gettingGPS:"Getting location...", noDeliveries:"All deliveries completed!",
    vehicle:"Assigned Vehicle", vehicleAlerts:"Vehicle Alerts",
    allDone:"Great work! All deliveries completed for today.",
    podRequired:"Please take POD photo first",
    maintenance:"Under Maintenance", lowFuel:"Low Fuel Warning",
    expirySoon:"Document Expiring Soon"
  },
  ar: {
    pending:"\u062a\u0633\u0644\u064a\u0645\u0627\u062a \u0645\u0639\u0644\u0642\u0629",
    completed:"\u0645\u0643\u062a\u0645\u0644\u0629", total:"\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a",
    remaining:"\u0627\u0644\u0645\u062a\u0628\u0642\u064a", inCity:"\u062f\u0627\u062e\u0644 \u0627\u0644\u0645\u062f\u064a\u0646\u0629",
    outCity:"\u062e\u0627\u0631\u062c \u0627\u0644\u0645\u062f\u064a\u0646\u0629",
    startDelivery:"\u0628\u062f\u0621 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    gpsStep:"\u0627\u0644\u062e\u0637\u0648\u0629 1: \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639",
    podStep:"\u0627\u0644\u062e\u0637\u0648\u0629 2: \u0635\u0648\u0631\u0629 \u0625\u062b\u0628\u0627\u062a \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    markDelivered:"\u062a\u0633\u0644\u064a\u0645 \u0646\u0627\u062c\u062d",
    markFailed:"\u062a\u0633\u0644\u064a\u0645 \u0641\u0627\u0634\u0644",
    cancel:"\u0625\u0644\u063a\u0627\u0621",
    getGPS:"\u062a\u062d\u062f\u064a\u062f \u0645\u0648\u0642\u0639\u064a",
    gettingGPS:"\u062c\u0627\u0631\u064a \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639...",
    noDeliveries:"\u062a\u0645 \u0625\u0643\u0645\u0627\u0644 \u062c\u0645\u064a\u0639 \u0627\u0644\u062a\u0633\u0644\u064a\u0645\u0627\u062a!",
    vehicle:"\u0627\u0644\u0645\u0631\u0643\u0628\u0629 \u0627\u0644\u0645\u062e\u0635\u0635\u0629",
    vehicleAlerts:"\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0645\u0631\u0643\u0628\u0629",
    allDone:"\u0639\u0645\u0644 \u0631\u0627\u0626\u0639! \u062a\u0645 \u0625\u0643\u0645\u0627\u0644 \u062c\u0645\u064a\u0639 \u0627\u0644\u062a\u0633\u0644\u064a\u0645\u0627\u062a.",
    podRequired:"\u064a\u0631\u062c\u0649 \u0627\u0644\u062a\u0642\u0627\u0637 \u0635\u0648\u0631\u0629 \u0625\u062b\u0628\u0627\u062a \u0627\u0644\u062a\u0633\u0644\u064a\u0645 \u0623\u0648\u0644\u0627\u064b",
    maintenance:"\u062a\u062d\u062a \u0627\u0644\u0635\u064a\u0627\u0646\u0629",
    lowFuel:"\u062a\u062d\u0630\u064a\u0631: \u0648\u0642\u0648\u062f \u0645\u0646\u062e\u0641\u0636",
    expirySoon:"\u0648\u062b\u064a\u0642\u0629 \u0633\u062a\u0646\u062a\u0647\u064a \u0642\u0631\u064a\u0628\u0627\u064b"
  }
};

export default function Driver({ user, invoices, setInvoices, vehicles, lang }) {
  const [active, setActive] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [gps, setGps] = useState(null);
  const [locating, setLocating] = useState(false);
  const [pod, setPod] = useState(null);
  const [done, setDone] = useState("");

  const rtl = lang === "ar";
  const t = T[lang] || T.en;

  // Only driver's assigned invoices
  const myInv = invoices.filter(i => i.status === "assigned" && i.driverId === user.uid);
  const pending = myInv.filter(i => !completed.includes(i.id));
  const doneList = myInv.filter(i => completed.includes(i.id));

  const inCity = pending.filter(i => i.dtype === "incity");
  const outCity = pending.filter(i => i.dtype === "outcity");

  // Find assigned vehicle
  const assignedVehiclePlate = myInv.length > 0 ? myInv[0].vehicle : null;
  const assignedVehicle = assignedVehiclePlate && vehicles
    ? vehicles.find(v => v.plate === assignedVehiclePlate)
    : null;

  // Vehicle alerts
  const vAlerts = [];
  if (assignedVehicle) {
    if (assignedVehicle.status === "Maintenance") vAlerts.push({ type:"error", msg:t.maintenance });
    if ((assignedVehicle.fuelLevel||0) / (assignedVehicle.fuelCapacity||80) < 0.25) vAlerts.push({ type:"warning", msg:t.lowFuel + ": " + (assignedVehicle.fuelLevel||0) + "L" });
    if (assignedVehicle.fahas) {
      const days = Math.ceil((new Date(assignedVehicle.fahas) - new Date()) / (1000*60*60*24));
      if (days <= 30) vAlerts.push({ type:"warning", msg:"Fahas " + t.expirySoon + " (" + days + " days)" });
    }
    if (assignedVehicle.insurance) {
      const days = Math.ceil((new Date(assignedVehicle.insurance) - new Date()) / (1000*60*60*24));
      if (days <= 30) vAlerts.push({ type:"warning", msg:"Insurance " + t.expirySoon + " (" + days + " days)" });
    }
  }

  function getGPS() {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => { setGps({ lat:p.coords.latitude, lng:p.coords.longitude }); setLocating(false); },
        () => { setGps({ lat:24.7136, lng:46.6753 }); setLocating(false); }
      );
    } else {
      setGps({ lat:24.7136, lng:46.6753 });
      setLocating(false);
    }
  }

  function handlePhoto(e) {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => setPod(ev.target.result);
    r.readAsDataURL(f);
  }

  function submit(inv, status) {
    if (status === "delivered" && !pod) { alert(t.podRequired); return; }
    setInvoices(prev => prev.map(i => i.id === inv.id ? {
      ...i, status, podImage:pod, gps,
      deliveredAt: new Date().toLocaleString(),
      attempts: (i.attempts||0) + 1
    } : i));
    setCompleted(p => [...p, inv.id]);
    setDone(status === "delivered" ? "\u2705 " + inv.id + " delivered!" : "\u274c " + inv.id + " failed.");
    setActive(null); setPod(null); setGps(null);
    setTimeout(() => setDone(""), 3000);
  }

  function InvCard({ inv }) {
    return (
      <Card key={inv.id}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, flexWrap:"wrap", gap:6 }}>
          <span style={{ fontWeight:700, fontSize:13, color:"#6366f1" }}>{inv.id}</span>
          <span style={{ fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:6, background:inv.dtype==="incity"?"#dbeafe":"#fef3c7", color:inv.dtype==="incity"?"#1e40af":"#92400e" }}>
            {inv.dtype==="incity"?"\ud83c\udfd9\ufe0f "+t.inCity:"\ud83d\udee3\ufe0f "+t.outCity}
          </span>
        </div>
        <div style={{ fontWeight:700, fontSize:15, color:"#0f172a", marginBottom:4 }}>{inv.customer}</div>
        <div style={{ fontSize:13, color:"#64748b", marginBottom:4 }}>
          \ud83d\udccd {inv.city} | \ud83c\udf21\ufe0f {inv.storage}
        </div>
        {inv.vehicle && (
          <div style={{ fontSize:13, color:"#64748b", marginBottom:4 }}>
            \ud83d\ude97 {t.vehicle}: <b>{inv.vehicle}</b>
          </div>
        )}
        {inv.remarks && (
          <div style={{ fontSize:13, color:"#d97706", background:"#fffbeb", padding:"6px 10px", borderRadius:6, marginBottom:8 }}>
            \ud83d\udcac {inv.remarks}
          </div>
        )}

        {active?.id === inv.id ? (
          <div style={{ marginTop:12, border:"1px solid #e2e8f0", borderRadius:8, padding:14, background:"#f8fafc" }}>
            {/* GPS */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:6 }}>{t.gpsStep}</div>
              <button onClick={getGPS} disabled={locating}
                style={{ background:gps?"#10b981":"#0ea5e9", color:"white", border:"none", padding:"9px 16px", borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:13, width:"100%" }}>
                {locating ? t.gettingGPS : gps ? "\u2705 GPS: " + gps.lat.toFixed(4) + ", " + gps.lng.toFixed(4) : "\ud83d\udccd " + t.getGPS}
              </button>
            </div>
            {/* POD Photo */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:6 }}>{t.podStep}</div>
              <input type="file" accept="image/*" capture="environment" id={"pod_"+inv.id} style={{ display:"none" }} onChange={handlePhoto} />
              <label htmlFor={"pod_"+inv.id} style={{ display:"inline-block", background:"#8b5cf6", color:"white", border:"none", padding:"9px 16px", borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:13 }}>
                \ud83d\udcf8 {pod ? "Change Photo" : "Take Photo"}
              </label>
              {pod && <img src={pod} alt="POD" style={{ display:"block", marginTop:8, width:"100%", maxWidth:200, borderRadius:8, border:"2px solid #e2e8f0" }} />}
            </div>
            {/* Actions */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button onClick={() => submit(inv,"delivered")} style={{ background:"#10b981", color:"white", border:"none", padding:"10px 16px", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:13 }}>
                \u2705 {t.markDelivered}
              </button>
              <button onClick={() => submit(inv,"failed")} style={{ background:"#ef4444", color:"white", border:"none", padding:"10px 16px", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:13 }}>
                \u274c {t.markFailed}
              </button>
              <button onClick={() => { setActive(null); setPod(null); setGps(null); }} style={{ background:"#f1f5f9", border:"none", padding:"10px 14px", borderRadius:8, fontWeight:600, cursor:"pointer", fontSize:13, color:"#64748b" }}>
                {t.cancel}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setActive(inv); setGps(null); setPod(null); }}
            style={{ background:"#1A3A5C", color:"white", border:"none", padding:"10px 20px", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:13, marginTop:8, width:"100%" }}>
            {t.startDelivery} \u2192
          </button>
        )}
      </Card>
    );
  }

  return (
    <div style={{ direction: rtl ? "rtl" : "ltr" }}>
      {done && <SuccessMsg msg={done} />}

      {/* Vehicle Info + Alerts */}
      {assignedVehicle && (
        <Card style={{ borderLeft:"4px solid #0891b2" }}>
          <CardTitle>\ud83d\ude97 {t.vehicle}: {assignedVehicle.plate}</CardTitle>
          <div style={{ display:"flex", gap:16, fontSize:13, color:"#64748b", flexWrap:"wrap", marginBottom:8 }}>
            <span>{assignedVehicle.type} | {assignedVehicle.brand} {assignedVehicle.model}</span>
            <span>\u26fd Fuel: {assignedVehicle.fuelLevel||0}L / {assignedVehicle.fuelCapacity||80}L</span>
            <span>\ud83d\udee3\ufe0f {assignedVehicle.totalKM||0} KM</span>
          </div>
          {vAlerts.length > 0 && (
            <div>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:6 }}>\ud83d\udd14 {t.vehicleAlerts}</div>
              {vAlerts.map((a,i) => (
                <div key={i} style={{ background:a.type==="error"?"#fee2e2":"#fef3c7", color:a.type==="error"?"#991b1b":"#92400e", borderRadius:6, padding:"6px 12px", fontSize:13, fontWeight:600, marginBottom:4 }}>
                  {a.type==="error"?"\ud83d\udd34":"\u26a0\ufe0f"} {a.msg}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {[
          [t.remaining, pending.length, "#0f172a"],
          [t.inCity, inCity.length, "#1e40af"],
          [t.outCity, outCity.length, "#92400e"],
          [t.completed, doneList.length, "#10b981"],
        ].map(([l,v,c]) => (
          <div key={l} style={{ background:"white", borderRadius:10, padding:16, textAlign:"center", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight:900, fontSize:24, color:c }}>{v}</div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* In-City */}
      {inCity.length > 0 && (
        <>
          <div style={{ fontWeight:700, fontSize:15, color:"#1e40af", margin:"16px 0 10px" }}>
            \ud83c\udfd9\ufe0f {t.inCity} ({inCity.length})
          </div>
          {inCity.map(inv => <InvCard key={inv.id} inv={inv} />)}
        </>
      )}

      {/* Out-City */}
      {outCity.length > 0 && (
        <>
          <div style={{ fontWeight:700, fontSize:15, color:"#92400e", margin:"16px 0 10px" }}>
            \ud83d\udee3\ufe0f {t.outCity} ({outCity.length})
          </div>
          {outCity.map(inv => <InvCard key={inv.id} inv={inv} />)}
        </>
      )}

      {pending.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px", color:"#94a3b8", background:"white", borderRadius:10 }}>
          \ud83c\udf89 {t.allDone}
        </div>
      )}

      {/* Completed */}
      {doneList.length > 0 && (
        <>
          <div style={{ fontWeight:700, fontSize:15, color:"#0f172a", margin:"16px 0 10px" }}>
            \u2705 {t.completed} ({doneList.length})
          </div>
          {doneList.map(inv => (
            <Card key={inv.id} style={{ opacity:0.65 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontWeight:700, fontSize:13, color:"#6366f1" }}>{inv.id}</span>
                <Badge status="delivered" />
              </div>
              <div style={{ fontWeight:600, fontSize:14 }}>{inv.customer}</div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
