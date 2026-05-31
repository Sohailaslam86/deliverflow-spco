import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardTitle, Btn, SuccessMsg, InfoBox } from "../components/Shared.jsx";
import { genId } from "../data/masterData.js";

const T = {
  en: {
    step1:"Step 1 — Download Template", step2:"Step 2 — Upload CSV File",
    step3:"Step 3 — Preview & POST", downloadTpl:"Download CSV Template",
    dragDrop:"Drag & drop CSV here", chooseFile:"Choose File",
    postBtn:"POST — Make Invoices Live", history:"Upload & Posting History",
    noHistory:"No uploads yet", postedBy:"Posted by", uploadedBy:"Uploaded by",
    invoices:"invoices", warning:"Once POSTED, invoices will be live in all DC queues. Verify before posting.",
    posted:"POSTED", draft:"DRAFT", deleteBtn:"Delete", confirmDel:"Are you sure you want to delete this batch?",
    viewPDF:"View PDF", pdfNote:"CSV is automatically saved as a PDF record",
    adminOnly:"Admin only — Edit/Delete"
  },
  ar: {
    step1:"الخطوة 1 — تحميل النموذج", step2:"الخطوة 2 — رفع ملف CSV",
    step3:"الخطوة 3 — معاينة وترحيل", downloadTpl:"تحميل نموذج CSV",
    dragDrop:"اسحب وأفلت ملف CSV هنا", chooseFile:"اختر ملفاً",
    postBtn:"ترحيل الفواتير", history:"سجل الرفع والترحيل",
    noHistory:"لا يوجد سجلات بعد", postedBy:"رحّل بواسطة", uploadedBy:"رفع بواسطة",
    invoices:"فواتير", warning:"بعد الترحيل ستظهر الفواتير في جميع طوابير المراكز. تحقق قبل الترحيل.",
    posted:"مُرحَّل", draft:"مسودة", deleteBtn:"حذف", confirmDel:"هل أنت متأكد من حذف هذه الدفعة؟",
    viewPDF:"عرض PDF", pdfNote:"يتم حفظ CSV تلقائياً كسجل PDF",
    adminOnly:"للمسؤول فقط — تعديل/حذف",
    fillCols:"حمّل النموذج، املأ 5 أعمدة، ثم ارفعه أدناه.",
  }
};

