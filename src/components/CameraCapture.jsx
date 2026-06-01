// src/components/CameraCapture.jsx
// Smart Camera Component — Auto enhance, preview, retake
import { useState, useRef, useCallback } from "react";
import { uploadImage } from "../cloudinaryService.js";

const T = {
  en: {
    takePhoto:"📸 Take Photo",
    retake:"🔄 Retake",
    usePhoto:"✅ Use Photo",
    uploading:"⏳ Uploading...",
    uploaded:"✅ Photo uploaded!",
    error:"❌ Upload failed",
    tooDark:"⚠️ Photo is too dark — please retake in better lighting",
    tooBlurry:"⚠️ Photo may be blurry — please retake",
    goodQuality:"✅ Good quality photo",
    instructions:"Hold phone steady • Good lighting • Document fills frame",
    processing:"🔄 Processing photo...",
    removePhoto:"Remove Photo",
    quality:"Photo Quality"
  },
  ar: {
    takePhoto:"📸 التقاط صورة",
    retake:"🔄 إعادة التقاط",
    usePhoto:"✅ استخدام الصورة",
    uploading:"⏳ جاري الرفع...",
    uploaded:"✅ تم رفع الصورة!",
    error:"❌ فشل الرفع",
    tooDark:"⚠️ الصورة مظلمة — يرجى إعادة التقاط في إضاءة أفضل",
    tooBlurry:"⚠️ الصورة قد تكون ضبابية — يرجى إعادة التقاط",
    goodQuality:"✅ جودة صورة جيدة",
    instructions:"أمسك الهاتف بثبات • إضاءة جيدة • الوثيقة تملأ الإطار",
    processing:"🔄 جاري المعالجة...",
    removePhoto:"إزالة الصورة",
    quality:"جودة الصورة"
  }
};

// Auto enhance image using Canvas
async function enhanceImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Max size 1200px for good quality + fast upload
      const maxSize = 1200;
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize/width, maxSize/height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Get pixel data for analysis
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Calculate average brightness
      let totalBrightness = 0;
      let pixelCount = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        totalBrightness += (0.299*r + 0.587*g + 0.114*b);
        pixelCount++;
      }
      const avgBrightness = totalBrightness / pixelCount;

      // Auto brightness/contrast enhancement
      let brightnessAdj = 0;
      let contrastAdj = 1.0;

      if (avgBrightness < 80) {
        // Too dark — increase brightness
        brightnessAdj = Math.min(60, (80 - avgBrightness) * 0.8);
        contrastAdj = 1.2;
      } else if (avgBrightness > 200) {
        // Too bright — decrease brightness slightly
        brightnessAdj = -20;
        contrastAdj = 1.1;
      } else {
        // Good range — slight enhancement
        contrastAdj = 1.15;
        brightnessAdj = 5;
      }

      // Apply enhancement
      ctx.filter = `contrast(${contrastAdj}) brightness(${1 + brightnessAdj/255})`;
      ctx.drawImage(img, 0, 0, width, height);

      // Analyze quality
      const quality = {
        brightness: avgBrightness,
        isTooDark: avgBrightness < 60,
        isTooBright: avgBrightness > 220,
        isGood: avgBrightness >= 60 && avgBrightness <= 220
      };

      // Convert to blob
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        const enhancedFile = new File([blob], file.name, { type:"image/jpeg" });
        resolve({ enhancedFile, previewUrl: canvas.toDataURL("image/jpeg", 0.92), quality });
      }, "image/jpeg", 0.92);
    };
    img.src = url;
  });
}

