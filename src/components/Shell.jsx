// src/components/Shell.jsx
// v10.0 — AI Assistant chatbot widget added (role-aware, bilingual)
import { useState, useEffect, useRef } from "react";
import { RC, RA, RI, ROLE_LABELS } from "../data/masterData.js";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { loadNotifications, markRead, markAllRead } from "../notificationService.js";

const T = {
  en: {
    dashboard: "Dashboard",
    invoices: "All Invoices", dcinvoices: "Deliverables",
    upload: "Invoice Upload & Post",
    trips: "Trip Management",
    calendar: "Dispatch Calendar",
    users: "User Management",
    masterdata: "System Configuration",
    fleet: "Fleet Management",
    fuel: "Fuel Tracking",
    reports: "Reports",
    download: "POD Management",
    assign: "Dispatch Management",
    mydeliveries: "My Deliveries",
    odometer: "Daily Mileage Log",
    search: "Search Invoices",
    alerts: "Alerts", logout: "Logout",
    admin: "System Administrator",
    planning: "Planning",
    manager: "Distribution Center Manager",
    logistic: "Logistics Manager",
    driver: "Delivery Partner",
    viewonly: "View Only",
    management: "Management",
    notifications: "Notifications",
    markAllRead: "Mark All Read",
    noNotifications: "No new notifications",
    // Chatbot
    chatTitle: "DeliverFlow Assistant",
    chatSubtitle: "Ask me anything about the system",
    chatPlaceholder: "Type your question...",
    chatSend: "Send",
    chatThinking: "Thinking...",
    chatWelcome: "Hello! I'm your DeliverFlow Assistant. How can I help you today?",
    chatError: "Sorry, something went wrong. Please try again.",
    chatClose: "Close",
  },
  ar: {
    dashboard: "لوحة القيادة",
    invoices: "جميع الفواتير", dcinvoices: "المستحقات",
    upload: "رفع وترحيل الفواتير",
    trips: "إدارة الرحلات",
    calendar: "تقويم الإرسال",
    users: "إدارة المستخدمين",
    masterdata: "إعدادات النظام",
    fleet: "إدارة الأسطول",
    fuel: "تتبع الوقود",
    reports: "التقارير",
    download: "إدارة وثائق التسليم",
    assign: "إدارة الإرسال",
    mydeliveries: "تسليماتي",
    odometer: "سجل المسافات اليومي",
    search: "البحث عن الفواتير",
    alerts: "تنبيهات", logout: "تسجيل الخروج",
    admin: "مدير النظام",
    planning: "التخطيط",
    manager: "مدير مركز التوزيع",
    logistic: "مدير اللوجستيات",
    driver: "شريك التوصيل",
    viewonly: "عرض فقط",
    management: "الإدارة",
    notifications: "الإشعارات",
    markAllRead: "تعليم الكل كمقروء",
    noNotifications: "لا توجد إشعارات جديدة",
    // Chatbot
    chatTitle: "مساعد DeliverFlow",
    chatSubtitle: "اسألني أي شيء عن النظام",
    chatPlaceholder: "اكتب سؤالك...",
    chatSend: "إرسال",
    chatThinking: "جاري التفكير...",
    chatWelcome: "مرحباً! أنا مساعد DeliverFlow. كيف يمكنني مساعدتك اليوم؟",
    chatError: "عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    chatClose: "إغلاق",
  }
};

const NAV = {
  admin:      [["dashboard","📊"],["assign","🚚"],["upload","📤"],["trips","🔄"],["calendar","📅"],["fleet","🚗"],["fuel","⛽"],["users","👥"],["masterdata","⚙️"],["reports","📈"],["download","📥"]],
  planning:   [["dashboard","📊"],["upload","📤"],["download","📥"],["users","👥"]],
  manager:    [["dashboard","📊"],["assign","🚚"],["trips","🔄"],["calendar","📅"],["fleet","🚗"],["fuel","⛽"],["reports","📈"],["users","👥"],["masterdata","⚙️"],["download","📥"]],
  logistic:   [["dashboard","📊"],["fleet","🚗"],["fuel","⛽"],["reports","📈"],["users","👥"],["download","📥"]],
  driver:     [["mydeliveries","📦"],["odometer","🔢"],["masterdata","⚙️"]],
  viewonly:   [["search","🔍"]],
  management: [["dashboard","📊"],["fleet","🚗"],["fuel","⛽"],["reports","📈"],["download","📥"]],
};

