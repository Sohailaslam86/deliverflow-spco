import { useState } from "react";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg, Badge } from "../components/Shared.jsx";
import { STORAGE_CONDITIONS, DRIVERS_BY_DC, TRIP_DESTINATIONS } from "../data/masterData.js";

const VEHICLES_BY_DC = {
  Riyadh:["Dyna 5784","BUS 2632","BUS 2630","BUS 2629","BUS 4295","Bus 4294","BUS 2631","Bus 2633","Dyna 5789","Dyna 5788"],
  Jeddah:["BUS 2631","Dyna 1217","Dyna 5787","Dyna 5786","BUS 2629","Dyna 5784","BUS 4472","BUS 2633","Dyna 5789"],
  Dammam:["BUS 4472","Dyna 5789","Dyna 5787"],
};

const T = {
  en: {
    newTrip:"New Trip", cancel:"Cancel", allTrips:"All Trips",
    tripNo:"Trip Number", tripDate:"Trip Date", destination:"Destination",
    driver:"Driver", vehicle:"Vehicle", storage:"Storage Condition",
    notes:"Notes", attachInv:"Attach Transit Invoices (Optional)",
    createBtn:"Create & Dispatch Trip", noTrips:"No trips yet",
    from:"From:", to:"To:", confirmReceipt:"Confirm Receipt",
    dispatched:"Dispatched", received:"Received",
    pendingShipInv:"Pending Shipment Invoices available for this trip",
    selectAll:"Select All", clearAll:"Clear All",
    tripCreated:"Trip created and dispatched!",
    tripReceived:"Trip received! Invoices added to your queue.",
    dcRiyadh:"Distribution Center - Riyadh",
    dcJeddah:"Distribution Center - Jeddah",
    dcDammam:"Distribution Center - Dammam",
  },
  ar: {
    newTrip:"\u0631\u062d\u0644\u0629 \u062c\u062f\u064a\u062f\u0629", cancel:"\u0625\u0644\u063a\u0627\u0621",
    allTrips:"\u062c\u0645\u064a\u0639 \u0627\u0644\u0631\u062d\u0644\u0627\u062a",
    tripNo:"\u0631\u0642\u0645 \u0627\u0644\u0631\u062d\u0644\u0629",
    tripDate:"\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0631\u062d\u0644\u0629",
    destination:"\u0627\u0644\u0648\u062c\u0647\u0629",
    driver:"\u0627\u0644\u0633\u0627\u0626\u0642", vehicle:"\u0627\u0644\u0645\u0631\u0643\u0628\u0629",
    storage:"\u0638\u0631\u0648\u0641 \u0627\u0644\u062a\u062e\u0632\u064a\u0646",
    notes:"\u0645\u0644\u0627\u062d\u0638\u0627\u062a",
    attachInv:"\u0625\u0631\u0641\u0627\u0642 \u0641\u0648\u0627\u062a\u064a\u0631 \u0639\u0628\u0648\u0631 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)",
    createBtn:"\u0625\u0646\u0634\u0627\u0621 \u0648\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u062d\u0644\u0629",
    noTrips:"\u0644\u0627 \u062a\u0648\u062c\u062f \u0631\u062d\u0644\u0627\u062a",
    from:"\u0645\u0646:", to:"\u0625\u0644\u0649:",
    confirmReceipt:"\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645",
    dispatched:"\u062a\u0645 \u0627\u0644\u0625\u0631\u0633\u0627\u0644",
    received:"\u062a\u0645 \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645",
    pendingShipInv:"\u0641\u0648\u0627\u062a\u064a\u0631 \u0645\u0639\u0644\u0642\u0629 \u0644\u0644\u0634\u062d\u0646",
    selectAll:"\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0643\u0644", clearAll:"\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0643\u0644",
    tripCreated:"\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0648\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u062d\u0644\u0629!",
    tripReceived:"\u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0631\u062d\u0644\u0629!",
    dcRiyadh:"\u0645\u0631\u0643\u0632 \u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0631\u064a\u0627\u0636",
    dcJeddah:"\u0645\u0631\u0643\u0632 \u062a\u0648\u0632\u064a\u0639 \u062c\u062f\u0629",
    dcDammam:"\u0645\u0631\u0643\u0632 \u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u062f\u0645\u0627\u0645",
  }
};

