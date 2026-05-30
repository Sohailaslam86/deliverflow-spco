import { useState } from "react";
import { Card, CardTitle, Btn, EmptyState } from "../components/Shared.jsx";

const T = {
  en: {
    title:"Download PODs", subtitle:"Export delivery confirmation data",
    search:"Search invoice # or customer...", allDCs:"All DCs",
    selectAll:"Select All", clearAll:"Clear", downloadPDF:"Download Selected PDF",
    downloadCSV:"Download CSV", delivered:"delivered invoices",
    invoice:"Invoice #", date:"Date", customer:"Customer", dc:"DC",
    driver:"Driver", vehicle:"Vehicle", status:"Status", viewPOD:"View POD",
    back:"Back to List", noPOD:"No POD photo available", podView:"POD Document",
    noInvoices:"No delivered invoices found", dateFrom:"From Date", dateTo:"To Date"
  },
  ar: {
    title:"\u062a\u062d\u0645\u064a\u0644 \u0648\u062b\u0627\u0626\u0642 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    subtitle:"\u062a\u0635\u062f\u064a\u0631 \u0628\u064a\u0627\u0646\u0627\u062a \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    search:"\u0628\u062d\u062b \u0628\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u0623\u0648 \u0627\u0644\u0639\u0645\u064a\u0644",
    allDCs:"\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0631\u0627\u0643\u0632",
    selectAll:"\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0643\u0644",
    clearAll:"\u0625\u0644\u063a\u0627\u0621", downloadPDF:"\u062a\u062d\u0645\u064a\u0644 PDF",
    downloadCSV:"\u062a\u062d\u0645\u064a\u0644 CSV",
    delivered:"\u0641\u0627\u062a\u0648\u0631\u0629 \u0645\u0633\u0644\u0645\u0629",
    invoice:"\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629",
    date:"\u0627\u0644\u062a\u0627\u0631\u064a\u062e",
    customer:"\u0627\u0644\u0639\u0645\u064a\u0644",
    dc:"\u0645\u0631\u0643\u0632 \u0627\u0644\u062a\u0648\u0632\u064a\u0639",
    driver:"\u0627\u0644\u0633\u0627\u0626\u0642",
    vehicle:"\u0627\u0644\u0645\u0631\u0643\u0628\u0629",
    status:"\u0627\u0644\u062d\u0627\u0644\u0629",
    viewPOD:"\u0639\u0631\u0636 \u0648\u062b\u064a\u0642\u0629 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    back:"\u0639\u0648\u062f\u0629 \u0644\u0644\u0642\u0627\u0626\u0645\u0629",
    noPOD:"\u0644\u0627 \u062a\u0648\u062c\u062f \u0635\u0648\u0631\u0629 \u062a\u0633\u0644\u064a\u0645",
    podView:"\u0648\u062b\u064a\u0642\u0629 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    noInvoices:"\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u0648\u0627\u062a\u064a\u0631 \u0645\u0633\u0644\u0645\u0629",
    dateFrom:"\u0645\u0646 \u062a\u0627\u0631\u064a\u062e",
    dateTo:"\u0625\u0644\u0649 \u062a\u0627\u0631\u064a\u062e"
  }
};