export default function CameraCapture({
  label, value, onChange, folder="docs", lang="en", required=false
}) {
  const t = T[lang]||T.en;
  const [step, setStep] = useState("idle"); // idle | preview | uploading | done
  const [previewUrl, setPreviewUrl] = useState(value||null);
  const [quality, setQuality] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleCapture = useCallback(async (file) => {
    if (!file) return;
    setStep("processing");
    setError("");

    try {
      const { enhancedFile, previewUrl: prev, quality: q } = await enhanceImage(file);
      setPreviewUrl(prev);
      setQuality(q);
      setStep("preview");

      // Store enhanced file for upload
      fileRef.current = enhancedFile;
    } catch(e) {
      setError("Processing failed");
      setStep("idle");
    }
  }, []);

  async function usePhoto() {
    if (!fileRef.current) return;
    setStep("uploading");
    setError("");
    try {
      const url = await uploadImage(fileRef.current, folder);
      setPreviewUrl(url);
      onChange(url);
      setStep("done");
    } catch(e) {
      setError(t.error + ": " + e.message);
      setStep("preview");
    }
  }

  function retake() {
    setStep("idle");
    setPreviewUrl(null);
    setQuality(null);
    setError("");
    onChange("");
    fileRef.current = null;
  }

  const qualityMsg = quality
    ? quality.isTooDark ? t.tooDark
    : quality.isTooBright ? t.tooDark
    : t.goodQuality
    : null;

  const qualityColor = quality
    ? quality.isGood ? "#10b981"
    : "#f59e0b"
    : "#64748b";

  return (
    <div style={{ marginBottom:16 }}>
      {label && (
        <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#374151", marginBottom:8 }}>
          {label}{required && <span style={{ color:"#ef4444" }}> *</span>}
        </label>
      )}

      {/* IDLE — No photo yet */}
      {(step==="idle"||step==="processing")&&!previewUrl&&(
        <div>
          <div style={{ background:"#f8fafc", border:"2px dashed #cbd5e1", borderRadius:12, padding:20, textAlign:"center", marginBottom:10 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📷</div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:12 }}>{t.instructions}</div>
            <label style={{
              display:"inline-block", background:"#1A3A5C", color:"white",
              padding:"12px 24px", borderRadius:8, cursor:"pointer",
              fontWeight:700, fontSize:14
            }}>
              {step==="processing" ? t.processing : t.takePhoto}
              <input
                type="file" accept="image/*" capture="environment"
                style={{ display:"none" }}
                onChange={e=>handleCapture(e.target.files[0])}
                disabled={step==="processing"}
              />
            </label>
            <div style={{ marginTop:10 }}>
              <label style={{
                display:"inline-block", background:"white", color:"#1A3A5C",
                border:"1.5px solid #1A3A5C",
                padding:"10px 20px", borderRadius:8, cursor:"pointer",
                fontWeight:600, fontSize:13
              }}>
                📁 Choose from Gallery
                <input
                  type="file" accept="image/*"
                  style={{ display:"none" }}
                  onChange={e=>handleCapture(e.target.files[0])}
                  disabled={step==="processing"}
                />
              </label>
            </div>
          </div>
          {error&&<div style={{ fontSize:13, color:"#ef4444", fontWeight:600 }}>{error}</div>}
        </div>
      )}

      {/* PREVIEW — Photo taken, show preview */}
      {step==="preview"&&previewUrl&&(
        <div>
          <div style={{ position:"relative", marginBottom:10 }}>
            <img
              src={previewUrl} alt="Preview"
              style={{ width:"100%", maxHeight:280, objectFit:"cover", borderRadius:10, border:"2px solid #e2e8f0", display:"block" }}
            />
            {/* Quality overlay */}
            {qualityMsg&&(
              <div style={{
                position:"absolute", bottom:8, left:8, right:8,
                background:"rgba(0,0,0,0.7)", color:"white",
                borderRadius:6, padding:"6px 12px", fontSize:13, fontWeight:600,
                display:"flex", alignItems:"center", gap:6
              }}>
                <span style={{ color:qualityColor, fontSize:16 }}>
                  {quality?.isGood?"✅":"⚠️"}
                </span>
                {qualityMsg}
              </div>
            )}
          </div>

          <div style={{ display:"flex", gap:8 }}>
            <button onClick={retake} style={{
              flex:1, background:"white", border:"2px solid #e2e8f0",
              color:"#374151", padding:"11px 0", borderRadius:8,
              cursor:"pointer", fontWeight:700, fontSize:14
            }}>{t.retake}</button>
            <button onClick={usePhoto} style={{
              flex:2, background:"#10b981", border:"none",
              color:"white", padding:"11px 0", borderRadius:8,
              cursor:"pointer", fontWeight:700, fontSize:14
            }}>{t.usePhoto}</button>
          </div>
          {error&&<div style={{ fontSize:13, color:"#ef4444", marginTop:8, fontWeight:600 }}>{error}</div>}
        </div>
      )}

      {/* UPLOADING */}
      {step==="uploading"&&(
        <div style={{ textAlign:"center", padding:20 }}>
          <div style={{ fontSize:36, marginBottom:8 }}>⏳</div>
          <div style={{ fontSize:14, color:"#6366f1", fontWeight:600 }}>{t.uploading}</div>
        </div>
      )}

      {/* DONE — Photo uploaded */}
      {step==="done"&&previewUrl&&(
        <div>
          <div style={{ position:"relative", marginBottom:8 }}>
            <img
              src={previewUrl} alt="Uploaded"
              style={{ width:"100%", maxHeight:220, objectFit:"cover", borderRadius:10, border:"2px solid #10b981", display:"block" }}
            />
            <div style={{
              position:"absolute", top:8, right:8,
              background:"#10b981", color:"white",
              borderRadius:6, padding:"4px 10px", fontSize:12, fontWeight:700
            }}>✅ {t.uploaded}</div>
          </div>
          <button onClick={retake} style={{
            width:"100%", background:"white", border:"1.5px solid #e2e8f0",
            color:"#64748b", padding:"9px 0", borderRadius:8,
            cursor:"pointer", fontWeight:600, fontSize:13
          }}>🔄 {t.retake}</button>
        </div>
      )}

      {/* Already has URL (from Firestore) */}
      {step==="idle"&&value&&(
        <div>
          <img
            src={value} alt="Current"
            style={{ width:"100%", maxHeight:200, objectFit:"cover", borderRadius:10, border:"2px solid #10b981", display:"block", marginBottom:8 }}
          />
          <button onClick={retake} style={{
            width:"100%", background:"white", border:"1.5px solid #e2e8f0",
            color:"#64748b", padding:"9px 0", borderRadius:8,
            cursor:"pointer", fontWeight:600, fontSize:13
          }}>🔄 {t.retake}</button>
        </div>
      )}
    </div>
  );
}
