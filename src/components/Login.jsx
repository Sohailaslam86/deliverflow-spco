// src/components/Login.jsx
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { Input, Btn } from "./Shared.jsx";

const T = {
  en: {
    welcome:"Welcome Back", signin:"Sign in to continue",
    email:"Email Address", password:"Password",
    signInBtn:"Sign In", invalidCreds:"Invalid email or password",
    footer:"2026 Saudi Pharmaceutical Co. SPCO",
    contactAdmin:"Contact your administrator for access",
    forgotPassword:"Forgot Password?",
    resetPassword:"Reset Password",
    resetEmailSent:"Password reset email sent! Check your inbox.",
    resetError:"Email not found. Contact your administrator.",
    backToLogin:"← Back to Login",
    enterEmail:"Enter your registered email address",
    sendReset:"Send Reset Link",
    sending:"Sending...",
  },
  ar: {
    welcome:"مرحباً بك", signin:"سجّل دخولك للمتابعة",
    email:"البريد الإلكتروني", password:"كلمة المرور",
    signInBtn:"تسجيل الدخول", invalidCreds:"بيانات غير صحيحة",
    footer:"2026 الشركة السعودية للأدوية SPCO",
    contactAdmin:"تواصل مع المسؤول للحصول على صلاحية الدخول",
    forgotPassword:"نسيت كلمة المرور؟",
    resetPassword:"إعادة تعيين كلمة المرور",
    resetEmailSent:"تم إرسال رابط إعادة التعيين! تحقق من بريدك.",
    resetError:"البريد غير موجود. تواصل مع المسؤول.",
    backToLogin:"← العودة لتسجيل الدخول",
    enterEmail:"أدخل بريدك الإلكتروني المسجل",
    sendReset:"إرسال رابط الإعادة",
    sending:"جاري الإرسال...",
  }
};

const DCS = [
  "Riyadh — Distribution Center",
  "Jeddah — Distribution Center",
  "Dammam — Distribution Center"
];

// Short label for DC pills on mobile
function dcShort(dc) {
  return dc.split(" — ")[0] + " DC";
}

