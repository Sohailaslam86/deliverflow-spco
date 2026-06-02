import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardTitle, Btn, Badge, EmptyState, StatCard } from "../components/Shared.jsx";
import { STATUS_STYLES } from "../data/masterData.js";

const T = {
  en: {
    overall:"Overall Performance", search:"Search invoice # or customer...",
    allStatus:"All Status", noResults:"No invoices found",
    schedHold:"Schedule Hold", holdType:"Hold Type",
    confirmed:"Confirmed Date", awaitResp:"Awaiting Response",
    pendShip:"Pending Shipment Movement", holdDate:"Delivery Date",
    holdEstDate:"Estimated Date (optional)", holdOrigin:"Origin Distribution Center",
    holdReason:"Reason", saveHold:"Save Hold", cancel:"Cancel",
    unlock:"Unlock Invoice", total:"Total", delivered:"Delivered",
    pending:"Pending", assigned:"Assigned", failed:"Failed",
    outstanding:"Outstanding", inTransit:"In Transit", scheduled:"Scheduled",
    inCity:"In-City", outCity:"Out-City",
    riyadhDC:"Riyadh Distribution Center",
    jeddahDC:"Jeddah Distribution Center",
    dammamDC:"Dammam Distribution Center",
    invoices:"invoices", fromDate:"From", toDate:"To", clearFilter:"Clear",
    turnaround:"Turnaround"
  },
  ar: {
    overall:"الأداء العام",
    search:"بحث برقم الفاتورة أو العميل",
    allStatus:"جميع الحالات", noResults:"لا توجد فواتير",
    schedHold:"تعليق التسليم", holdType:"نوع التعليق",
    confirmed:"تاريخ مؤكد", awaitResp:"بانتظار الرد",
    pendShip:"شحنة معلقة", holdDate:"تاريخ التسليم",
    holdEstDate:"تاريخ تقريبي", holdOrigin:"مركز التوزيع المصدر",
    holdReason:"السبب", saveHold:"حفظ التعليق", cancel:"إلغاء",
    unlock:"إلغاء التعليق", total:"الإجمالي", delivered:"مسلمة",
    pending:"معلقة", assigned:"مخصصة", failed:"فاشلة",
    outstanding:"متأخرة", inTransit:"في الطريق", scheduled:"مجدولة",
    inCity:"داخل المدينة", outCity:"خارج المدينة",
    riyadhDC:"مركز توزيع الرياض",
    jeddahDC:"مركز توزيع جدة",
    dammamDC:"مركز توزيع الدمام",
    invoices:"فواتير", fromDate:"من", toDate:"إلى", clearFilter:"مسح",
    turnaround:"وقت الدوران"
  }
};

const DCS = ["Riyadh","Jeddah","Dammam"];
const DC_COLORS = { Riyadh:"#1A3A5C", Jeddah:"#0f766e", Dammam:"#7c3aed" };

function dcLabel(dc, t) {
  if (dc==="Riyadh") return t.riyadhDC;
  if (dc==="Jeddah") return t.jeddahDC;
  return t.dammamDC;
}

// Central DC filter — sirf apna DC, ya sab agar Head Office/Admin
function getUserDC(user) {
  if (!user.dc || user.dc === "Head Office") return null;
  return user.dc;
}

function calcTurnaround(inv) {
  if (inv.status!=="delivered"||!inv.deliveredAt) return null;
  return Math.floor((new Date(inv.deliveredAt)-new Date(inv.date))/(1000*60*60*24));
}

