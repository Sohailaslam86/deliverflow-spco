import { useState } from "react";
import { Card, CardTitle, Btn, Badge, EmptyState } from "../components/Shared.jsx";
import { STATUS_STYLES } from "../data/masterData.js";

const T = {
  en: {
    title:"All Invoices", search:"Search invoice # or customer...",
    allStatus:"All Status", allDCs:"All DCs", filter:"Filter",
    invoice:"Invoice #", date:"Date", customer:"Customer", dc:"DC",
    status:"Status", driver:"Driver", storage:"Storage", type:"Type",
    inCity:"In-City", outCity:"Out-City", noResults:"No invoices found",
    schedHold:"Schedule Hold", holdType:"Hold Type",
    confirmed:"Confirmed Date", awaitResp:"Awaiting Response",
    pendShip:"Pending Shipment Movement", holdDate:"Delivery Date",
    holdEstDate:"Estimated Date (optional)", holdOrigin:"Origin DC",
    holdReason:"Reason", saveHold:"Save Hold", cancel:"Cancel",
    unlock:"Unlock", lock:"Locked", overall:"Overall Performance",
    total:"Total", delivered:"Delivered", pending:"Pending",
    assigned:"Assigned", failed:"Failed", outstanding:"Outstanding",
    inTransit:"In Transit", scheduled:"Scheduled", agingDays:"Age"
  },
  ar: {
    title:"\u062c\u0645\u064a\u0639 \u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631",
    search:"\u0628\u062d\u062b \u0628\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u0623\u0648 \u0627\u0644\u0639\u0645\u064a\u0644",
    allStatus:"\u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0627\u0644\u0627\u062a",
    allDCs:"\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0631\u0627\u0643\u0632",
    filter:"\u062a\u0635\u0641\u064a\u0629",
    invoice:"\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629",
    date:"\u0627\u0644\u062a\u0627\u0631\u064a\u062e",
    customer:"\u0627\u0644\u0639\u0645\u064a\u0644",
    dc:"\u0645\u0631\u0643\u0632 \u0627\u0644\u062a\u0648\u0632\u064a\u0639",
    status:"\u0627\u0644\u062d\u0627\u0644\u0629",
    driver:"\u0627\u0644\u0633\u0627\u0626\u0642", storage:"\u0627\u0644\u062a\u062e\u0632\u064a\u0646",
    type:"\u0627\u0644\u0646\u0648\u0639",
    inCity:"\u062f\u0627\u062e\u0644 \u0627\u0644\u0645\u062f\u064a\u0646\u0629",
    outCity:"\u062e\u0627\u0631\u062c \u0627\u0644\u0645\u062f\u064a\u0646\u0629",
    noResults:"\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u0648\u0627\u062a\u064a\u0631",
    schedHold:"\u062a\u0639\u0644\u064a\u0642 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    holdType:"\u0646\u0648\u0639 \u0627\u0644\u062a\u0639\u0644\u064a\u0642",
    confirmed:"\u062a\u0627\u0631\u064a\u062e \u0645\u0624\u0643\u062f",
    awaitResp:"\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0631\u062f",
    pendShip:"\u0634\u062d\u0646\u0629 \u0645\u0639\u0644\u0642\u0629",
    holdDate:"\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    holdEstDate:"\u062a\u0627\u0631\u064a\u062e \u062a\u0642\u0631\u064a\u0628\u064a",
    holdOrigin:"\u0645\u0631\u0643\u0632 \u0627\u0644\u0645\u0635\u062f\u0631",
    holdReason:"\u0627\u0644\u0633\u0628\u0628",
    saveHold:"\u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u0644\u064a\u0642",
    cancel:"\u0625\u0644\u063a\u0627\u0621",
    unlock:"\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u0639\u0644\u064a\u0642",
    lock:"\u0645\u0642\u0641\u0644", overall:"\u0627\u0644\u0623\u062f\u0627\u0621 \u0627\u0644\u0639\u0627\u0645",
    total:"\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a",
    delivered:"\u0645\u0633\u0644\u0645\u0629", pending:"\u0645\u0639\u0644\u0642\u0629",
    assigned:"\u0645\u062e\u0635\u0635\u0629", failed:"\u0641\u0627\u0634\u0644\u0629",
    outstanding:"\u0645\u062a\u0623\u062e\u0631\u0629",
    inTransit:"\u0641\u064a \u0627\u0644\u0637\u0631\u064a\u0642",
    scheduled:"\u0645\u062c\u062f\u0648\u0644\u0629",
    agingDays:"\u0627\u0644\u0639\u0645\u0631"
  }
};