const NOTIF_ICONS = {
  upload: "📤", delivered: "✅", failed: "❌", staged: "📦",
  invoice_assigned: "📦", leave: "🏖️", leave_approved: "✅",
  leave_rejected: "❌", request: "📝", request_action: "🔔",
  vehicle: "🚗", vehicle_approved: "✅", vehicle_rejected: "❌",
  activity_request: "🏃", activity_approved: "✅", activity_rejected: "❌",
};

const NOTIF_T = {
  en: {
    upload: (d) => (d.count || "") + " new invoices for " + (d.dc || "") + " DC",
    delivered: (d) => "Invoice " + (d.invoiceId || "") + " delivered by " + (d.driverName || ""),
    failed: (d) => "Invoice " + (d.invoiceId || "") + " failed — " + (d.failReason || ""),
    staged: (d) => "Invoice " + (d.invoiceId || "") + " assigned to you",
    invoice_assigned: (d) => "Invoice " + (d.invoiceId || "") + " assigned to you",
    leave: (d) => (d.driverName || "") + " submitted a leave request",
    leave_approved: () => "Your leave request has been approved",
    leave_rejected: () => "Your leave request was rejected",
    request: (d) => "New access request from " + (d.name || ""),
    request_action: (d) => "Your request status: " + (d.status || ""),
    vehicle: (d) => "Vehicle request from " + (d.dc || "") + " DC",
    vehicle_approved: (d) => "Vehicle " + (d.plate || "") + " request approved",
    vehicle_rejected: () => "Your vehicle request was rejected",
    activity_request: (d) => (d.driverName || "") + " submitted an additional activity request",
    activity_approved: (d) => "Your additional activity has been approved" + (d.purpose ? ": " + d.purpose : ""),
    activity_rejected: () => "Your additional activity request was rejected",
  },
  ar: {
    upload: (d) => "تم رفع " + (d.count || "") + " فواتير لمركز " + (d.dc || ""),
    delivered: (d) => "تم تسليم الفاتورة " + (d.invoiceId || "") + " بواسطة " + (d.driverName || ""),
    failed: (d) => "فشل تسليم الفاتورة " + (d.invoiceId || ""),
    staged: (d) => "تم تخصيص الفاتورة " + (d.invoiceId || "") + " لك",
    invoice_assigned: (d) => "تم تخصيص الفاتورة " + (d.invoiceId || "") + " لك",
    leave: (d) => (d.driverName || "") + " قدّم طلب إجازة",
    leave_approved: () => "تمت الموافقة على طلب إجازتك",
    leave_rejected: () => "تم رفض طلب إجازتك",
    request: (d) => "طلب وصول جديد من " + (d.name || ""),
    request_action: (d) => "تم اتخاذ إجراء على طلبك: " + (d.status || ""),
    vehicle: (d) => "طلب مركبة من مركز " + (d.dc || ""),
    vehicle_approved: (d) => "تمت الموافقة على طلب المركبة " + (d.plate || ""),
    vehicle_rejected: () => "تم رفض طلب المركبة",
    activity_request: (d) => (d.driverName || "") + " قدّم طلب نشاط إضافي",
    activity_approved: (d) => "تمت الموافقة على نشاطك الإضافي" + (d.purpose ? ": " + d.purpose : ""),
    activity_rejected: () => "تم رفض طلب نشاطك الإضافي",
  },
};

function getNotifText(n, lang) {
  const langMap = NOTIF_T[lang] || NOTIF_T.en;
  const fn = langMap[n.type];
  if (fn) return fn(n.data || n);
  return n.message || n.title || "🔔";
}

