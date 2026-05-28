import { useState } from "react";
import { DEMO_USERS, DEMO_PW } from "../data/masterData.js";
import { Input, Btn } from "./Shared.jsx";

const translations = {
  en: {
    welcome: "Welcome to DeliverFlow",
    subtitle: "Saudi Pharmaceutical Co. Logistics System",
    loginCard: "Secure User Sign In",
    emailLabel: "📧 Email ID or Mobile Number",
    passLabel: "🔒 Password",
    loginBtn: "Sign In securely →",
    invalid: "Invalid email/phone or password",
    footer: "SPCO Operational Portal — 2026"
  },
  ar: {
    welcome: "مرحباً بكم في دليفر فلو",
    subtitle: "نظام الخدمات اللوجستية للشركة السعودية للأدوية",
    loginCard: "تسجيل دخول المستخدم الآمن",
    emailLabel: "📧 البريد الإلكتروني أو رقم الجوال",
    passLabel: "🔒 كلمة المرور",
    loginBtn: "← تسجيل الدخول بأمان",
    invalid: "بيانات الاعتماد غير صحيحة",
    footer: "بوابة الشركة السعودية للأدوية التشغيلية — ٢٠٢٦"
  }
};

export default function Login({ onLogin, lang, setLang }) {
  const [email, setEmail] = useState(\"\");
  const [pass, setPass]   = useState(\"\");
  const [err, setErr]     = useState(\"\");

  const rtl = lang === \"ar\";
  const t = translations[lang] || translations.en;

  function doLogin() {
    const u = DEMO_USERS.find(u =>
      (u.email === email.trim().toLowerCase() || u.phone === email.trim()) && pass === DEMO_PW
    );
    if (u) onLogin(u);
    else setErr(t.invalid);
  }

  return (
    <div style={{ minHeight: \"100vh\", display: \"flex\", flexDirection: \"column\", background: \"#0f172a\", justifyContent: \"center\", alignItems: \"center\", direction: rtl ? \"rtl\" : \"ltr\", padding: 16, fontFamily: \"sans-serif\" }}>
      <div style={{ background: \"white\", padding: 32, borderRadius: 16, width: \"100%\", maxWidth: 400, boxShadow: \"0 10px 25px rgba(0,0,0,0.2)\" }}>
        <div style={{ textAlign: \"center\", marginBottom: 24 }}>
          <span style={{ fontSize: 40 }}>🚚</span>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: \"10px 0 4px 0\", color: \"#1e293b\" }}>{t.welcome}</h2>
          <p style={{ fontSize: 12, color: \"#64748b\", margin: 0 }}>{t.subtitle}</p>
        </div>

        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: \"#475569\", borderBottom: \"2px solid #f1f5f9\", paddingBottom: 8 }}>{t.loginCard}</h3>
        
        {err && <div style={{ background: \"#fee2e2\", color: \"#b91c1c\", padding: \"10px 12px\", borderRadius: 8, fontSize: 13, marginBottom: 14, fontWeight: 600 }}>⚠️ {err}</div>}

        <div style={{ display: \"flex\", flexDirection: \"column\", gap: 14 }}>
          <Input label={t.emailLabel} value={email} onChange={setEmail} type=\"text\" placeholder=\"example@spco.sa\" />
          <Input label={t.passLabel} value={pass} onChange={setPass} type=\"password\" placeholder=\"••••••••\" />
          <Btn onClick={doLogin} style={{ width: \"100%\", marginTop: 10, fontSize: 14 }}>{t.loginBtn}</Btn>
        </div>

        {/* Language switcher inside login */}
        <div style={{ display: \"flex\", justifyContent: \"center\", gap: 12, marginTop: 24, paddingTop: 16, borderTop: \"1px solid #f1f5f9\" }}>
          <button onClick={() => setLang(\"en\")} style={{ border: \"none\", background: \"none\", cursor: \"pointer\", fontWeight: lang===\"en\"?700:400, color: lang===\"en\"?\"#1e3a8a\":\"#94a3b8\", fontSize: 13 }}>English (EN)</button>
          <button onClick={() => setLang(\"ar\")} style={{ border: \"none\", background: \"none\", cursor: \"pointer\", fontWeight: lang===\"ar\"?700:400, color: lang===\"ar\"?\"#1e3a8a\":\"#94a3b8\", fontSize: 13 }}>عربي (AR)</button>
        </div>
      </div>
      <div style={{ fontSize: 11, color: \"#475569\", marginTop: 16 }}>{t.footer}</div>
    </div>
  );
}