export default function Trips({ user, trips, setTrips, invoices, setInvoices, lang }) {
  const [showForm, setShowForm] = useState(false);
  const [done, setDone] = useState("");
  const [selInv, setSelInv] = useState([]);
  const [form, setForm] = useState({
    tripNumber: "", date: new Date().toISOString().split("T")[0],
    toCity: "", driver: "", vehicle: "",
    storage: "Ambient (15-25\u00b0C)", notes: ""
  });

  const rtl = lang === "ar";
  const t = T[lang] || T.en;
  const dc = user.dc || "Riyadh";
  const isAdmin = user.role === "admin";

  const myTrips = isAdmin
    ? trips
    : trips.filter(tr => tr.fromDC === dc || tr.toCity === "DC-" + dc || tr.toCity === dc);

  // Pending shipment invoices for this DC's destination
  const getPendingShipInvoices = (destDC) => {
    if (!destDC || !destDC.startsWith("DC-")) return [];
    const targetDC = destDC.replace("DC-", "");
    return invoices.filter(i => i.status === "hold_ship" && i.dc === targetDC && i.holdOrigin === dc);
  };

  const pendingShipInv = form.toCity ? getPendingShipInvoices(form.toCity) : [];

  function createTrip() {
    if (!form.toCity || !form.driver || !form.vehicle) return;
    const tripNum = form.tripNumber || "TRIP-" + new Date().getFullYear() + "-" + String(Math.floor(1000 + Math.random() * 9000));
    const dest = TRIP_DESTINATIONS.find(d => d.value === form.toCity);
    const newTrip = {
      id: tripNum, tripNumber: tripNum,
      date: form.date, fromDC: dc,
      toCity: form.toCity,
      toCityLabel: dest ? dest.label : form.toCity,
      driver: form.driver, vehicle: form.vehicle,
      storage: form.storage, status: "dispatched",
      invoiceIds: selInv, notes: form.notes,
      createdBy: user.name, createdAt: new Date().toLocaleString()
    };
    setTrips(prev => [...prev, newTrip]);
    if (selInv.length > 0) {
      setInvoices(prev => prev.map(i => selInv.includes(i.id) ? { ...i, status: "intransit", tripId: tripNum } : i));
    }
    setDone(t.tripCreated);
    setShowForm(false);
    setSelInv([]);
    setForm({ tripNumber:"", date:new Date().toISOString().split("T")[0], toCity:"", driver:"", vehicle:"", storage:"Ambient (15-25\u00b0C)", notes:"" });
    setTimeout(() => setDone(""), 4000);
  }

  function receiveTrip(tripId) {
    const trip = trips.find(tr => tr.id === tripId);
    setTrips(prev => prev.map(tr => tr.id === tripId ? { ...tr, status:"received", receivedBy:user.name, receivedAt:new Date().toLocaleString() } : tr));
    // Move hold_ship invoices to pending in this DC
    if (trip && trip.invoiceIds && trip.invoiceIds.length > 0) {
      setInvoices(prev => prev.map(i => trip.invoiceIds.includes(i.id) ? { ...i, status:"pending", holdType:null } : i));
    }
    setDone(t.tripReceived);
    setTimeout(() => setDone(""), 4000);
  }

  const statusColor = { dispatched:"#8b5cf6", received:"#10b981", closed:"#64748b" };
  const storageOptions = STORAGE_CONDITIONS.map(s => s.name + " (" + s.range + ")");

  // Pending invoices for this DC (for trip attachment)
  const pendingForTrip = invoices.filter(i => i.dc === dc && i.status === "pending");

  // Can receive: DC Manager whose DC matches trip destination
  function canReceive(trip) {
    if (isAdmin) return false;
    if (trip.status !== "dispatched") return false;
    return trip.toCity === "DC-" + dc || trip.toCity === dc;
  }

  return (
    <div style={{ direction: rtl ? "rtl" : "ltr" }}>
      {done && <SuccessMsg msg={done} />}

      {(user.role === "manager" || isAdmin) && (
        <Btn onClick={() => setShowForm(!showForm)} style={{ marginBottom:16 }}>
          {showForm ? t.cancel : "\u2795 " + t.newTrip}
        </Btn>
      )}

      {showForm && (
        <Card>
          <CardTitle>\ud83d\ude9a {t.newTrip} — {dc} DC</CardTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
            <Input label={t.tripNo} value={form.tripNumber} onChange={v => setForm({...form, tripNumber:v})} placeholder="TRIP-2026-001 (manual)" />
            <Input label={t.tripDate} value={form.date} onChange={v => setForm({...form, date:v})} type="date" />

            {/* Destination Dropdown with groups */}
            <div style={{ gridColumn:"1/-1", marginBottom:12 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:5 }}>{t.destination} *</label>
              <select value={form.toCity} onChange={e => setForm({...form, toCity:e.target.value})}
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", background:"white", boxSizing:"border-box" }}>
                <option value="">Select destination...</option>
                <optgroup label="Distribution Centers">
                  {TRIP_DESTINATIONS.filter(d => d.type === "dc" && d.value !== "DC-"+dc).map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Delivery Cities">
                  {TRIP_DESTINATIONS.filter(d => d.type === "city").map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <Select label={t.driver+" *"} value={form.driver} onChange={v => setForm({...form, driver:v})} options={DRIVERS_BY_DC[dc]||[]} required />
            <Select label={t.vehicle+" *"} value={form.vehicle} onChange={v => setForm({...form, vehicle:v})} options={VEHICLES_BY_DC[dc]||[]} required />
            <div style={{ gridColumn:"1/-1" }}>
              <Select label={t.storage} value={form.storage} onChange={v => setForm({...form, storage:v})} options={storageOptions} />
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <Input label={t.notes} value={form.notes} onChange={v => setForm({...form, notes:v})} />
            </div>
          </div>

          {/* Pending Shipment Invoices */}
          {pendingShipInv.length > 0 && (
            <div style={{ marginBottom:12, background:"#f0f9ff", borderRadius:8, padding:12 }}>
              <div style={{ fontWeight:600, fontSize:13, color:"#0369a1", marginBottom:8 }}>\ud83d\udce6 {t.pendingShipInv} ({pendingShipInv.length})</div>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <Btn small onClick={() => setSelInv(pendingShipInv.map(i => i.id))} color="#0369a1">{t.selectAll}</Btn>
                <Btn small onClick={() => setSelInv([])} color="#64748b">{t.clearAll}</Btn>
              </div>
              {pendingShipInv.map(inv => (
                <div key={inv.id} onClick={() => setSelInv(p => p.includes(inv.id) ? p.filter(x => x !== inv.id) : [...p, inv.id])}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", border:`1px solid ${selInv.includes(inv.id)?"#0369a1":"#e2e8f0"}`, background:selInv.includes(inv.id)?"#e0f2fe":"white", borderRadius:8, cursor:"pointer", marginBottom:4 }}>
                  <span style={{ color:"#0369a1" }}>{selInv.includes(inv.id)?"\u2611":"\u2610"}</span>
                  <span style={{ fontWeight:600, fontSize:13 }}>{inv.id}</span>
                  <span style={{ fontSize:12, color:"#64748b" }}>{inv.customer}</span>
                </div>
              ))}
            </div>
          )}

          {/* Regular pending invoices */}
          {pendingForTrip.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontWeight:600, fontSize:13, color:"#374151", marginBottom:8 }}>\ud83d\udccb {t.attachInv}</div>
              {pendingForTrip.map(inv => (
                <div key={inv.id} onClick={() => setSelInv(p => p.includes(inv.id) ? p.filter(x => x !== inv.id) : [...p, inv.id])}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", border:`1px solid ${selInv.includes(inv.id)?"#6366f1":"#e2e8f0"}`, background:selInv.includes(inv.id)?"#eef2ff":"white", borderRadius:8, cursor:"pointer", marginBottom:4 }}>
                  <span style={{ color:"#6366f1" }}>{selInv.includes(inv.id)?"\u2611":"\u2610"}</span>
                  <span style={{ fontWeight:600, fontSize:13 }}>{inv.id}</span>
                  <span style={{ fontSize:12, color:"#64748b" }}>{inv.customer}</span>
                </div>
              ))}
            </div>
          )}

          <Btn onClick={createTrip} color="#10b981" style={{ width:"100%", padding:12 }} disabled={!form.toCity||!form.driver||!form.vehicle}>
            \ud83d\ude80 {t.createBtn}
          </Btn>
        </Card>
      )}

      <Card>
        <CardTitle>\ud83d\udccb {t.allTrips} ({myTrips.length})</CardTitle>
        {myTrips.length === 0 && <div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>{t.noTrips}</div>}
        {[...myTrips].reverse().map(trip => (
          <div key={trip.id} style={{ border:"1px solid #e2e8f0", borderRadius:8, padding:14, marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, flexWrap:"wrap", gap:6 }}>
              <span style={{ fontWeight:800, color:"#6366f1", fontSize:15 }}>{trip.tripNumber||trip.id}</span>
              <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99, background:statusColor[trip.status]+"22", color:statusColor[trip.status] }}>
                {trip.status === "dispatched" ? t.dispatched : t.received}
              </span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:6, fontSize:13, color:"#374151" }}>
              <div>\ud83d\udce6 <b>{t.from}</b> {trip.fromDC} DC</div>
              <div>\ud83d\udccd <b>{t.to}</b> {trip.toCityLabel||trip.toCity}</div>
              <div>\ud83d\udc64 <b>{t.driver}:</b> {trip.driver}</div>
              <div>\ud83d\ude97 <b>{t.vehicle}:</b> {trip.vehicle}</div>
              <div>\ud83d\udcc5 <b>{t.tripDate}:</b> {trip.date}</div>
              {trip.invoiceIds && trip.invoiceIds.length > 0 && (
                <div>\ud83d\udccb Invoices: {trip.invoiceIds.length}</div>
              )}
            </div>
            {trip.notes && <div style={{ fontSize:12, color:"#64748b", marginTop:6 }}>\ud83d\udcdd {trip.notes}</div>}
            {trip.receivedBy && <div style={{ fontSize:12, color:"#10b981", marginTop:4 }}>\u2705 Received by: {trip.receivedBy} — {trip.receivedAt}</div>}
            {canReceive(trip) && (
              <Btn small onClick={() => receiveTrip(trip.id)} color="#10b981" style={{ marginTop:8 }}>
                \u2705 {t.confirmReceipt}
              </Btn>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
