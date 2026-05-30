import { useState } from "react";
import { Card, CardTitle, Btn, Badge } from "../components/Shared.jsx";
import { STATUS_STYLES } from "../data/masterData.js";

const T = {
  en: {
    title:"Search Invoices", placeholder:"Invoice # or Customer Name...",
    allStatus:"All Status", allDCs:"All DCs", searchBtn:"Search",
    results:"results", noResults:"No results found",
    dc:"DC", date:"Date", storage:"Storage", delivered:"Delivered",
    viewGPS:"View Delivery Location", podAvailable:"POD available"
  },
  ar: {
    title:"البحث عن الفواتير", placeholder:"رقم الفاتورة أو اسم العميل...",
    allStatus:"جميع الحالات", allDCs:"جميع المراكز", searchBtn:"بحث",
    results:"نتائج", noResults:"لا توجد نتائج",
    dc:"المركز", date:"التاريخ", storage:"التخزين", delivered:"تاريخ التسليم",
    viewGPS:"عرض موقع التسليم", podAvailable:"وثيقة التسليم متاحة"
  }
};

export default function Search({ user, invoices, lang }) {
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [dcF, setDcF] = useState(user.viewDC==="all"?"all":user.viewDC||"all");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const rtl = lang==="ar";
  const t = T[lang]||T.en;

  function doSearch() {
    const q = search.trim().toLowerCase();
    setResults(invoices.filter(i=>{
      const mQ = !q||i.id.toLowerCase().includes(q)||i.customer.toLowerCase().includes(q);
      const mS = statusF==="all"||i.status===statusF;
      const mDC = dcF==="all"||i.dc===dcF;
      const mView = user.viewDC==="all"||i.dc===user.viewDC;
      return mQ&&mS&&mDC&&mView;
    }));
    setSearched(true);
  }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      <Card>
        <CardTitle>🔍 {t.title}</CardTitle>
        <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()}
            placeholder={t.placeholder}
            style={{ flex:1, minWidth:180, border:"1.5px solid #e2e8f0", borderRadius:8, padding:"10px 12px", fontSize:14, outline:"none" }} />
          <select value={statusF} onChange={e=>setStatusF(e.target.value)}
            style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"10px 12px", fontSize:13, outline:"none", background:"white" }}>
            <option value="all">{t.allStatus}</option>
            {Object.entries(STATUS_STYLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          {user.viewDC==="all"&&(
            <select value={dcF} onChange={e=>setDcF(e.target.value)}
              style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"10px 12px", fontSize:13, outline:"none", background:"white" }}>
              <option value="all">{t.allDCs}</option>
              {["Riyadh","Jeddah","Dammam"].map(d=><option key={d} value={d}>{d} DC</option>)}
            </select>
          )}
          <Btn onClick={doSearch}>{t.searchBtn}</Btn>
        </div>

        {searched&&(
          <div>
            <div style={{ fontSize:13, color:"#94a3b8", marginBottom:10 }}>{results.length} {t.results}</div>
            {results.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8" }}>{t.noResults}</div>}
            {results.map(inv=>(
              <div key={inv.id} style={{ border:"1px solid #e2e8f0", borderRadius:8, padding:14, marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, flexWrap:"wrap", gap:6 }}>
                  <span style={{ fontWeight:700, fontSize:13, color:"#6366f1" }}>{inv.id}</span>
                  <Badge status={inv.status} />
                </div>
                <div style={{ fontWeight:600, fontSize:14, marginBottom:6 }}>{inv.customer}</div>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap", fontSize:12, color:"#64748b", marginBottom:8 }}>
                  <span>📍 {inv.dc} DC</span>
                  <span>📅 {inv.date}</span>
                  {inv.storage&&<span>🌡️ {inv.storage}</span>}
                  {inv.deliveredAt&&<span>✅ {inv.deliveredAt}</span>}
                  {inv.uploadBatch&&<span style={{ color:"#94a3b8" }}>{inv.uploadBatch}</span>}
                </div>
                {inv.status==="delivered"&&inv.podImage&&inv.podImage!=="demo_pod"&&(
                  <img src={inv.podImage} alt="POD" style={{ width:100, height:75, objectFit:"cover", borderRadius:6, border:"1px solid #e2e8f0" }} />
                )}
                {inv.status==="delivered"&&inv.podImage==="demo_pod"&&(
                  <div style={{ fontSize:13, color:"#94a3b8", background:"#f1f5f9", display:"inline-block", padding:"6px 12px", borderRadius:6 }}>📸 {t.podAvailable}</div>
                )}
                {inv.gps&&(
                  <a href={`https://maps.google.com/?q=${inv.gps.lat},${inv.gps.lng}`} target="_blank" rel="noreferrer"
                    style={{ display:"block", marginTop:6, fontSize:12, color:"#6366f1", fontWeight:600 }}>📍 {t.viewGPS} →</a>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