export default function Login({ onLogin, lang, setLang }) {
  const [email, setEmail]               = useState("");
  const [pass, setPass]                 = useState("");
  const [err, setErr]                   = useState("");
  const [loading, setLoading]           = useState(false);
  const [isOnline, setIsOnline]         = useState(navigator.onLine);
  const [showReset, setShowReset]       = useState(false);
  const [resetEmail, setResetEmail]     = useState("");
  const [resetMsg, setResetMsg]         = useState("");
  const [resetErr, setResetErr]         = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [isMobile, setIsMobile]         = useState(() => window.innerWidth < 640);

  const rtl = lang === "ar";
  const t   = T[lang] || T.en;

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  async function doReset() {
    if (!resetEmail.trim()) { setResetErr(t.resetError); return; }
    setResetLoading(true); setResetErr(""); setResetMsg("");
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim().toLowerCase());
      setResetMsg(t.resetEmailSent);
      setResetErr("");
    } catch(e) {
      setResetErr(t.resetError);
    }
    setResetLoading(false);
  }

  function handleKey(e) { if (e.key === "Enter") doLogin(); }

  // ── Shared form content (used in both mobile & desktop) ────────────────────
  function LoginForm() {
    return !showReset ? (
      <>
        <h1 style={{ fontSize: isMobile?26:32, fontWeight:900, color:"#0f172a", margin:"0 0 6px" }}>{t.welcome}</h1>
        <p style={{ fontSize: isMobile?15:17, color:"#64748b", marginBottom:30 }}>{t.signin}</p>

        <Input label={t.email} value={email} onChange={setEmail} placeholder="name@spco.sa" />
        <div onKeyDown={handleKey}>
          <Input label={t.password} value={pass} onChange={setPass} type="password" placeholder="••••••••" />
        </div>

        {err && (
          <div style={{ background:"#fee2e2", color:"#991b1b", borderRadius:8, padding:"12px 16px", fontSize:15, marginBottom:14 }}>
            ❌ {err}
          </div>
        )}

        <Btn onClick={doLogin} disabled={loading||!isOnline} style={{ width:"100%", padding:15, fontSize:17, marginBottom:12 }}>
          {loading ? "Signing in..." : t.signInBtn}
        </Btn>

        <div style={{ textAlign:"center", marginBottom:16 }}>
          <button onClick={()=>{ setShowReset(true); setResetEmail(email); setResetMsg(""); setResetErr(""); }}
            style={{ background:"none", border:"none", color:"#6366f1", cursor:"pointer", fontSize:14, fontWeight:600, textDecoration:"underline" }}>
            {t.forgotPassword}
          </button>
        </div>

        {!isOnline && (
          <div style={{ background:"#fef3c7", color:"#92400e", borderRadius:8, padding:"10px 14px", fontSize:14, textAlign:"center", marginBottom:12 }}>
            ⚠️ Internet connection required to login
          </div>
        )}

        <div style={{ textAlign:"center", fontSize:15, color:"#94a3b8" }}>
          {t.contactAdmin}
        </div>
      </>
    ) : (
      <>
        <button onClick={()=>setShowReset(false)}
          style={{ background:"none", border:"none", color:"#6366f1", cursor:"pointer", fontSize:14, fontWeight:600, marginBottom:24, padding:0, textAlign:rtl?"right":"left" }}>
          {t.backToLogin}
        </button>

        <h1 style={{ fontSize: isMobile?24:28, fontWeight:900, color:"#0f172a", margin:"0 0 8px" }}>{t.resetPassword}</h1>
        <p style={{ fontSize:15, color:"#64748b", marginBottom:28 }}>{t.enterEmail}</p>

        <Input label={t.email} value={resetEmail} onChange={setResetEmail} placeholder="name@spco.sa" />

        {resetMsg && (
          <div style={{ background:"#d1fae5", color:"#065f46", borderRadius:8, padding:"12px 16px", fontSize:14, marginBottom:14, fontWeight:600 }}>
            ✅ {resetMsg}
          </div>
        )}
        {resetErr && (
          <div style={{ background:"#fee2e2", color:"#991b1b", borderRadius:8, padding:"12px 16px", fontSize:14, marginBottom:14 }}>
            ❌ {resetErr}
          </div>
        )}

        <Btn onClick={doReset} disabled={resetLoading||!isOnline} style={{ width:"100%", padding:15, fontSize:17, marginBottom:16 }}>
          {resetLoading ? t.sending : t.sendReset}
        </Btn>
      </>
    );
  }

  // ── Language toggle (shared) ───────────────────────────────────────────────
  function LangToggle({ dark }) {
    return (
      <div style={{ display:"flex", gap:4, background: dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.06)", borderRadius:20, padding:4 }}>
        {[["en","EN"],["ar","عربي"]].map(([l,lbl]) => (
          <button key={l} onClick={() => setLang(l)}
            style={{
              background: lang===l ? (dark?"white":"#1A3A5C") : "none",
              color: lang===l ? (dark?"#1A3A5C":"white") : (dark?"rgba(255,255,255,0.6)":"#64748b"),
              border:"none", padding:"6px 14px", borderRadius:16,
              cursor:"pointer", fontSize:14, fontWeight:600
            }}>
            {lbl}
          </button>
        ))}
      </div>
    );
  }

  // ── OFFLINE BANNER ─────────────────────────────────────────────────────────
  const OfflineBanner = !isOnline ? (
    <div style={{ position:"fixed", top:0, left:0, right:0, background:"#f59e0b", color:"white", textAlign:"center", padding:"8px", fontSize:14, fontWeight:600, zIndex:200 }}>
      ⚠️ You are offline — Please connect to internet to login
    </div>
  ) : null;

  // ══════════════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT  (<640px)
  // ══════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:"#f8fafc", fontFamily:"'Segoe UI',sans-serif" }}>
        {OfflineBanner}

        {/* ── TOP BRANDING STRIP ── */}
        <div style={{ background:"linear-gradient(135deg,#0d1b2a,#1a3a5c)", padding:"16px 20px 14px" }}>

          {/* Lang toggle — top right */}
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10 }}>
            <LangToggle dark />
          </div>

          {/* Logo + names */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
            <svg viewBox="0 0 100 90" width="36" height="32" style={{ flexShrink:0 }}>
              <polygon points="50,4 96,86 4,86" fill="#c0392b"/>
            </svg>
            <div>
              <div style={{ fontSize:20, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>DeliverFlow</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)" }}>Saudi Pharmaceutical Co.</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", direction:"rtl", textAlign:"right" }}>الشركة السعودية للأدوية</div>
            </div>
          </div>

          {/* DC Pills — horizontal */}
          <div style={{ display:"flex", gap:8 }}>
            {DCS.map(dc => (
              <div key={dc} style={{
                flex:1, background:"rgba(255,255,255,0.08)",
                border:"0.5px solid rgba(255,255,255,0.18)",
                borderRadius:8, padding:"7px 4px", textAlign:"center"
              }}>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.8)", whiteSpace:"nowrap" }}>
                  • {dcShort(dc)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── LOGIN FORM ── */}
        <div style={{ flex:1, padding:"28px 24px", direction:rtl?"rtl":"ltr" }}>
          <LoginForm />
        </div>

        {/* ── FOOTER ── */}
        <div style={{ textAlign:"center", fontSize:12, color:"#94a3b8", padding:"12px 20px 20px" }}>
          {t.footer}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT  (≥640px) — original, unchanged
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"#0a0a0f", fontFamily:"'Segoe UI',sans-serif" }}>
      {/* Background panels */}
      <div style={{ position:"fixed", top:0, left:0, width:"50%", height:"100%", background:"linear-gradient(135deg,#0d1b2a,#1a3a5c)", zIndex:0 }} />
      <div style={{ position:"fixed", top:0, right:0, width:"50%", height:"100%", background:"#f8fafc", zIndex:0 }} />

      {/* Language Toggle */}
      <div style={{ position:"fixed", top:16, right:16, zIndex:100 }}>
        <LangToggle dark />
      </div>

      {OfflineBanner}

      <div style={{ display:"flex", width:"100%", maxWidth:1000, margin:"0 auto", minHeight:"100vh", position:"relative", zIndex:10 }}>

        {/* LEFT PANEL — Branding */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"flex-start", padding:"40px 40px", color:"white", direction:"ltr" }}>
          <svg viewBox="0 0 100 90" width="120" height="108" style={{ marginBottom:16 }}>
            <polygon points="50,4 96,86 4,86" fill="#c0392b"/>
          </svg>
          <div style={{ fontSize:20, fontWeight:900, color:"white", marginBottom:2, fontFamily:"Arial", direction:"rtl" }}>
            الشركة السعودية للأدوية
          </div>
          <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.75)", marginBottom:28, letterSpacing:"0.5px" }}>
            Saudi Pharmaceutical Co.
          </div>
          <div style={{ width:50, height:3, background:"#e74c3c", borderRadius:2, marginBottom:16 }} />
          <div style={{ fontSize:40, fontWeight:900, letterSpacing:"-1px", marginBottom:6 }}>DeliverFlow</div>
          <div style={{ fontSize:15, color:"rgba(255,255,255,0.5)", marginBottom:36 }}>Logistics and Delivery Management</div>
          <div style={{ width:"100%" }}>
            {DCS.map(dc => (
              <div key={dc} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, fontSize:15, color:"rgba(255,255,255,0.75)" }}>
                <span style={{ width:9, height:9, borderRadius:"50%", background:"#e74c3c", flexShrink:0 }} />
                {dc}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex:1, background:"#f8fafc", display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px 40px", direction:rtl?"rtl":"ltr" }}>
          <div style={{ maxWidth:400, width:"100%", marginLeft:rtl?"auto":"0", marginRight:rtl?"0":"auto", flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
            <LoginForm />
          </div>

          <div style={{ textAlign:"center", fontSize:13, color:"#94a3b8", paddingBottom:8 }}>
            {t.footer}
          </div>
        </div>
      </div>
    </div>
  );
}
