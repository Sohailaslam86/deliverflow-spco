import { useState } from "react";
import { Card, CardTitle, Btn, Input, SuccessMsg } from "../components/Shared.jsx";

const T = {
  en: {
    prevReading:"Previous Reading (Last Trip End)", todayNote:"Today's opening reading must match this value.",
    deviationNote:"If different, report deviation to DC Manager.",
    title:"Trip Log", subtitle:"Take odometer photo at trip start and end. AI reads automatically.",
    manualEntry:"Manual Entry (Requires Approval)", switchManual:"Switch to Manual Entry",
    startReading:"Trip Start Reading", endReading:"Trip End Reading",
    takePhoto:"Take Photo", changePhoto:"Change Photo",
    aiRead:"AI Read", demo:"(demo)", distance:"Distance Covered",
    deviationAlert:"Deviation detected! Will be flagged for DC Manager review.",
    manualWarn:"Manual entry requires DC Manager approval before being recorded.",
    submitBtn:"Submit for DC Manager Approval",
    submitted:"Daily Mileage Record submitted! Awaiting DC Manager approval.",
    manualLabel:"Manual Reading (KM)"
  },
  ar: {
    prevReading:"القراءة السابقة (آخر رحلة)", todayNote:"يجب أن تتطابق قراءة اليوم مع هذه القيمة.",
    deviationNote:"إذا كانت مختلفة، أبلغ مدير المركز.",
    title:"سجل الرحلة", subtitle:"التقط صورة العداد عند بداية ونهاية الرحلة.",
    manualEntry:"إدخال يدوي (يتطلب موافقة)", switchManual:"التبديل للإدخال اليدوي",
    startReading:"قراءة بداية الرحلة", endReading:"قراءة نهاية الرحلة",
    takePhoto:"التقاط صورة", changePhoto:"تغيير الصورة",
    aiRead:"قراءة الذكاء الاصطناعي", demo:"(تجريبي)", distance:"المسافة المقطوعة",
    deviationAlert:"تم اكتشاف انحراف! سيتم الإبلاغ لمدير المركز.",
    manualWarn:"الإدخال اليدوي يتطلب موافقة مدير المركز.",
    submitBtn:"إرسال لموافقة مدير المركز",
    submitted:"تم إرسال سجل المسافة اليومية! في انتظار الموافقة.",
    manualLabel:"القراءة اليدوية (كم)"
  }
};

