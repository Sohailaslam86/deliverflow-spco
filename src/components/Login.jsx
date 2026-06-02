import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Input, Btn } from "./Shared.jsx";

const T = {
  en: {
    welcome:"Welcome Back", signin:"Sign in to continue",
    email:"Email Address", password:"Password",
    signInBtn:"Sign In", invalidCreds:"Invalid email or password",
    footer:"2026 Saudi Pharmaceutical Co. SPCO",
    contactAdmin:"Contact your administrator for access"
  },
  ar: {
    welcome:"مرحباً بك", signin:"سجّل دخولك للمتابعة",
    email:"البريد الإلكتروني", password:"كلمة المرور",
    signInBtn:"تسجيل الدخول", invalidCreds:"بيانات غير صحيحة",
    footer:"2026 الشركة السعودية للأدوية SPCO",
    contactAdmin:"تواصل مع المسؤول للحصول على صلاحية الدخول"
  }
};

const DCS = [
  "Riyadh — Distribution Center",
  "Jeddah — Distribution Center",
  "Dammam — Distribution Center"
];

export default function Login({ onLogin, lang, setLang }) {
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const rtl = lang === "ar";
  const t = T[lang] || T.en;

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function doLogin() {
    if (!email.trim() || !pass.trim()) { setErr(t.invalidCreds); return; }
    setLoading(true); setErr("");
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
    } catch (e) {
      setErr(t.invalidCreds);
      setLoading(false);
    }
  }

  function handleKey(e) { if (e.key === "Enter") doLogin(); }

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"#0a0a0f", fontFamily:"'Segoe UI',sans-serif" }}>
      {/* Background panels */}
      <div style={{ position:"fixed", top:0, left:0, width:"50%", height:"100%", background:"linear-gradient(135deg,#0d1b2a,#1a3a5c)", zIndex:0 }} />
      <div style={{ position:"fixed", top:0, right:0, width:"50%", height:"100%", background:"#f8fafc", zIndex:0 }} />

      {/* Language Toggle */}
      <div style={{ position:"fixed", top:16, right:16, zIndex:100, display:"flex", gap:4, background:"rgba(255,255,255,0.1)", borderRadius:20, padding:4 }}>
        {[["en","EN"],["ar","عربي"]].map(([l,lbl]) => (
          <button key={l} onClick={() => setLang(l)}
            style={{ background:lang===l?"white":"none", color:lang===l?"#1A3A5C":"rgba(255,255,255,0.6)", border:"none", padding:"6px 14px", borderRadius:16, cursor:"pointer", fontSize:14, fontWeight:600 }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <div style={{ position:"fixed", top:0, left:0, right:0, background:"#f59e0b", color:"white", textAlign:"center", padding:"8px", fontSize:14, fontWeight:600, zIndex:200 }}>
          ⚠️ You are offline — Please connect to internet to login
        </div>
      )}

      <div style={{ display:"flex", width:"100%", maxWidth:1000, margin:"0 auto", minHeight:"100vh", position:"relative", zIndex:10 }}>

        {/* ── LEFT PANEL — Branding ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"40px 32px", color:"white", direction:"ltr" }}>

          {/* Logo Image — actual JPG */}
          <img
            src="/Logo_-_Elseif.jpg"
            alt="Al Seif Logo"
            style={{ width:180, height:"auto", marginBottom:10, objectFit:"contain" }}
          />

          {/* Arabic name */}
          <div style={{ fontSize:20, fontWeight:900, color:"white", marginBottom:2, fontFamily:"Arial", direction:"rtl" }}>
            الشركة السعودية للأدوية
          </div>

          {/* English name */}
          <div style={{ fontSize:15, fontWeight:700, color:"rgba(255,255,255,0.75)", marginBottom:28, letterSpacing:"0.5px" }}>
            Saudi Pharmaceutical Co.
          </div>

          {/* Red divider */}
          <div style={{ width:50, height:3, background:"#e74c3c", borderRadius:2, marginBottom:16 }} />

          {/* DeliverFlow Title */}
          <div style={{ fontSize:40, fontWeight:900, letterSpacing:"-1px", marginBottom:6 }}>DeliverFlow</div>
          <div style={{ fontSize:15, color:"rgba(255,255,255,0.5)", marginBottom:36 }}>Logistics and Delivery Management</div>

          {/* Distribution Centers */}
          {DCS.map(dc => (
            <div key={dc} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, fontSize:15, color:"rgba(255,255,255,0.75)" }}>
              <span style={{ width:9, height:9, borderRadius:"50%", background:"#e74c3c", flexShrink:0 }} />
              {dc}
            </div>
          ))}
        </div>

        {/* ── RIGHT PANEL — Login Form ── */}
        <div style={{ flex:1, background:"#f8fafc", display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px 32px", direction:rtl?"rtl":"ltr" }}>
          <div style={{ maxWidth:380, width:"100%", marginLeft:rtl?"auto":"0", marginRight:rtl?"0":"auto" }}>
            <h1 style={{ fontSize:30, fontWeight:900, color:"#0f172a", margin:"0 0 6px" }}>{t.welcome}</h1>
            <p style={{ fontSize:16, color:"#64748b", marginBottom:28 }}>{t.signin}</p>

            <Input label={t.email} value={email} onChange={setEmail} placeholder="name@spco.sa" />
            <div onKeyDown={handleKey}>
              <Input label={t.password} value={pass} onChange={setPass} type="password" placeholder="••••••••" />
            </div>

            {err && (
              <div style={{ background:"#fee2e2", color:"#991b1b", borderRadius:8, padding:"12px 16px", fontSize:15, marginBottom:14 }}>
                ❌ {err}
              </div>
            )}

            <Btn onClick={doLogin} disabled={loading||!isOnline} style={{ width:"100%", padding:14, fontSize:17, marginBottom:12 }}>
              {loading ? "Signing in..." : t.signInBtn}
            </Btn>

            {!isOnline && (
              <div style={{ background:"#fef3c7", color:"#92400e", borderRadius:8, padding:"10px 14px", fontSize:14, textAlign:"center", marginBottom:12 }}>
                ⚠️ Internet connection required to login
              </div>
            )}

            <div style={{ textAlign:"center", fontSize:14, color:"#94a3b8" }}>
              {t.contactAdmin}
            </div>
          </div>

          <div style={{ marginTop:32, textAlign:"center", fontSize:13, color:"#94a3b8" }}>{t.footer}</div>
        </div>
      </div>
    </div>
  );
}