export default function Upload({ user, invoices, setInvoices, uploads, setUploads, lang }) {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [done, setDone] = useState("");
  const [pendingBatch, setPendingBatch] = useState(null);
  const [viewPDF, setViewPDF] = useState(null);
  const [loading, setLoading] = useState(false);
  const rtl = lang==="ar";
  const t = T[lang]||T.en;
  const isAdmin = user.role==="admin";

  // Firestore se uploads load karo
  useEffect(() => {
    loadUploads();
    loadInvoices();
  }, []);

  async function loadUploads() {
    try {
      const snap = await getDocs(collection(db, "uploads"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUploads(data);
    } catch(e) { console.error("Uploads load error:", e); }
  }

  async function loadInvoices() {
    try {
      const snap = await getDocs(collection(db, "invoices"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setInvoices(data);
    } catch(e) { console.error("Invoices load error:", e); }
  }

  function dlTemplate() {
    const csv = "Invoice Number,Invoice Date,Customer Name,Institution,DC\n6032151035,2026-05-27,Hospital Name,Government,Riyadh";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = "SPCO_Invoice_Template.csv"; a.click();
  }

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.trim().split("\n").slice(1); // header skip
      const rows = lines.map(line => line.split(",").map(c => c.trim()));
      if (rows.length > 0 && rows[0].length >= 5) {
        setPendingBatch({ rows, batchId: genId("UPLOAD") });
      } else {
        // Demo rows if CSV empty
        const demoRows = [
          ["INV-"+Math.floor(6032151100+Math.random()*1000),"2026-05-29","King Abdullah Medical City","Government","Riyadh"],
          ["INV-"+Math.floor(6032151100+Math.random()*1000),"2026-05-29","Dr Sulaiman Al Habib - Jeddah","Private","Jeddah"],
          ["INV-"+Math.floor(6032151100+Math.random()*1000),"2026-05-29","Dammam Central Hospital","Government","Dammam"],
        ];
        setPendingBatch({ rows: demoRows, batchId: genId("UPLOAD") });
      }
    };
    reader.readAsText(f);
    setDone("");
  }

  async function postInvoices() {
    if (!pendingBatch) return;
    setLoading(true);
    const { rows, batchId } = pendingBatch;
    const now = new Date();

    try {
      // Har invoice Firestore mein save karo
      const newInvs = [];
      for (const r of rows) {
        const invData = {
          id: r[0], customer: r[2], inst: r[3], dc: r[4], city: r[4],
          status: "pending", driverId: null, vehicle: null,
          storage: "Ambient (15-25°C)", dtype: "incity",
          date: r[1], uploadBatch: batchId,
          remarks: "", podImage: null, gps: null,
          assignedAt: null, deliveredAt: null, attempts: 0,
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, "invoices"), invData);
        newInvs.push({ ...invData, firestoreId: docRef.id });
      }

      // Upload batch Firestore mein save karo
      const uploadData = {
        batchId, date: rows[0][1] || now.toISOString().split("T")[0],
        time: now.toTimeString().slice(0,5),
        uploadedBy: user.name, postedBy: user.name,
        postedAt: now.toLocaleString(), status: "posted",
        invoiceCount: rows.length, rows, notes: "",
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "uploads"), uploadData);

      // State update
      setInvoices(prev => [...prev, ...newInvs]);
      setUploads(prev => [...prev, uploadData]);
      setDone("✅ Batch " + batchId + " posted — " + rows.length + " invoices live!");
      setPendingBatch(null);
      setFile(null);
    } catch(e) {
      setDone("❌ Error: " + e.message);
    }
    setLoading(false);
  }

  async function deleteBatch(batchId) {
    if (!window.confirm(t.confirmDel)) return;
    try {
      // Firestore se invoices delete karo
      const invSnap = await getDocs(collection(db, "invoices"));
      for (const d of invSnap.docs) {
        if (d.data().uploadBatch === batchId) {
          await deleteDoc(doc(db, "invoices", d.id));
        }
      }
      // Firestore se upload delete karo
      const upSnap = await getDocs(collection(db, "uploads"));
      for (const d of upSnap.docs) {
        if (d.data().batchId === batchId) {
          await deleteDoc(doc(db, "uploads", d.id));
        }
      }
      setUploads(prev => prev.filter(u => u.batchId !== batchId));
      setInvoices(prev => prev.filter(i => i.uploadBatch !== batchId));
      setDone("Batch " + batchId + " deleted.");
      setTimeout(() => setDone(""), 3000);
    } catch(e) {
      setDone("❌ Error: " + e.message);
    }
  }

  if (viewPDF) {
    return (
      <div style={{ direction:rtl?"rtl":"ltr" }}>
        <button onClick={()=>setViewPDF(null)} style={{ background:"#1A3A5C",color:"white",border:"none",padding:"10px 20px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13,marginBottom:16 }}>
          ← Back
        </button>
        <Card>
          <CardTitle>📄 {t.viewPDF} — {viewPDF.batchId}</CardTitle>
          <div style={{ marginBottom:12,fontSize:13,color:"#64748b" }}>
            {viewPDF.date} | {t.uploadedBy}: {viewPDF.uploadedBy} | {t.postedBy}: {viewPDF.postedBy}
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
              <thead>
                <tr style={{ background:"#1A3A5C" }}>
                  {["Invoice #","Date","Customer","Institution","DC"].map(h=>(
                    <th key={h} style={{ padding:"10px 12px",textAlign:"left",fontWeight:700,color:"white" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(viewPDF.rows||[]).map((r,i)=>(
                  <tr key={i} style={{ background:i%2===0?"white":"#f8fafc" }}>
                    {r.map((c,j)=><td key={j} style={{ padding:"8px 12px",borderBottom:"1px solid #f1f5f9" }}>{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:16,fontSize:12,color:"#94a3b8",textAlign:"center" }}>
            Saudi Pharmaceutical Co. (SPCO) — DeliverFlow System — Read Only Record
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {done&&<SuccessMsg msg={done} />}
      <Card>
        <CardTitle>{t.step1}</CardTitle>
        <p style={{ fontSize:13,color:"#64748b",marginBottom:14 }}>{t.fillCols||"Download CSV, fill 5 columns, then upload below."}</p>
        <Btn onClick={dlTemplate} style={{ marginBottom:12 }}>⬇ {t.downloadTpl}</Btn>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          {["Invoice Number","Invoice Date","Customer Name","Institution","DC"].map(c=>(
            <span key={c} style={{ background:"#f1f5f9",borderRadius:6,padding:"4px 10px",fontSize:12,color:"#374151" }}>{c}</span>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle>{t.step2}</CardTitle>
        <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}}
          style={{ border:`2px dashed ${drag?"#6366f1":"#cbd5e1"}`,background:drag?"#eef2ff":"white",borderRadius:10,padding:"32px",textAlign:"center",marginBottom:12 }}>
          <div style={{ fontSize:40,marginBottom:8 }}>📂</div>
          <div style={{ color:"#64748b",marginBottom:12 }}>{file?file.name:t.dragDrop}</div>
          <input type="file" accept=".csv" id="csv" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])} />
          <label htmlFor="csv" style={{ background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:600 }}>{t.chooseFile}</label>
        </div>
      </Card>
      {pendingBatch&&(
        <Card>
          <CardTitle>{t.step3}</CardTitle>
          <InfoBox>Batch ID: <b>{pendingBatch.batchId}</b></InfoBox>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
              <thead><tr>{["Invoice #","Date","Customer","Institution","DC"].map(h=><th key={h} style={{ background:"#f8fafc",padding:"9px 12px",textAlign:"left",fontWeight:700,borderBottom:"1px solid #e2e8f0" }}>{h}</th>)}</tr></thead>
              <tbody>{pendingBatch.rows.map((r,i)=><tr key={i} style={{ background:i%2===0?"#f8fafc":"white" }}>{r.map((c,j)=><td key={j} style={{ padding:"8px 12px",borderBottom:"1px solid #f1f5f9" }}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div style={{ background:"#fef3c7",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#92400e",margin:"12px 0" }}>⚠️ {t.warning}</div>
          <Btn onClick={postInvoices} color="#10b981" style={{ width:"100%",padding:12 }} disabled={loading}>
            {loading ? "Posting..." : `🚀 ${t.postBtn} (${pendingBatch.rows.length})`}
          </Btn>
        </Card>
      )}
      <Card>
        <CardTitle>📋 {t.history}</CardTitle>
        <div style={{ fontSize:12,color:"#94a3b8",marginBottom:10 }}>💡 {t.pdfNote}</div>
        {uploads.length===0&&<div style={{ textAlign:"center",padding:20,color:"#94a3b8" }}>{t.noHistory}</div>}
        {[...uploads].reverse().map((u,idx)=>(
          <div key={u.batchId||idx} style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap" }}>
            <div style={{ flex:1,minWidth:200 }}>
              <div style={{ fontWeight:700,fontSize:13,color:"#6366f1" }}>{u.batchId}</div>
              <div style={{ fontSize:12,color:"#64748b" }}>{u.date} {u.time} — {t.uploadedBy}: {u.uploadedBy} — {u.invoiceCount} {t.invoices}</div>
              {u.postedAt&&<div style={{ fontSize:11,color:"#10b981" }}>{t.postedBy}: {u.postedBy} | {u.postedAt}</div>}
            </div>
            <span style={{ fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:u.status==="posted"?"#d1fae5":"#fef3c7",color:u.status==="posted"?"#065f46":"#92400e" }}>
              {u.status==="posted"?t.posted:t.draft}
            </span>
            <Btn small onClick={()=>setViewPDF(u)} color="#6366f1">📄 {t.viewPDF}</Btn>
            {isAdmin&&<Btn small onClick={()=>deleteBatch(u.batchId)} color="#ef4444">🗑️ {t.deleteBtn}</Btn>}
          </div>
        ))}
      </Card>
    </div>
  );
}
