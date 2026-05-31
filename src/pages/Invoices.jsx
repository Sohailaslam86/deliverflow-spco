import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardTitle, Btn, Badge, EmptyState, StatCard } from "../components/Shared.jsx";
import { STATUS_STYLES } from "../data/masterData.js";

const T = {
  en: {
    overall:"Overall Performance — All DCs", search:"Search invoice # or customer...",
    allStatus:"All Status", allDCs:"All DCs", noResults:"No invoices found",
    schedHold:"Schedule Hold", holdType:"Hold Type",
    confirmed:"Confirmed Date", awaitResp:"Awaiting Response",
    pendShip:"Pending Shipment Movement", holdDate:"Delivery Date",
    holdEstDate:"Estimated Date (optional)", holdOrigin:"Origin DC",
    holdReason:"Reason", saveHold:"Save Hold", cancel:"Cancel",
    unlock:"Unlock Invoice", total:"Total", delivered:"Delivered",
    pending:"Pending", assigned:"Assigned", failed:"Failed",
    outstanding:"Outstanding", inTransit:"In Transit", scheduled:"Scheduled",
    inCity:"In-City", outCity:"Out-City",
    riyadhDC:"Riyadh DC", jeddahDC:"Jeddah DC", dammamDC:"Dammam DC",
    invoices:"invoices", fromDate:"From", toDate:"To", clearFilter:"Clear",
    turnaround:"Turnaround"
  },
  ar: {
    overall:"الأداء العام — جميع مراكز التوزيع",
    search:"بحث برقم الفاتورة أو العميل",
    allStatus:"جميع الحالات", allDCs:"جميع المراكز", noResults:"لا توجد فواتير",
    schedHold:"تعليق التسليم", holdType:"نوع التعليق",
    confirmed:"تاريخ مؤكد", awaitResp:"بانتظار الرد",
    pendShip:"شحنة معلقة", holdDate:"تاريخ التسليم",
    holdEstDate:"تاريخ تقريبي", holdOrigin:"مركز المصدر",
    holdReason:"السبب", saveHold:"حفظ التعليق", cancel:"إلغاء",
    unlock:"إلغاء التعليق", total:"الإجمالي", delivered:"مسلمة",
    pending:"معلقة", assigned:"مخصصة", failed:"فاشلة",
    outstanding:"متأخرة", inTransit:"في الطريق", scheduled:"مجدولة",
    inCity:"داخل المدينة", outCity:"خارج المدينة",
    riyadhDC:"الرياض", jeddahDC:"جدة", dammamDC:"الدمام",
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

function calcTurnaround(inv) {
  if (inv.status!=="delivered"||!inv.deliveredAt) return null;
  const upload = new Date(inv.date);
  const delivered = new Date(inv.deliveredAt);
  const diffDays = Math.floor((delivered-upload)/(1000*60*60*24));
  return diffDays;
}

function DCInvoiceBox({ dc, invoices, t }) {
  const color = DC_COLORS[dc];
  const inv = invoices.filter(i=>i.dc===dc);
  const countable = inv.filter(i=>!["scheduled","hold_await","hold_ship","intransit"].includes(i.status));
  const del = inv.filter(i=>i.status==="delivered").length;
  const rate = countable.length>0?Math.round(del/countable.length*100):0;
  return (
    <Card style={{ borderTop:`4px solid ${color}` }}>
      <CardTitle style={{ color }}>📍 {dcLabel(dc,t)}</CardTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:8 }}>
        <StatCard icon="📋" label={t.total} value={inv.length} color={color} />
        <StatCard icon="✅" label={t.delivered} value={del} color="#10b981" />
        <StatCard icon="⏳" label={t.pending} value={inv.filter(i=>i.status==="pending").length} color="#f59e0b" />
        <StatCard icon="👤" label={t.assigned} value={inv.filter(i=>i.status==="assigned").length} color="#3b82f6" />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:8 }}>
        <StatCard icon="❌" label={t.failed} value={inv.filter(i=>i.status==="failed").length} color="#ef4444" />
        <StatCard icon="⚠️" label={t.outstanding} value={inv.filter(i=>i.status==="outstanding").length} color="#f97316" />
        <StatCard icon="🚚" label={t.inTransit} value={inv.filter(i=>i.status==="intransit").length} color="#8b5cf6" />
        <StatCard icon="📅" label={t.scheduled} value={inv.filter(i=>["scheduled","hold_await","hold_ship"].includes(i.status)).length} color="#a855f7" />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
        <span style={{ fontWeight:600 }}>Delivery Rate</span>
        <span style={{ fontWeight:800, color:rate>=80?"#10b981":rate>=50?"#f59e0b":"#ef4444" }}>{rate}%</span>
      </div>
      <div style={{ background:"#f1f5f9", borderRadius:99, height:6, overflow:"hidden" }}>
        <div style={{ width:`${rate}%`, height:"100%", background:rate>=80?"#10b981":rate>=50?"#f59e0b":"#ef4444", borderRadius:99 }} />
      </div>
    </Card>
  );
}