function getNotifDestPage(notif, userRole) {
  const type = notif.type || "";
  const map = {
    upload: { admin: "upload", planning: "upload" },
    delivered: { admin: "assign", manager: "assign", driver: "mydeliveries", logistic: "assign" },
    failed: { admin: "assign", manager: "assign", driver: "mydeliveries", logistic: "assign" },
    staged: { admin: "assign", manager: "assign", driver: "mydeliveries", planning: "assign" },
    invoice_assigned: { admin: "assign", manager: "assign", driver: "mydeliveries", planning: "assign" },
    leave: { admin: "masterdata", manager: "masterdata", logistic: "masterdata" },
    leave_approved: { driver: "masterdata" },
    leave_rejected: { driver: "masterdata" },
    request: { admin: "users", manager: "users", logistic: "users", planning: "users" },
    request_action: { admin: "users", manager: "users", logistic: "users", planning: "users" },
    vehicle: { admin: "fleet" },
    vehicle_approved: { admin: "fleet", manager: "fleet", logistic: "fleet" },
    vehicle_rejected: { admin: "fleet", manager: "fleet", logistic: "fleet" },
    activity_request: { admin: "reports", manager: "reports", logistic: "reports" },
    activity_approved: { driver: "mydeliveries" },
    activity_rejected: { driver: "mydeliveries" },
  };
  const typeMap = map[type];
  if (!typeMap) return null;
  return typeMap[userRole] || null;
}

// ─── FAQ QUICK BUTTONS per role ────────────────────────────────────────────────
const FAQ_BY_ROLE = {
  admin: [
    "How do I approve a fuel entry?",
    "How to add a new vehicle?",
    "What does SLA Heatmap show?",
    "How to assign an invoice to a driver?",
  ],
  manager: [
    "How do I approve a fuel entry?",
    "How to stage an invoice for dispatch?",
    "How do I request a new vehicle?",
    "What is the Dispatch Calendar?",
  ],
  logistic: [
    "How to add a fuel entry?",
    "How do I send a vehicle for maintenance?",
    "What is KMPL and how is it calculated?",
    "How to view vehicle utilization?",
  ],
  planning: [
    "How do I upload invoices?",
    "What is the difference between Govt and Private invoices?",
    "How to check POD status?",
    "How to manage user access requests?",
  ],
  driver: [
    "How do I mark a delivery as delivered?",
    "How to submit a fuel entry?",
    "How to apply for leave?",
    "What is the odometer log?",
  ],
  management: [
    "How to read the delivery rate?",
    "What does vehicle utilization mean?",
    "How to export a report?",
    "What is the SLA Heatmap?",
  ],
  viewonly: [
    "How to search for an invoice?",
    "What does invoice status mean?",
    "How to download POD?",
  ],
};

const FAQ_AR_BY_ROLE = {
  admin: [
    "كيف أوافق على إدخال وقود؟",
    "كيف أضيف مركبة جديدة؟",
    "ماذا يعرض SLA Heatmap؟",
    "كيف أخصص فاتورة لسائق؟",
  ],
  manager: [
    "كيف أوافق على إدخال وقود؟",
    "كيف أرسل فاتورة للإرسال؟",
    "كيف أطلب مركبة جديدة؟",
    "ما هو تقويم الإرسال؟",
  ],
  logistic: [
    "كيف أضيف إدخال وقود؟",
    "كيف أرسل مركبة للصيانة؟",
    "ما هو KMPL وكيف يُحسب؟",
    "كيف أعرض استخدام المركبات؟",
  ],
  planning: [
    "كيف أرفع الفواتير؟",
    "ما الفرق بين الفواتير الحكومية والخاصة؟",
    "كيف أتحقق من حالة POD؟",
    "كيف أدير طلبات الوصول؟",
  ],
  driver: [
    "كيف أسجل التسليم؟",
    "كيف أرسل إدخال وقود؟",
    "كيف أطلب إجازة؟",
    "ما هو سجل عداد المسافة؟",
  ],
  management: [
    "كيف أقرأ معدل التسليم؟",
    "ما معنى استخدام المركبات؟",
    "كيف أصدّر تقريراً؟",
    "ما هو SLA Heatmap؟",
  ],
  viewonly: [
    "كيف أبحث عن فاتورة؟",
    "ما معنى حالة الفاتورة؟",
    "كيف أحمّل POD؟",
  ],
};

