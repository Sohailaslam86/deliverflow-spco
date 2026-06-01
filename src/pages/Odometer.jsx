import { useState } from "react";
import { Card, CardTitle, Btn, SuccessMsg } from "../components/Shared.jsx";
import CameraCapture from "../components/CameraCapture.jsx";

const T = {
  en: {
    prevReading:"Previous Reading (Last Trip End)",
    todayNote:"Today's opening reading must match this value.",
    deviationNote:"If different, report deviation to DC Manager.",
    title:"Trip Odometer Log",
    subtitle:"Take clear photo of odometer at start and end of trip.",
    manualEntry:"Manual Entry (Requires Approval)",
    switchManual:"Switch to Manual Entry",
    startReading:"Trip Start Reading",
    endReading:"Trip End Reading",
    distance:"Distance Covered",
    deviationAlert:"Deviation detected! Will be flagged for DC Manager review.",
    manualWarn:"Manual entry requires DC Manager approval before being recorded.",
    submitBtn:"Submit for DC Manager Approval",
    submitted:"Daily Mileage Record submitted! Awaiting DC Manager approval.",
    manualLabel:"Manual Reading (KM)",
    startPhoto:"Start Odometer Photo *",
    endPhoto:"End Odometer Photo *"
  },
  ar: {
    prevReading:"القراءة السابقة (آخر رحلة)",
    todayNote:"يجب أن تتطابق قراءة اليوم مع هذه القيمة.",
    deviationNote:"إذا كانت مختلفة، أبلغ مدير المركز.",
    title:"سجل عداد الرحلة",
    subtitle:"التقط صورة واضحة للعداد في بداية ونهاية الرحلة.",
    manualEntry:"إدخال يدوي (يتطلب موافقة)",
    switchManual:"التبديل للإدخال اليدوي",
    startReading:"قراءة بداية الرحلة",
    endReading:"قراءة نهاية الرحلة",
    distance:"المسافة المقطوعة",
    deviationAlert:"تم اكتشاف انحراف! سيتم الإبلاغ لمدير المركز.",
    manualWarn:"الإدخال اليدوي يتطلب موافقة مدير المركز.",
    submitBtn:"إرسال لموافقة مدير المركز",
    submitted:"تم إرسال سجل المسافة اليومية!",
    manualLabel:"القراءة اليدوية (كم)",
    startPhoto:"صورة عداد البداية *",
    endPhoto:"صورة عداد النهاية *"
  }
};

export default function Odometer({ user, lang }) {
  const [startPhotoUrl, setStartPhotoUrl] = useState("");
  const [endPhotoUrl, setEndPhotoUrl] = useState("");
  const [startKM] = useState("102,345");
  const [endKM] = useState("");
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [useManual, setUseManual] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const lastReading = { km:"102,345", date:"2026-05-25" };
  const rtl = lang==="ar";
  const t = T[lang]||T.en;

  const deviation = manualStart&&startKM&&Math.abs(Number(manualStart.replace(",",""))-Number(startKM.replace(",","")))>5;

  const canSubmit = startPhotoUrl && endPhotoUrl;

  if (submitted) {
    return (
      <div style={{ direction:rtl?"rtl":"ltr" }}>
        <SuccessMsg msg={t.submitted} />
        <Card style={{ textAlign:"center", padding:32 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
          <div style={{ fontWeight:700, fontSize:18, color:"#10b981" }}>{t.submitted}</div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ direction:rtl?"rtl":"ltr" }}>
      {/* Previous Reading */}
      <Card style={{ borderLeft:"4px solid #3b82f6" }}>
        <CardTitle>📅 {t.prevReading}</CardTitle>
        <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <div style={{ background:"#f0f9ff", borderRadius:10, padding:"12px 20px" }}>
            <div style={{ fontWeight:900, fontSize:26, color:"#3b82f6" }}>{lastReading.km} KM</div>
            <div style={{ fontSize:13, color:"#64748b" }}>Date: {lastReading.date}</div>
          </div>
          <div style={{ fontSize:14, color:"#64748b" }}>
            <div>⚠️ {t.todayNote}</div>
            <div style={{ marginTop:4 }}>{t.deviationNote}</div>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>🔢 {t.title}</CardTitle>
        <p style={{ fontSize:14, color:"#64748b", marginBottom:20 }}>{t.subtitle}</p>

        {/* Manual toggle */}
        <div style={{ marginBottom:16 }}>
          <button onClick={()=>setUseManual(!useManual)}
            style={{ background:useManual?"#fef3c7":"#f1f5f9", border:`1.5px solid ${useManual?"#fbbf24":"#e2e8f0"}`, borderRadius:8, padding:"9px 16px", cursor:"pointer", fontSize:14, fontWeight:600, color:useManual?"#92400e":"#64748b" }}>
            ✏️ {useManual?t.manualEntry:t.switchManual}
          </button>
        </div>

        {/* Start Odometer */}
        <div style={{ border:"1px solid #e2e8f0", borderRadius:10, padding:16, marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:16, marginBottom:12, color:"#10b981" }}>🟢 {t.startReading}</div>
          <CameraCapture
            label={t.startPhoto}
            value={startPhotoUrl}
            onChange={url=>setStartPhotoUrl(url)}
            folder="odometer"
            lang={lang}
            required
          />
          {useManual&&(
            <div style={{ marginTop:10 }}>
              <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#374151", marginBottom:6 }}>{t.manualLabel}</label>
              <input value={manualStart} onChange={e=>setManualStart(e.target.value)}
                placeholder="102,345"
                style={{ width:"100%", border:`1.5px solid ${deviation?"#ef4444":"#e2e8f0"}`, borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none", boxSizing:"border-box" }} />
              {deviation&&<div style={{ fontSize:13, color:"#ef4444", fontWeight:600, marginTop:6 }}>⚠️ {t.deviationAlert}</div>}
            </div>
          )}
        </div>

        {/* End Odometer */}
        <div style={{ border:"1px solid #e2e8f0", borderRadius:10, padding:16, marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:16, marginBottom:12, color:"#ef4444" }}>🔴 {t.endReading}</div>
          <CameraCapture
            label={t.endPhoto}
            value={endPhotoUrl}
            onChange={url=>setEndPhotoUrl(url)}
            folder="odometer"
            lang={lang}
            required
          />
          {useManual&&endPhotoUrl&&(
            <div style={{ marginTop:10 }}>
              <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#374151", marginBottom:6 }}>{t.manualLabel}</label>
              <input value={manualEnd} onChange={e=>setManualEnd(e.target.value)}
                placeholder="102,487"
                style={{ width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"11px 14px", fontSize:15, outline:"none", boxSizing:"border-box" }} />
            </div>
          )}
        </div>

        {useManual&&(
          <div style={{ background:"#fef3c7", border:"1px solid #fbbf24", borderRadius:8, padding:"12px 16px", fontSize:14, color:"#92400e", marginBottom:16 }}>
            ⚠️ {t.manualWarn}
          </div>
        )}

        <Btn
          onClick={()=>setSubmitted(true)}
          disabled={!canSubmit}
          style={{ width:"100%", padding:14, fontSize:15 }}>
          📤 {t.submitBtn}
        </Btn>
        {!canSubmit&&(
          <div style={{ fontSize:13, color:"#94a3b8", textAlign:"center", marginTop:8 }}>
            📸 Please take both start and end photos
          </div>
        )}
      </Card>
    </div>
  );
}