const DCS = ["Riyadh","Jeddah","Dammam"];

export default function Invoices({ user, invoices, setInvoices, lang }) {
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [dcF, setDcF] = useState("all");
  const [holdInv, setHoldInv] = useState(null);
  const [holdForm, setHoldForm] = useState({ type:"confirmed", date:"", estDate:"", origin:"Riyadh", reason:"" });

  const rtl = lang === "ar";
  const t = T[lang] || T.en;
  const isAdmin = user.role === "admin";
  const isManager = user.role === "manager";
  const dc = user.dc;

  const base = dc ? invoices.filter(i => i.dc === dc) : invoices;
  const filtered = base.filter(inv => {
    const mQ = !search || inv.id.toLowerCase().includes(search.toLowerCase()) || inv.customer.toLowerCase().includes(search.toLowerCase());
    const mS = statusF === "all" || inv.status === statusF;
    const mDC = !isAdmin || dcF === "all" || inv.dc === dcF;
    return mQ && mS && mDC;
  });

  const countable = base.filter(i => !["scheduled","hold_await","hold_ship","intransit"].includes(i.status));
  const del = base.filter(i => i.status==="delivered").length;

  function saveHold() {
    if (!holdInv) return;
    let newStatus = "scheduled";
    if (holdForm.type === "hold_await") newStatus = "hold_await";
    if (holdForm.type === "hold_ship") newStatus = "hold_ship";
    setInvoices(prev => prev.map(i => i.id === holdInv.id ? {
      ...i, status:newStatus,
      holdType:holdForm.type,
      holdDate:holdForm.date,
      holdEstDate:holdForm.estDate,
      holdOrigin:holdForm.origin,
      holdReason:holdForm.reason,
      holdRaisedDate:new Date().toISOString().split("T")[0]
    } : i));
    setHoldInv(null);
  }

  function unlockInv(id) {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status:"pending", holdType:null } : i));
  }

  const days = inv => Math.floor((new Date()-new Date(inv.date))/(1000*60*60*24));

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>

      {/* Overall Performance */}
      <Card style={{ borderTop:"4px solid #1A3A5C", marginBottom:16 }}>
        <CardTitle>\ud83d\udcca {t.overall} {dc?"— "+dc+" DC":""}</CardTitle>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:13 }}>
          {[
            [t.total, base.length, "#6366f1"],
            [t.delivered, del, "#10b981"],
            [t.pending, base.filter(i=>i.status==="pending").length, "#f59e0b"],
            [t.assigned, base.filter(i=>i.status==="assigned").length, "#3b82f6"],
            [t.failed, base.filter(i=>i.status==="failed").length, "#ef4444"],
            [t.outstanding, base.filter(i=>i.status==="outstanding").length, "#f97316"],
            [t.inTransit, base.filter(i=>i.status==="intransit").length, "#8b5cf6"],
            [t.scheduled, base.filter(i=>["scheduled","hold_await","hold_ship"].includes(i.status)).length, "#a855f7"],
          ].map(([label,val,color]) => (
            <div key={label} style={{ textAlign:"center", minWidth:60 }}>
              <div style={{ fontWeight:900, fontSize:22, color }}>{val}</div>
              <div style={{ fontSize:11, color:"#94a3b8" }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:12 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}
            style={{ flex:1, minWidth:180, border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none" }} />
          <select value={statusF} onChange={e=>setStatusF(e.target.value)}
            style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:13, outline:"none", background:"white" }}>
            <option value="all">{t.allStatus}</option>
            {Object.entries(STATUS_STYLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          {isAdmin && (
            <select value={dcF} onChange={e=>setDcF(e.target.value)}
              style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:13, outline:"none", background:"white" }}>
              <option value="all">{t.allDCs}</option>
              {DCS.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>

        <div style={{ fontSize:13, color:"#94a3b8", marginBottom:10 }}>{filtered.length} invoices</div>

        {filtered.length===0 && <EmptyState icon="\ud83d\udccb" title={t.noResults} />}

        {filtered.map(inv => {
          const d = days(inv);
          const isHeld = ["scheduled","hold_await","hold_ship"].includes(inv.status);
          return (
            <div key={inv.id} style={{ border:`1px solid ${isHeld?"#a855f7":"#e2e8f0"}`, borderRadius:8, padding:12, marginBottom:8, background:isHeld?"#faf5ff":"white" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6, marginBottom:6 }}>
                <span style={{ fontWeight:700, fontSize:13, color:"#6366f1" }}>{inv.id}</span>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <Badge status={inv.status} />
                  <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:99, background:d<=1?"#d1fae5":d<=3?"#fef3c7":"#fee2e2", color:d<=1?"#065f46":d<=3?"#92400e":"#991b1b" }}>{d}d</span>
                  {inv.dtype && <span style={{ fontSize:11, padding:"2px 6px", borderRadius:6, background:inv.dtype==="incity"?"#dbeafe":"#fef3c7", color:inv.dtype==="incity"?"#1e40af":"#92400e" }}>{inv.dtype==="incity"?t.inCity:t.outCity}</span>}
                </div>
              </div>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>{inv.customer}</div>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", fontSize:12, color:"#64748b", marginBottom:6 }}>
                <span>\ud83d\udccd {inv.dc} DC</span>
                <span>\ud83d\udcc5 {inv.date}</span>
                {inv.storage&&<span>\ud83c\udf21\ufe0f {inv.storage}</span>}
                {inv.driver&&<span>\ud83d\udc64 {inv.driver}</span>}
                {inv.vehicle&&<span>\ud83d\ude97 {inv.vehicle}</span>}
                {inv.uploadBatch&&<span style={{ color:"#94a3b8" }}>{inv.uploadBatch}</span>}
              </div>

              {/* Hold Info */}
              {isHeld && inv.holdReason && (
                <div style={{ background:"#f3e8ff", borderRadius:6, padding:"6px 10px", fontSize:12, color:"#6b21a8", marginBottom:8 }}>
                  \ud83d\udccc {inv.holdReason}
                  {inv.holdDate&&<span> | Date: {inv.holdDate}</span>}
                  {inv.holdEstDate&&<span> | Est: {inv.holdEstDate}</span>}
                  {inv.holdOrigin&&<span> | From: {inv.holdOrigin} DC</span>}
                </div>
              )}

              {/* Actions */}
              {(isAdmin || isManager) && !["delivered","intransit"].includes(inv.status) && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {!isHeld && (
                    <Btn small onClick={()=>{ setHoldInv(inv); setHoldForm({type:"confirmed",date:"",estDate:"",origin:"Riyadh",reason:""}); }} color="#a855f7">
                      \ud83d\udcc5 {t.schedHold}
                    </Btn>
                  )}
                  {(isHeld && (isAdmin || (isManager && inv.dc===dc))) && (
                    <Btn small onClick={()=>unlockInv(inv.id)} color="#10b981">\ud83d\udd13 {t.unlock}</Btn>
                  )}
                </div>
              )}

              {/* Hold Form */}
              {holdInv?.id === inv.id && (
                <div style={{ marginTop:10, padding:12, background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0" }}>
                  <div style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>\ud83d\udcc5 {t.schedHold}</div>
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
                  {holdForm.type==="confirmed" && (
                    <div style={{ marginBottom:8 }}>
                      <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{t.holdDate} *</label>
                      <input type="date" value={holdForm.date} onChange={e=>setHoldForm({...holdForm,date:e.target.value})}
                        style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" }} />
                    </div>
                  )}
                  {holdForm.type==="hold_await" && (
                    <div style={{ marginBottom:8 }}>
                      <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{t.holdEstDate}</label>
                      <input type="date" value={holdForm.estDate} onChange={e=>setHoldForm({...holdForm,estDate:e.target.value})}
                        style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" }} />
                    </div>
                  )}
                  {holdForm.type==="hold_ship" && (
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
                    <Btn onClick={saveHold} color="#a855f7">\u2705 {t.saveHold}</Btn>
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