// ─── SYSTEM PROMPT builder — role-aware ────────────────────────────────────────
function buildSystemPrompt(user, lang) {
  const isArabic = lang === "ar";
  const roleLabel = ROLE_LABELS[user.role] || user.role;
  const dc = user.dc && user.dc !== "Head Office" ? user.dc : "All Distribution Centers";

  const roleAccess = {
    admin: "Full access to all screens: Dashboard, Dispatch Management, Invoice Upload, Trip Management, Dispatch Calendar, Fleet Management, Fuel Tracking, User Management, System Configuration, Reports, POD Management, SLA Heatmap.",
    manager: `Access to: Dashboard, Dispatch Management, Trip Management, Dispatch Calendar, Fleet Management, Fuel Tracking, Reports, User Management, System Configuration, POD Management. Scoped to ${dc} only.`,
    logistic: "Access to: Dashboard, Fleet Management, Fuel Tracking (Riyadh DC only), Reports, User Management, POD Management.",
    planning: "Access to: Dashboard, Invoice Upload (all DCs), POD Management, User Management (view only).",
    driver: "Access to: My Deliveries, Daily Mileage Log, System Configuration (own profile only). Can submit fuel entries for manager approval.",
    management: "Read-only access to: Dashboard, Fleet Management, Fuel Tracking, Reports, POD Management. No write access.",
    viewonly: "Access to: Search Invoices only.",
  };

  const base = `You are DeliverFlow Assistant — an AI helper for DeliverFlow SPCO, a logistics and delivery management system for Saudi Pharmaceutical Co. (SPCO).

You are speaking with: ${user.name}
Their role: ${roleLabel}
Their DC: ${dc}
Their access: ${roleAccess[user.role] || "Standard access"}

KEY SYSTEM KNOWLEDGE:
- DeliverFlow manages 3 Distribution Centers: Riyadh, Jeddah, Dammam
- 7 user roles: System Administrator, DC Manager, Logistics Manager, Planning, Delivery Partner, Management, View Only
- Invoice lifecycle: Unassigned → To Be Assigned → Staged for Dispatch → In Transit → Delivered / Failed
- Fuel entries by Delivery Partners require Manager or Logistics Manager approval (status: pending_approval)
- Vehicle documents tracked: Fahas (inspection), Istimara (registration), Insurance
- KM source of truth: tripLogs.totalKM (never sum with fuelLogs.tripKM)
- SLA rule: In-City (<300km) = same-day delivery. Out-City (≥300km) = next-day SLA
- Logistic role: fuel scope limited to Riyadh DC only
- Vehicle requests: all non-Admin roles must submit a request; only Admin approves
- App URL: deliverflow-spco.vercel.app

RESPONSE RULES:
1. Answer ONLY questions about DeliverFlow SPCO system, features, workflows, and roles
2. If asked about something outside DeliverFlow, politely say you can only help with DeliverFlow topics
3. Keep answers concise and practical — step-by-step when needed
4. Respect the user's role — only explain features they have access to
5. ${isArabic ? "IMPORTANT: Always respond in Arabic regardless of the question language." : "Respond in English."}
6. Be friendly and helpful — like a knowledgeable colleague`;

  return base;
}