export default function Invoices({ user, invoices, setInvoices, lang }) {
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [holdInv, setHoldInv] = useState(null);
  const [holdForm, setHoldForm] = useState({ type:"confirmed", date:"", estDate:"", origin:"Riyadh", reason:"" });

  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const isAdmin = user.role==="admin";
  const isManager = user.role==="manager";

  // DC filter — ALWAYS apply for non-admin, non-Head-Office users
  const userDC = getUserDC(user);

  useEffect(() => { loadInvoices(); }, []);

  async function loadInvoices() {
    try {
      const snap = await getDocs(collection(db, "invoices"));
      const data = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
      setInvoices(data);
    } catch(e) { console.error("Invoices load error:", e); }
  }

  // Base — filtered by user's DC
  const base = userDC ? invoices.filter(i=>i.dc===userDC&&i.uploadBatch) : invoices.filter(i=>i.uploadBatch);

  const filtered = base.filter(inv=>{
    const mQ = !search||inv.id?.toLowerCase().includes(search.toLowerCase())||inv.customer?.toLowerCase().includes(search.toLowerCase());
    const mS = statusF==="all"||inv.status===statusF;
    const mFrom = !dateFrom||inv.date>=dateFrom;
    const mTo = !dateTo||inv.date<=dateTo;
    return mQ&&mS&&mFrom&&mTo;
  });

  const del = base.filter(i=>i.status==="delivered").length;

  async function saveHold() {
    if (!holdInv) return;
    let newStatus = "scheduled";
    if (holdForm.type==="hold_await") newStatus="hold_await";
    if (holdForm.type==="hold_ship") newStatus="hold_ship";
    const updateData = {
      status: newStatus, holdType: holdForm.type,
      holdDate: holdForm.date, holdEstDate: holdForm.estDate,
      holdOrigin: holdForm.origin, holdReason: holdForm.reason,
      holdRaisedDate: new Date().toISOString().split("T")[0]
    };
    if (holdInv.firestoreId) {
      try { await updateDoc(doc(db, "invoices", holdInv.firestoreId), updateData); } catch(e) { console.error(e); }
    }
    setInvoices(prev=>prev.map(i=>i.id===holdInv.id?{...i,...updateData}:i));
    setHoldInv(null);
  }

  async function unlockInv(inv) {
    const updateData = { status:"pending", holdType:null };
    if (inv.firestoreId) {
      try { await updateDoc(doc(db, "invoices", inv.firestoreId), updateData); } catch(e) { console.error(e); }
    }
    setInvoices(prev=>prev.map(i=>i.id===inv.id?{...i,...updateData}:i));
  }

  const days = inv => Math.floor((new Date()-new Date(inv.date))/(1000*60*60*24));

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>

      {/* Overall Performance — DC specific title */}
      <Card style={{ borderTop:"4px solid #1A3A5C", marginBottom:16 }}>
        <CardTitle>
          📊 {t.overall} — {userDC ? dcLabel(userDC,t) : "All Distribution Centers"}
        </CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:8 }}>
          <StatCard icon="📋" label={t.total} value={base.length} color="#6366f1" />
          <StatCard icon="✅" label={t.delivered} value={del} color="#10b981" />
          <StatCard icon="⏳" label={t.pending} value={base.filter(i=>i.status==="pending").length} color="#f59e0b" />
          <StatCard icon="👤" label={t.assigned} value={base.filter(i=>i.status==="assigned").length} color="#3b82f6" />
          <StatCard icon="❌" label={t.failed} value={base.filter(i=>i.status==="failed").length} color="#ef4444" />
          <StatCard icon="⚠️" label={t.outstanding} value={base.filter(i=>i.status==="outstanding").length} color="#f97316" />
          <StatCard icon="🚚" label={t.inTransit} value={base.filter(i=>i.status==="intransit").length} color="#8b5cf6" />
          <StatCard icon="📅" label={t.scheduled} value={base.filter(i=>["scheduled","hold_await","hold_ship"].includes(i.status)).length} color="#a855f7" />
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}
            style={{ flex:1, minWidth:200, border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none" }} />
          <select value={statusF} onChange={e=>setStatusF(e.target.value)}
            style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:14, outline:"none", background:"white" }}>
            <option value="all">{t.allStatus}</option>
            {Object.entries(STATUS_STYLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
        </div>

        {/* Date Range */}
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:14, flexWrap:"wrap" }}>
          <span style={{ fontSize:14, color:"#64748b" }}>📅 {t.fromDate}:</span>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none" }} />
          <span style={{ fontSize:14, color:"#64748b" }}>{t.toDate}:</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none" }} />
          {(dateFrom||dateTo)&&(
            <button onClick={()=>{setDateFrom("");setDateTo("");}}
              style={{ background:"#f1f5f9", border:"none", borderRadius:6, padding:"8px 14px", cursor:"pointer", fontSize:13, color:"#64748b", fontWeight:600 }}>
              ✕ {t.clearFilter}
            </button>
          )}
        </div>

        <div style={{ fontSize:14, color:"#94a3b8", marginBottom:12 }}>{filtered.length} {t.invoices}</div>
        {filtered.length===0&&<EmptyState icon="📋" title={t.noResults} />}

        {filtered.map(inv=>{
          const d = days(inv);
          const isHeld = ["scheduled","hold_await","hold_ship"].includes(inv.status);
          const tat = calcTurnaround(inv);
          return (
            <div key={inv.id||inv.firestoreId} style={{ border:`1px solid ${isHeld?"#a855f7":"#e2e8f0"}`, borderRadius:8, padding:14, marginBottom:10, background:isHeld?"#faf5ff":"white" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                <span style={{ fontWeight:700, fontSize:14, color:"#6366f1" }}>{inv.id}</span>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <Badge status={inv.status} />
                  <span style={{ fontSize:12, fontWeight:600, padding:"2px 8px", borderRadius:99, background:d<=1?"#d1fae5":d<=3?"#fef3c7":"#fee2e2", color:d<=1?"#065f46":d<=3?"#92400e":"#991b1b" }}>{d}d</span>
                  {inv.dtype&&<span style={{ fontSize:12, padding:"2px 6px", borderRadius:6, background:inv.dtype==="incity"?"#dbeafe":"#fef3c7", color:inv.dtype==="incity"?"#1e40af":"#92400e" }}>{inv.dtype==="incity"?t.inCity:t.outCity}</span>}
                </div>
              </div>
              <div style={{ fontWeight:600, fontSize:15, marginBottom:6 }}>{inv.customer}</div>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", fontSize:13, color:"#64748b", marginBottom:8 }}>
                <span>📍 {inv.dc} Distribution Center</span>
                <span>📅 {inv.date}</span>
                {inv.storage&&<span>🌡️ {inv.storage}</span>}
                {inv.vehicle&&<span>🚗 {inv.vehicle}</span>}
                {inv.driverName&&<span>👤 {inv.driverName}</span>}
                {tat!==null&&<span style={{ fontWeight:600, color:"#6366f1" }}>⏱️ {t.turnaround}: {tat}d</span>}
              </div>
              {isHeld&&inv.holdReason&&(
                <div style={{ background:"#f3e8ff", borderRadius:6, padding:"6px 10px", fontSize:13, color:"#6b21a8", marginBottom:10 }}>
                  📌 {inv.holdReason}
                  {inv.holdDate&&<span> | Date: {inv.holdDate}</span>}
                  {inv.holdOrigin&&<span> | From: {inv.holdOrigin} Distribution Center</span>}
                </div>
              )}
              {(isAdmin||isManager)&&!["delivered","intransit"].includes(inv.status)&&(
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {!isHeld&&(
                    <Btn small onClick={()=>{setHoldInv(inv);setHoldForm({type:"confirmed",date:"",estDate:"",origin:userDC||"Riyadh",reason:""});}} color="#a855f7">
                      📅 {t.schedHold}
                    </Btn>
                  )}
                  {isHeld&&(
                    <Btn small onClick={()=>unlockInv(inv)} color="#10b981">🔓 {t.unlock}</Btn>
                  )}
                </div>
              )}
              {holdInv?.id===inv.id&&(
                <div style={{ marginTop:10, padding:14, background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0" }}>
                  <div style={{ fontWeight:600, fontSize:14, marginBottom:10 }}>📅 {t.schedHold}</div>
                  <div style={{ marginBottom:10 }}>
                    <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>{t.holdType}</label>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {[["confirmed",t.confirmed],["hold_await",t.awaitResp],["hold_ship",t.pendShip]].map(([v,l])=>(
                        <button key={v} onClick={()=>setHoldForm({...holdForm,type:v})}
                          style={{ padding:"8px 14px", borderRadius:8, border:`2px solid ${holdForm.type===v?"#a855f7":"#e2e8f0"}`, background:holdForm.type===v?"#faf5ff":"white", color:holdForm.type===v?"#7c3aed":"#64748b", cursor:"pointer", fontSize:13, fontWeight:600 }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  {holdForm.type==="confirmed"&&(
                    <div style={{ marginBottom:10 }}>
                      <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{t.holdDate} *</label>
                      <input type="date" value={holdForm.date} onChange={e=>setHoldForm({...holdForm,date:e.target.value})}
                        style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" }} />
                    </div>
                  )}
                  {holdForm.type==="hold_await"&&(
                    <div style={{ marginBottom:10 }}>
                      <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{t.holdEstDate}</label>
                      <input type="date" value={holdForm.estDate} onChange={e=>setHoldForm({...holdForm,estDate:e.target.value})}
                        style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" }} />
                    </div>
                  )}
                  {holdForm.type==="hold_ship"&&(
                    <div style={{ marginBottom:10 }}>
                      <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{t.holdOrigin}</label>
                      <select value={holdForm.origin} onChange={e=>setHoldForm({...holdForm,origin:e.target.value})}
                        style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", width:"100%", background:"white", boxSizing:"border-box" }}>
                        {DCS.map(d=><option key={d} value={d}>{d} Distribution Center</option>)}
                      </select>
                    </div>
                  )}
                  <div style={{ marginBottom:10 }}>
                    <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{t.holdReason} *</label>
                    <textarea value={holdForm.reason} onChange={e=>setHoldForm({...holdForm,reason:e.target.value})} rows={2}
                      style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }} />
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <Btn onClick={saveHold} color="#a855f7">✅ {t.saveHold}</Btn>
                    <Btn onClick={()=>setHoldInv(null)} color="#64748b">{t.cancel}</Btn>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