export default function Odometer({ user, lang }) {
  const [startPhoto, setStartPhoto] = useState(null);
  const [endPhoto, setEndPhoto] = useState(null);
  const [startKM] = useState("102,345");
  const [endKM, setEndKM] = useState(null);
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [useManual, setUseManual] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const lastReading = { km:"102,345", date:"2026-05-25" };
  const rtl = lang==="ar";
  const t = T[lang]||T.en;

  const diff = startKM&&endKM?(Number(endKM.replace(",",""))-Number(startKM.replace(",",""))).toLocaleString():null;
  const deviation = manualStart&&startKM&&Math.abs(Number(manualStart.replace(",",""))-Number(startKM.replace(",","")))>5;

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      <Card style={{ borderLeft:"4px solid #3b82f6" }}>
        <CardTitle>📅 {t.prevReading}</CardTitle>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ background:"#f8fafc", borderRadius:8, padding:"10px 16px", fontSize:14 }}>
            <div style={{ fontWeight:700, fontSize:20, color:"#3b82f6" }}>{lastReading.km} KM</div>
            <div style={{ color:"#64748b" }}>Date: {lastReading.date}</div>
          </div>
          <div style={{ fontSize:14, color:"#64748b" }}>
            <div>⚠️ {t.todayNote}</div>
            <div>{t.deviationNote}</div>
          </div>
        </div>
      </Card>

      {submitted?(
        <SuccessMsg msg={t.submitted} />
      ):(
        <Card>
          <CardTitle>🔢 {t.title}</CardTitle>
          <p style={{ fontSize:14, color:"#64748b", marginBottom:20 }}>{t.subtitle}</p>
          <div style={{ marginBottom:16 }}>
            <button onClick={()=>setUseManual(!useManual)}
              style={{ background:useManual?"#fef3c7":"#f1f5f9", border:`1px solid ${useManual?"#fbbf24":"#e2e8f0"}`, borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:14, fontWeight:600, color:useManual?"#92400e":"#64748b" }}>
              ✏️ {useManual?t.manualEntry:t.switchManual}
            </button>
          </div>

          <div style={{ border:"1px solid #e2e8f0", borderRadius:8, padding:14, marginBottom:12 }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:10 }}>🟢 {t.startReading}</div>
            <input type="file" accept="image/*" capture="environment" id="odo_start" style={{ display:"none" }}
              onChange={e=>{const f=e.target.files[0];if(f)setStartPhoto(URL.createObjectURL(f));}} />
            <label htmlFor="odo_start" style={{ display:"inline-block", background:"#8b5cf6", color:"white", border:"none", padding:"9px 16px", borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:14 }}>
              📸 {startPhoto?t.changePhoto:t.takePhoto}
            </label>
            {startPhoto&&(
              <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:12 }}>
                <img src={startPhoto} alt="odo" style={{ width:80, height:60, objectFit:"cover", borderRadius:6, border:"1px solid #e2e8f0" }} />
                <div style={{ background:"#f0fdf4", padding:"6px 12px", borderRadius:6, fontSize:14 }}>
                  🤖 {t.aiRead}: <b>{startKM} KM</b>
                </div>
              </div>
            )}
            {!startPhoto&&<div style={{ marginTop:8, fontSize:14, color:"#94a3b8" }}>🤖 {t.aiRead}: <b>{startKM} KM</b> {t.demo}</div>}
            {useManual&&(
              <div style={{ marginTop:10 }}>
                <Input label={t.manualLabel} value={manualStart} onChange={setManualStart} placeholder="102,345" />
                {deviation&&<div style={{ fontSize:13, color:"#ef4444", fontWeight:600 }}>⚠️ {t.deviationAlert}</div>}
              </div>
            )}
          </div>

          <div style={{ border:"1px solid #e2e8f0", borderRadius:8, padding:14, marginBottom:12 }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:10 }}>🔴 {t.endReading}</div>
            <input type="file" accept="image/*" capture="environment" id="odo_end" style={{ display:"none" }}
              onChange={e=>{const f=e.target.files[0];if(f){setEndPhoto(URL.createObjectURL(f));setEndKM("102,487");}}} />
            <label htmlFor="odo_end" style={{ display:"inline-block", background:"#8b5cf6", color:"white", border:"none", padding:"9px 16px", borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:14 }}>
              📸 {endPhoto?t.changePhoto:t.takePhoto}
            </label>
            {endPhoto&&(
              <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:12 }}>
                <img src={endPhoto} alt="odo" style={{ width:80, height:60, objectFit:"cover", borderRadius:6, border:"1px solid #e2e8f0" }} />
                <div style={{ background:"#f0fdf4", padding:"6px 12px", borderRadius:6, fontSize:14 }}>
                  🤖 {t.aiRead}: <b>{endKM} KM</b>
                </div>
              </div>
            )}
            {useManual&&endPhoto&&<div style={{ marginTop:10 }}><Input label={t.manualLabel} value={manualEnd} onChange={setManualEnd} placeholder="102,487" /></div>}
          </div>

          {diff&&(
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#f0fdf4", padding:"12px 16px", borderRadius:8, marginBottom:12 }}>
              <span style={{ fontSize:14, fontWeight:600 }}>📏 {t.distance}:</span>
              <span style={{ fontSize:24, fontWeight:900, color:"#10b981" }}>{diff} KM</span>
            </div>
          )}
          {useManual&&<div style={{ background:"#fef3c7", border:"1px solid #fbbf24", borderRadius:8, padding:"10px 14px", fontSize:14, color:"#92400e", marginBottom:12 }}>⚠️ {t.manualWarn}</div>}
          <Btn onClick={()=>setSubmitted(true)} style={{ width:"100%", padding:12, fontSize:14 }}>📤 {t.submitBtn}</Btn>
        </Card>
      )}
    </div>
  );
}