// ─── AI CHATBOT WIDGET ─────────────────────────────────────────────────────────
function ChatbotWidget({ user, lang, t }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: t.chatWelcome }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const rtl = lang === "ar";

  const faqs = lang === "ar"
    ? (FAQ_AR_BY_ROLE[user.role] || FAQ_AR_BY_ROLE.viewonly)
    : (FAQ_BY_ROLE[user.role] || FAQ_BY_ROLE.viewonly);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(user, lang);
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: apiMessages,
        }),
      });

      const data = await response.json();
      const reply = data?.content?.[0]?.text || t.chatError;
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: t.chatError }]);
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const accentColor = RC[user.role] || "#1A3A5C";
  const showFAQs = messages.length <= 1;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="DeliverFlow Assistant"
        style={{
          position: "fixed", bottom: 24, right: rtl ? "auto" : 24, left: rtl ? 24 : "auto",
          width: 56, height: 56, borderRadius: "50%",
          background: accentColor, border: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          cursor: "pointer", zIndex: 900,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, transition: "transform 0.2s",
          transform: open ? "scale(0.9)" : "scale(1)",
        }}
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: 90, right: rtl ? "auto" : 24, left: rtl ? 24 : "auto",
          width: 360, height: 520,
          background: "white", borderRadius: 16,
          boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          zIndex: 901, overflow: "hidden",
          direction: rtl ? "rtl" : "ltr",
          fontFamily: "'Segoe UI', sans-serif",
        }}>

          {/* Header */}
          <div style={{
            background: accentColor, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 10, flexShrink: 0
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0
            }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "white" }}>{t.chatTitle}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{t.chatSubtitle}</div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: "rgba(255,255,255,0.15)", border: "none",
              color: "white", width: 28, height: 28, borderRadius: "50%",
              cursor: "pointer", fontSize: 14, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: m.role === "user" ? (rtl ? "flex-start" : "flex-end") : (rtl ? "flex-end" : "flex-start"),
                marginBottom: 10
              }}>
                {m.role === "assistant" && (
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: accentColor, color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, flexShrink: 0, marginRight: rtl ? 0 : 6, marginLeft: rtl ? 6 : 0,
                    alignSelf: "flex-end"
                  }}>🤖</div>
                )}
                <div style={{
                  maxWidth: "78%", padding: "9px 12px", borderRadius: 12,
                  fontSize: 13, lineHeight: 1.5,
                  background: m.role === "user" ? accentColor : "#f1f5f9",
                  color: m.role === "user" ? "white" : "#0f172a",
                  borderBottomRightRadius: m.role === "user" && !rtl ? 3 : 12,
                  borderBottomLeftRadius: m.role === "assistant" && !rtl ? 3 : 12,
                  whiteSpace: "pre-wrap",
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* FAQ quick buttons — shown only when chat is fresh */}
            {showFAQs && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, textAlign: rtl ? "right" : "left" }}>
                  {lang === "ar" ? "أسئلة شائعة" : "Quick questions"}
                </div>
                {faqs.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)}
                    style={{
                      display: "block", width: "100%",
                      background: "white", border: `1px solid ${accentColor}33`,
                      borderRadius: 8, padding: "8px 10px", marginBottom: 5,
                      fontSize: 12, color: accentColor, cursor: "pointer",
                      textAlign: rtl ? "right" : "left", fontWeight: 600,
                      transition: "background 0.15s"
                    }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "flex-end" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: accentColor, color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, flexShrink: 0
                }}>🤖</div>
                <div style={{ background: "#f1f5f9", borderRadius: 12, borderBottomLeftRadius: 3, padding: "9px 14px" }}>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: accentColor, opacity: 0.4,
                        animation: `bounce 1.2s ${i * 0.2}s infinite`
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px", borderTop: "1px solid #f1f5f9",
            display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t.chatPlaceholder}
              rows={1}
              disabled={loading}
              style={{
                flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 10,
                padding: "9px 12px", fontSize: 13, outline: "none",
                fontFamily: "inherit", resize: "none", lineHeight: 1.4,
                maxHeight: 80, overflowY: "auto",
                background: loading ? "#f8fafc" : "white",
              }}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: loading || !input.trim() ? "#e2e8f0" : accentColor,
                border: "none", color: "white", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0, transition: "background 0.2s"
              }}>
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ─── MAIN SHELL ────────────────────────────────────────────────────────────────
export default function Shell({ user, lang, setLang, page, setPage, onLogout, children, alerts }) {
  const [open, setOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwDone, setPwDone] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const rtl = lang === "ar";
  const t = T[lang] || T.en;
  const nav = NAV[user.role] || NAV.viewonly;
  const cur = nav.find(n => n[0] === page)?.[0] || nav[0][0];
  const activeAlerts = (alerts || []).filter(a =>
    a.status === "active" &&
    (!user.dc || a.dc === user.dc || user.role === "admin" || user.role === "management")
  );
  const unreadCount = notifications.filter(n => !n.read).length;
  const dcLabel = user.dc && user.dc !== "Head Office" ? ` — ${user.dc}` : "";

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) fetchNotifications(); });
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  async function fetchNotifications() {
    const notifs = await loadNotifications(user);
    setNotifications(notifs);
  }

  async function handleMarkRead(notifId) {
    await markRead(notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  }

  async function handleMarkAllRead() {
    await markAllRead(user);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function timeAgo(iso) {
    const diff = Math.floor((new Date() - new Date(iso)) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    return Math.floor(diff / 86400) + "d ago";
  }

  async function changePassword() {
    if (!currentPw) { setPwErr("Please enter current password"); return; }
    if (newPw.length < 6) { setPwErr("New password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { setPwErr("Passwords do not match"); return; }
    setPwLoading(true); setPwErr("");
    try {
      const firebaseUser = auth.currentUser;
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPw);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPw);
      setPwDone("✅ Password changed successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => { setShowChangePw(false); setPwDone(""); }, 3000);
    } catch (e) {
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setPwErr("Current password is incorrect");
      } else { setPwErr("Error: " + e.message); }
    }
    setPwLoading(false);
  }

  function getPageLabel(id) {
    if (id === "invoices" && (user.role === "manager" || user.role === "logistic")) return t.dcinvoices;
    if (id === "assign") return t.assign;
    return t[id] || id;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9", direction: rtl ? "rtl" : "ltr", fontFamily: "'Segoe UI',sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{
        width: 250, position: "fixed", height: "100vh",
        background: RC[user.role] || "#1A3A5C",
        display: "flex", flexDirection: "column", zIndex: 200,
        transition: "transform 0.3s",
        transform: open ? "translateX(0)" : (rtl ? "translateX(100%)" : "translateX(-100%)"),
        [rtl ? "right" : "left"]: 0,
        overflowY: "auto",
        boxShadow: "4px 0 20px rgba(0,0,0,0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontSize: 26 }}>🚚</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "white" }}>DeliverFlow</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2 }}>SPCO</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {nav.map(([id, icon]) => (
            <button key={id} onClick={() => { setPage(id); setOpen(false); }}
              style={{
                width: "100%",
                background: cur === id ? (RA[user.role] || "#2471A3") + "44" : "none",
                border: `1px solid ${cur === id ? (RA[user.role] || "#2471A3") : "transparent"}`,
                color: cur === id ? "white" : "rgba(255,255,255,0.65)",
                padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                textAlign: rtl ? "right" : "left", fontSize: 14,
                display: "flex", alignItems: "center", gap: 10,
                marginBottom: 3, fontWeight: cur === id ? 700 : 400
              }}>
              <span style={{ fontSize: 17, width: 22, textAlign: "center" }}>{icon}</span>
              <span>{getPageLabel(id)}</span>
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", gap: 6, padding: "10px 16px" }}>
          {[["en", "EN"], ["ar", "عربي"]].map(([l, lbl]) => (
            <button key={l} onClick={() => setLang(l)}
              style={{
                flex: 1, border: "1px solid rgba(255,255,255,0.2)",
                background: lang === l ? (RA[user.role] || "#2471A3") : "none",
                color: lang === l ? "white" : "rgba(255,255,255,0.5)",
                borderRadius: 6, padding: "7px 0", cursor: "pointer",
                fontSize: 13, fontWeight: 600
              }}>{lbl}</button>
          ))}
        </div>

        <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: RA[user.role] || "#2471A3",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 16, color: "white", flexShrink: 0
            }}>{(user.name || "?").charAt(0)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.displayName || user.name}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                {ROLE_LABELS[user.role] || user.role}{dcLabel}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { setShowChangePw(true); setShowUserMenu(false); setPwErr(""); setPwDone(""); }}
              style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 12, padding: "9px 6px", borderRadius: 6, fontWeight: 600 }}>
              🔑 Change PW
            </button>
            <button onClick={onLogout}
              style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 12, padding: "9px 6px", borderRadius: 6, fontWeight: 600 }}>
              {t.logout} →
            </button>
          </div>
        </div>
      </aside>

      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 199 }} />}

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header style={{
          background: "white", padding: "0 20px", height: 60,
          display: "flex", alignItems: "center", gap: 12,
          position: "sticky", top: 0, zIndex: 100,
          borderBottom: `3px solid ${RA[user.role] || "#2471A3"}`,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
        }}>
          <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#374151", flexShrink: 0, padding: 4 }}>☰</button>
          <div style={{ flex: 1, fontWeight: 800, fontSize: 18, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {getPageLabel(cur)}
          </div>
          {activeAlerts.length > 0 && (
            <button onClick={() => setPage("dashboard")} style={{ background: "#fee2e2", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#991b1b", whiteSpace: "nowrap" }}>
              🔔 {activeAlerts.length} {t.alerts}
            </button>
          )}

          {/* Notification Bell */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowNotif(!showNotif)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: "4px 8px", position: "relative", color: "#374151" }}>
              🔔
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: 0, right: 0, background: "#ef4444", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotif && (
              <div style={{ position: "absolute", top: 44, right: 0, background: "white", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", width: 360, maxHeight: 480, overflowY: "auto", zIndex: 500, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>🔔 {t.notifications}</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#6366f1", fontWeight: 600 }}>{t.markAllRead}</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 32, color: "#94a3b8", fontSize: 14 }}>🔕 {t.noNotifications}</div>
                ) : (
                  notifications.slice(0, 20).map(n => (
                    <div key={n.id} onClick={() => { handleMarkRead(n.id); const dest = getNotifDestPage(n, user.role); if (dest) { setPage(dest); setShowNotif(false); } }}
                      style={{ padding: "12px 16px", borderBottom: "1px solid #f8fafc", background: n.read ? "white" : "#f0f4ff", cursor: "pointer", borderLeft: `3px solid ${n.read ? "transparent" : "#6366f1"}` }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{NOTIF_ICONS[n.type] || "🔔"}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: n.read ? 400 : 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>
                            {getNotifText(n, lang)}
                          </div>
                          {n.data?.destination && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>📍 {n.data.destination}</div>}
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(n.createdAt)}</div>
                        </div>
                        {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", flexShrink: 0, marginTop: 4 }} />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Role badge */}
          <div style={{ fontSize: 13, fontWeight: 700, color: "white", padding: "6px 14px", borderRadius: 20, background: RA[user.role] || "#2471A3", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
            {RI[user.role]} {ROLE_LABELS[user.role] || user.role}
            {user.dc && user.dc !== "Head Office" && (
              <span style={{ fontSize: 14, fontWeight: 700 }}>— {user.dc}</span>
            )}
          </div>
        </header>

        {showNotif && <div onClick={() => setShowNotif(false)} style={{ position: "fixed", inset: 0, zIndex: 499 }} />}

        {/* CHANGE PASSWORD MODAL */}
        {showChangePw && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "white", borderRadius: 12, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a", marginBottom: 4 }}>🔑 Change Password</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>{user.name} — {user.email}</div>
              {pwDone ? (
                <div style={{ background: "#d1fae5", color: "#065f46", borderRadius: 8, padding: "14px 16px", fontSize: 14, fontWeight: 600, textAlign: "center" }}>{pwDone}</div>
              ) : (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Current Password *</label>
                    <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password"
                      style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "11px 14px", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>New Password *</label>
                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 6 characters"
                      style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "11px 14px", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Confirm New Password *</label>
                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password"
                      style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "11px 14px", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  {pwErr && <div style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>⚠️ {pwErr}</div>}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={changePassword} disabled={pwLoading}
                      style={{ flex: 1, background: "#1A3A5C", color: "white", border: "none", padding: "12px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14, opacity: pwLoading ? 0.6 : 1 }}>
                      {pwLoading ? "Changing..." : "✅ Change Password"}
                    </button>
                    <button onClick={() => { setShowChangePw(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setPwErr(""); }}
                      style={{ background: "#f1f5f9", border: "none", padding: "12px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14, color: "#64748b" }}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <main style={{ flex: 1, padding: "20px", overflowY: "auto", maxWidth: 1400, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          {children}
        </main>
      </div>

      {/* AI CHATBOT WIDGET — visible to all logged-in users */}
      <ChatbotWidget user={user} lang={lang} t={t} />
    </div>
  );
}
