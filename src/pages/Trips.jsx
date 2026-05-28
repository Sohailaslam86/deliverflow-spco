import { useState } from "react";
import { Card, CardTitle, Btn, Input, Select, SuccessMsg } from "../components/Shared.jsx";

const VEHICLES_BY_DC = {
  Riyadh: ["Dyna 5784", "BUS 2632", "BUS 2630", "BUS 2629", "BUS 4295", "Bus 4294", "BUS 2631", "Bus 2633", "Dyna 5789", "Dyna 5788"],
  Jeddah: ["BUS 2631", "Dyna 1217", "Dyna 5787", "Dyna 5786", "BUS 2629", "Dyna 5784", "BUS 4472", "BUS 2633", "Dyna 5789"],
  Dammam: ["BUS 4472", "Dyna 5789", "Dyna 5787"],
};

const translations = {
  en: {
    cancel: "Cancel",
    newTrip: "New Trip",
    createTitle: "Create New Trip from",
    tripDate: "📅 Trip Date",
    destCity: "📍 Destination City",
    driver: "👤 Driver",
    vehicle: "🚗 Vehicle",
    storage: "🌡️ Storage",
    notes: "📝 Notes",
    attachInv: "📋 Attach Transit Invoices (Optional)",
    createBtn: "🚀 Create & Dispatch Trip",
    allTrips: "📋 All Trips",
    noTrips: "No trips yet",
    from: "From:",
    to: "To:",
    invoices: "Invoices:",
    createdBy: "Created by:",
    receivedBy: "Received by:",
    confirmReceipt: "✅ Confirm Receipt",
    markReceived: "✅ Mark as Received",
    successDispatched: "created and dispatched!",
    successReceived: "Trip received! Transit invoices added to your queue."
  },
  ar: {
    cancel: "إلغاء",
    newTrip: "رحلة جديدة",
    createTitle: "إنشاء رحلة جديدة من مركز",
    tripDate: "📅 تاريخ الرحلة",
    destCity: "📍 مدينة الوجهة",
    driver: "👤 السائق",
    vehicle: "🚗 المركبة",
    storage: "🌡️ ظروف التخزين",
    notes: "📝 ملاحظات",
    attachInv: "📋 إرفاق فواتير العبور (اختياري)",
    createBtn: "🚀 إنشاء وإرسال الرحلة",
    allTrips: "📋 جميع الرحلات",
    noTrips: "لا توجد رحلات حالياً",
    from: "من:",
    to: "إلى:",
    invoices: "الفواتير:",
    createdBy: "أنشئت بواسطة:",
    receivedBy: "استلمت بواسطة:",
    confirmReceipt: "✅ تأكيد الاستلام",
    markReceived: "✅ تعيين كمستلمة",
    successDispatched: "تم إنشاؤها وإرسالها بنجاح!",
    successReceived: "تم استلام الرحلة! تمت إضافة الفواتير إلى طابورك."
  }
};

export default function Trips({ user, trips, setTrips, invoices, setInvoices, lang }) {
  const [showForm, setShowForm] = useState(false);
  const [done, setDone]         = useState("");
  const [selInv, setSelInv]     = useState([]);
  const [form, setForm]         = useState({ date: new Date().toISOString().split("T")[0], toCity: "", driver: "", vehicle: "", storage: "Ambient (15-25°C)", notes: "" });

  const rtl = lang === "ar";
  const t = translations[lang] || translations.en;

  const dc = user.dc || "Riyadh";
  const myTrips = user.role === "admin" ? trips : trips.filter(t => t.fromDC === dc || t.toCity === dc);

  function createTrip() {
    if (!form.toCity || !form.driver || !form.vehicle) return;
    const id = "TRIP-" + Math.floor(1000 + Math.random() * 9000);
    const newTrip = { id, date: form.date, fromDC: dc, toCity: form.toCity, driver: form.driver, vehicle: form.vehicle, storage: form.storage, status: "dispatched", invoiceIds: selInv, notes: form.notes, createdBy: user.name, createdAt: new Date().toLocaleString() };
    
    setTrips(prev => [...prev, newTrip]);
    if (selInv.length > 0) setInvoices(prev => prev.map(i => selInv.includes(i.id) ? { ...i, status: "intransit" } : i));
    
    setDone(`Trip ${id} ${t.successDispatched}`);
    setShowForm(false); setSelInv([]); setForm({ date: new Date().toISOString().split("T")[0], toCity: "", driver: "", vehicle: "", storage: "Ambient (15-25°C)", notes: "" });
    setTimeout(() => setDone(""), 4000);
  }

  function receiveTrip(tripId) {
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: "received", receivedBy: user.name } : t));
    setDone(t.successReceived);
    setTimeout(() => setDone(""), 4000);
  }

  const statusColor = { dispatched: "#8b5cf6", received: "#10b981", closed: "#64748b" };

  return (
    <div>
      {done && <SuccessMsg msg={done} />}
      {(user.role === "manager" || user.role === "admin") && (
        <Btn onClick={() => setShowForm(!showForm)} style={{ marginBottom: 16 }}>
          {showForm ? t.cancel : t.newTrip}
        </Btn>
      )}

      {showForm && (
        <Card>
          <CardTitle>{t.createTitle} {dc} DC</CardTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Input label={t.tripDate} value={form.date} onChange={v => setForm({ ...form, date: v })} type="date" />
            <Select label={t.destCity} value={form.toCity} onChange={v => setForm({ ...form, toCity: v })} options={["Jeddah", "Dammam", "Riyadh"].filter(c => c !== dc)} required />
            <Select label={t.driver} value={form.driver} onChange={v => setForm({ ...form, driver: v })} options={["Ahmed Al-Nasr", "Yousef Al-Harbi", "Ali Al-Saeed"]} required />
            <Select label={t.vehicle} value={form.vehicle} onChange={v => setForm({ ...form, vehicle: v })} options={VEHICLES_BY_DC[dc] || []} required />
            <Select label={t.storage} value={form.storage} options={["Ambient (15-25°C)", "Refrigerated (2-8°C)"]} onChange={v => setForm({ ...form, storage: v })} />
            <Input label={t.notes} value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
          </div>

          <Btn onClick={createTrip} color="#10b981" style={{ marginTop: 14, width: "100%" }} disabled={!form.toCity || !form.driver || !form.vehicle}>
            {t.createBtn}
          </Btn>
        </Card>
      )}

      <Card>
        <CardTitle>{t.allTrips} ({myTrips.length})</CardTitle>
        {myTrips.length === 0 && <div style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>{t.noTrips}</div>}
        {[...myTrips].reverse().map(trip => (
          <div key={trip.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "#6366f1" }}>{trip.id}</span>
              <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: statusColor[trip.status] + "22", color: statusColor[trip.status] }}>{trip.status.toUpperCase()}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 6, fontSize: 13 }}>
              <div>📦 <b>{t.from}</b> {trip.fromDC} DC</div>
              <div>📍 <b>{t.to}</b> {trip.toCity}</div>
              <div>👤 <b>{t.driver}</b> {trip.driver}</div>
              <div>🚗 <b>{t.vehicle}</b> {trip.vehicle}</div>
              <div>📅 <b>{t.tripDate}</b> {trip.date}</div>
            </div>
            {trip.status === "dispatched" && user.dc && trip.toCity === user.dc && (
              <Btn small onClick={() => receiveTrip(trip.id)} color="#10b981" style={{ marginTop: 8 }}>{t.confirmReceipt}</Btn>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