export default function Invoices({ user, invoices, setInvoices, lang }) {
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [dcF, setDcF] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [holdInv, setHoldInv] = useState(null);
  const [holdForm, setHoldForm] = useState({ type:"confirmed", date:"", estDate:"", origin:"Riyadh", reason:"" });

  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const isAdmin = user.role==="admin";
  const isManager = user.role==="manager";
  const dc = user.dc==="Head Office" ? null : user.dc;

  // Firestore se invoices load karo
  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      const snap = await getDocs(collection(db, "invoices"));
      const data = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
      setInvoices(data);
    } catch(e) { console.error("Invoices load error:", e); }
  }

  const base = dc ? invoices.filter(i=>i.dc===dc) : invoices;
  const filtered = base.filter(inv=>{
    const mQ = !search||inv.id?.toLowerCase().includes(search.toLowerCase())||inv.customer?.toLowerCase().includes(search.toLowerCase());
    const mS = statusF==="all"||inv.status===statusF;
    const mDC = !isAdmin||dcF==="all"||inv.dc===dcF;
    const mFrom = !dateFrom||inv.date>=dateFrom;
    const mTo = !dateTo||inv.date<=dateTo;
    return mQ&&mS&&mDC&&mFrom&&mTo;
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
    // Firestore update
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
      {/* Overall Performance */}
      <Card style={{ borderTop:"4px solid #1A3A5C", marginBottom:16 }}>
        <CardTitle>📊 {t.overall}</CardTitle>
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

      {/* DC Boxes — Admin only */}
      {isAdmin&&(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:12, marginBottom:16 }}>
          {DCS.map(d=><DCInvoiceBox key={d} dc={d} invoices={invoices} t={t} />)}
        </div>
      )}

      {/* Filters */}
      <Card>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}
            style={{ flex:1, minWidth:180, border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none" }} />
          <select value={statusF} onChange={e=>setStatusF(e.target.value)}
            style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:13, outline:"none", background:"white" }}>
            <option value="all">{t.allStatus}</option>
            {Object.entries(STATUS_STYLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          {isAdmin&&(
            <select value={dcF} onChange={e=>setDcF(e.target.value)}
              style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:13, outline:"none", background:"white" }}>
              <option value="all">{t.allDCs}</option>
              {DCS.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>

        {/* Date Range Filter */}
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12, flexWrap:"wrap" }}>
          <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>📅</span>
          <span style={{ fontSize:13, color:"#64748b" }}>{t.fromDate}:</span>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"7px 10px", fontSize:13, outline:"none" }} />
          <span style={{ fontSize:13, color:"#64748b" }}>{t.toDate}:</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"7px 10px", fontSize:13, outline:"none" }} />
          {(dateFrom||dateTo)&&(
            <button onClick={()=>{setDateFrom("");setDateTo("");}}
              style={{ background:"#f1f5f9", border:"none", borderRadius:6, padding:"6px 12px", cursor:"pointer", fontSize:12, color:"#64748b", fontWeight:600 }}>
              ✕ {t.clearFilter}
            </button>
          )}
        </div>

        <div style={{ fontSize:13, color:"#94a3b8", marginBottom:10 }}>{filtered.length} {t.invoices}</div>
        {filtered.length===0&&<EmptyState icon="📋" title={t.noResults} />}

        {filtered.map(inv=>{
          const d = days(inv);
          const isHeld = ["scheduled","hold_await","hold_ship"].includes(inv.status);
          const tat = calcTurnaround(inv);
          return (
            <div key={inv.id||inv.firestoreId} style={{ border:`1px solid ${isHeld?"#a855f7":"#e2e8f0"}`, borderRadius:8, padding:12, marginBottom:8, background:isHeld?"#faf5ff":"white" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6, marginBottom:6 }}>
                <span style={{ fontWeight:700, fontSize:13, color:"#6366f1" }}>{inv.id}</span>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <Badge status={inv.status} />
                  <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:99, background:d<=1?"#d1fae5":d<=3?"#fef3c7":"#fee2e2", color:d<=1?"#065f46":d<=3?"#92400e":"#991b1b" }}>{d}d</span>
                  {inv.dtype&&<span style={{ fontSize:11, padding:"2px 6px", borderRadius:6, background:inv.dtype==="incity"?"#dbeafe":"#fef3c7", color:inv.dtype==="incity"?"#1e40af":"#92400e" }}>{inv.dtype==="incity"?t.inCity:t.outCity}</span>}
                </div>
              </div>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>{inv.customer}</div>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", fontSize:12, color:"#64748b", marginBottom:6 }}>
                <span>📍 {inv.dc} DC</span>
                <span>📅 {inv.date}</span>
                {inv.storage&&<span>🌡️ {inv.storage}</span>}
                {inv.vehicle&&<span>🚗 {inv.vehicle}</span>}
                {inv.driverName&&<span>👤 {inv.driverName}</span>}
                {inv.uploadBatch&&<span style={{ color:"#94a3b8" }}>{inv.uploadBatch}</span>}
                {tat!==null&&<span style={{ fontWeight:600, color:"#6366f1" }}>⏱️ {t.turnaround}: {tat} day{tat!==1?"s":""}</span>}
              </div>
              {isHeld&&inv.holdReason&&(
                <div style={{ background:"#f3e8ff", borderRadius:6, padding:"6px 10px", fontSize:12, color:"#6b21a8", marginBottom:8 }}>
                  📌 {inv.holdReason}
                  {inv.holdDate&&<span> | Date: {inv.holdDate}</span>}
                  {inv.holdEstDate&&<span> | Est: {inv.holdEstDate}</span>}
                  {inv.holdOrigin&&<span> | From: {inv.holdOrigin} DC</span>}
                </div>
              )}
              {(isAdmin||isManager)&&!["delivered","intransit"].includes(inv.status)&&(
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {!isHeld&&(
                    <Btn small onClick={()=>{setHoldInv(inv);setHoldForm({type:"confirmed",date:"",estDate:"",origin:"Riyadh",reason:""});}} color="#a855f7">
                      📅 {t.schedHold}
                    </Btn>
                  )}
                  {isHeld&&(isAdmin||(isManager&&inv.dc===dc))&&(
                    <Btn small onClick={()=>unlockInv(inv)} color="#10b981">🔓 {t.unlock}</Btn>
                  )}
                </div>
              )}
              {holdInv?.id===inv.id&&(
                <div style={{ marginTop:10, padding:12, background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0" }}>
                  <div style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>📅 {t.schedHold}</div>
                  <div style={{ marginBottom:10 }}>
                    <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>{t.holdType}</label>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {[["confirmed",t.confirmed],["hold_await",t.awaitResp],["hold_ship",t.pendShip]].map(([v,l])=>(
                        <button key={v} onClick={()=>setHoldForm({...holdForm,type:v})}
                          style={{ padding:"7px 14px", borderRadius:8, border:`2px solid ${holdForm.type===v?"#a855f7":"#e2e8f0"}`, background:holdForm.type===v?"#faf5ff":"white", color:holdForm.type===v?"#7c3aed":"#64748b", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  {holdForm.type==="confirmed"&&(
                    <div style={{ marginBottom:8 }}>
                      <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{t.holdDate} *</label>
                      <input type="date" value={holdForm.date} onChange={e=>setHoldForm({...holdForm,date:e.target.value})}
                        style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" }} />
                    </div>
                  )}
                  {holdForm.type==="hold_await"&&(
                    <div style={{ marginBottom:8 }}>
                      <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{t.holdEstDate}</label>
                      <input type="date" value={holdForm.estDate} onChange={e=>setHoldForm({...holdForm,estDate:e.target.value})}
                        style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" }} />
                    </div>
                  )}
                  {holdForm.type==="hold_ship"&&(
                    <div style={{ marginBottom:8 }}>
                      <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{t.holdOrigin}</label>
                      <select value={holdForm.origin} onChange={e=>setHoldForm({...holdForm,origin:e.target.value})}
                        style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", width:"100%", background:"white", boxSizing:"border-box" }}>
                        {DCS.map(d=><option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  )}
                  <div style={{ marginBottom:10 }}>
                    <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{t.holdReason} *</label>
                    <textarea value={holdForm.reason} onChange={e=>setHoldForm({...holdForm,reason:e.target.value})} rows={2}
                      style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }} />
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