export default function Download({ user, lang, invoices }) {
  const rtl = lang === "ar";
  const t = T[lang] || T.en;

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState([]);
  const [viewInv, setViewInv] = useState(null);

  const isAdmin = user.role === "admin";
  const isPlanning = user.role === "planning";

  const delivered = invoices.filter(inv => inv.status === "delivered");
  const dcs = [...new Set(invoices.map(i => i.dc))];

  const filtered = delivered.filter(inv => {
    const matchDC = filter === "all" || inv.dc === filter;
    const matchSearch = !search ||
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer.toLowerCase().includes(search.toLowerCase());
    const matchFrom = !dateFrom || inv.date >= dateFrom;
    const matchTo = !dateTo || inv.date <= dateTo;
    return matchDC && matchSearch && matchFrom && matchTo;
  });

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);
  }

  function downloadCSV() {
    const data = (selected.length > 0 ? filtered.filter(i=>selected.includes(i.id)) : filtered);
    const headers = ["Invoice#","Date","Customer","Institution","DC","Driver","Vehicle","DeliveredAt","Status"];
    const rows = data.map(inv=>[inv.id,inv.date,inv.customer,inv.inst||"",inv.dc,inv.driver||"",inv.vehicle||"",inv.deliveredAt||inv.date,"Delivered"]);
    const csv = [headers,...rows].map(r=>r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = "DeliverFlow_PODs_"+new Date().toISOString().slice(0,10)+".csv";
    a.click();
  }

  function downloadSelectedPDF() {
    const data = filtered.filter(i => selected.includes(i.id));
    if (!data.length) return;
    const content = `
      <html><head><style>
        body{font-family:Arial,sans-serif;padding:20px;}
        h1{color:#1A3A5C;border-bottom:3px solid #1A3A5C;padding-bottom:10px;}
        table{width:100%;border-collapse:collapse;margin-top:20px;}
        th{background:#1A3A5C;color:white;padding:10px;text-align:left;font-size:12px;}
        td{padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;}
        tr:nth-child(even){background:#f8fafc;}
        .pod-img{max-width:150px;max-height:100px;object-fit:cover;border-radius:4px;}
        .footer{margin-top:30px;font-size:11px;color:#94a3b8;text-align:center;}
      </style></head><body>
      <h1>DeliverFlow — POD Report</h1>
      <p style="color:#64748b;font-size:13px;">Generated: ${new Date().toLocaleString()} | Total: ${data.length} invoices</p>
      <table>
        <thead><tr><th>Invoice #</th><th>Date</th><th>Customer</th><th>DC</th><th>Driver</th><th>Delivered At</th><th>POD</th></tr></thead>
        <tbody>
          ${data.map(inv=>`
            <tr>
              <td><b style="color:#6366f1">${inv.id}</b></td>
              <td>${inv.date}</td>
              <td>${inv.customer}</td>
              <td>${inv.dc} DC</td>
              <td>${inv.driver||"-"}</td>
              <td>${inv.deliveredAt||inv.date}</td>
              <td>${inv.podImage&&inv.podImage!=="demo_pod"?`<img src="${inv.podImage}" class="pod-img"/>`:(inv.podImage==="demo_pod"?"<span style='color:#10b981'>&#10003; Available</span>":"<span style='color:#94a3b8'>-</span>")}</td>
            </tr>`).join("")}
        </tbody>
      </table>
      <div class="footer">Saudi Pharmaceutical Co. (SPCO) — DeliverFlow System — ${new Date().getFullYear()}</div>
      </body></html>`;
    const w = window.open("","_blank");
    w.document.write(content);
    w.document.close();
    setTimeout(()=>w.print(),500);
  }

  // POD View screen
  if (viewInv) {
    return (
      <div style={{ direction:rtl?"rtl":"ltr" }}>
        <button onClick={()=>setViewInv(null)}
          style={{ background:"#1A3A5C", color:"white", border:"none", padding:"10px 20px", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, marginBottom:16 }}>
          \u2190 {t.back}
        </button>
        <Card>
          <CardTitle>\ud83d\udcf8 {t.podView} — {viewInv.id}</CardTitle>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:10, marginBottom:16, fontSize:13 }}>
            <div><b>{t.customer}:</b> {viewInv.customer}</div>
            <div><b>{t.dc}:</b> {viewInv.dc}</div>
            <div><b>{t.driver}:</b> {viewInv.driver||"-"}</div>
            <div><b>{t.vehicle}:</b> {viewInv.vehicle||"-"}</div>
            <div><b>{t.date}:</b> {viewInv.date}</div>
            <div><b>Delivered:</b> {viewInv.deliveredAt||"-"}</div>
            {viewInv.gps && (
              <div><b>GPS:</b> <a href={`https://maps.google.com/?q=${viewInv.gps.lat},${viewInv.gps.lng}`} target="_blank" rel="noreferrer" style={{ color:"#6366f1" }}>View Map</a></div>
            )}
          </div>
          {viewInv.podImage && viewInv.podImage !== "demo_pod" ? (
            <div>
              <img src={viewInv.podImage} alt="POD" style={{ width:"100%", maxWidth:500, borderRadius:10, border:"2px solid #e2e8f0", display:"block", marginBottom:12 }} />
              <Btn onClick={()=>{const a=document.createElement("a");a.href=viewInv.podImage;a.download="POD_"+viewInv.id+".jpg";a.click();}} color="#10b981">
                \u2b07 Download POD Image
              </Btn>
            </div>
          ) : (
            <div style={{ background:"#f8fafc", borderRadius:10, padding:40, textAlign:"center", color:"#94a3b8", fontSize:14 }}>
              {viewInv.podImage==="demo_pod" ? "\ud83d\udcf8 POD photo available in live system" : t.noPOD}
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:"#0f172a", margin:"0 0 4px" }}>{t.title}</h2>
        <p style={{ fontSize:14, color:"#64748b", margin:0 }}>{t.subtitle}</p>
      </div>

      <Card>
        {/* Filters */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", marginBottom:12 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}
            style={{ flex:1, minWidth:180, border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none" }} />
          <select value={filter} onChange={e=>setFilter(e.target.value)}
            style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, background:"white", outline:"none" }}>
            <option value="all">{t.allDCs}</option>
            {dcs.map(dc=><option key={dc} value={dc}>{dc}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none" }} />
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none" }} />
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12, alignItems:"center" }}>
          <span style={{ fontSize:13, color:"#64748b" }}>{filtered.length} {t.delivered}</span>
          <div style={{ flex:1 }} />
          <Btn small onClick={()=>setSelected(filtered.map(i=>i.id))} color="#6366f1">{t.selectAll}</Btn>
          <Btn small onClick={()=>setSelected([])} color="#64748b">{t.clearAll}</Btn>
          {(isAdmin||isPlanning) && (
            <>
              {selected.length>0 && <Btn small onClick={downloadSelectedPDF} color="#7c3aed">\ud83d\udda8\ufe0f {t.downloadPDF} ({selected.length})</Btn>}
              <Btn small onClick={downloadCSV} color="#065f46">\u2b07 {t.downloadCSV}</Btn>
            </>
          )}
        </div>

        {filtered.length===0 ? (
          <EmptyState icon="\ud83d\udce5" title={t.noInvoices} />
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  <th style={{ padding:"10px 8px", width:32 }}></th>
                  {[t.invoice,t.date,t.customer,t.dc,t.driver,t.vehicle,"POD"].map(h=>(
                    <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"2px solid #e2e8f0", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv,i)=>(
                  <tr key={inv.id} style={{ background:selected.includes(inv.id)?"#eef2ff":i%2===0?"white":"#f8fafc", cursor:"pointer" }}
                    onClick={()=>toggleSelect(inv.id)}>
                    <td style={{ padding:"10px 8px", textAlign:"center" }}>
                      <span style={{ fontSize:16, color:"#6366f1" }}>{selected.includes(inv.id)?"\u2611":"\u2610"}</span>
                    </td>
                    <td style={{ padding:"10px 12px", fontWeight:700, color:"#1A3A5C" }}>{inv.id}</td>
                    <td style={{ padding:"10px 12px", color:"#64748b" }}>{inv.date}</td>
                    <td style={{ padding:"10px 12px" }}>{inv.customer}</td>
                    <td style={{ padding:"10px 12px" }}>{inv.dc}</td>
                    <td style={{ padding:"10px 12px", color:"#64748b" }}>{inv.driver||"-"}</td>
                    <td style={{ padding:"10px 12px", color:"#64748b" }}>{inv.vehicle||"-"}</td>
                    <td style={{ padding:"10px 12px" }} onClick={e=>{e.stopPropagation();setViewInv(inv);}}>
                      <span style={{ color:"#6366f1", fontWeight:600, cursor:"pointer", fontSize:12 }}>
                        {inv.podImage?"\ud83d\udcf8 "+t.viewPOD:"—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
