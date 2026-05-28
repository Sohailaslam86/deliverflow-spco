// src/pages/Invoices.jsx
import { useState } from "react";
import { Card, Badge, AgingBadge } from "../components/Shared.jsx";
import { STATUS_STYLES } from "../data/masterData.js"; // Correct import path here

const translations = {
  en: {
    searchPlaceholder: "Search by Invoice # or Customer...",
    allStatus: "All Statuses",
    pending: "Pending",
    assigned: "Assigned",
    transit: "In Transit",
    delivered: "Delivered",
    outstanding: "Outstanding",
    failed: "Failed",
    invoiceNo: "Invoice #",
    customer: "Customer",
    institution: "Institution",
    dcLocation: "DC Location",
    statusLabel: "Status",
    noInvoices: "No invoices found matching your criteria.",
    changeStatusAdmin: "Change Status (Admin):",
    dateAdded: "Date Added"
  },
  ar: {
    searchPlaceholder: "البحث برقم الفاتورة أو العميل...",
    allStatus: "جميع الحالات",
    pending: "قيد الانتظار",
    assigned: "تم التعيين",
    transit: "في الطريق",
    delivered: "تم التسليم",
    outstanding: "معلقة",
    failed: "فاشلة",
    invoiceNo: "رقم الفاتورة",
    customer: "العميل",
    institution: "المنشأة / المستشفى",
    dcLocation: "مركز التوزيع",
    statusLabel: "الحالة",
    noInvoices: "لم يتم العثور على فواتير تطابق البحث.",
    changeStatusAdmin: "تغيير الحالة (مدير النظام):",
    dateAdded: "تاريخ الإضافة"
  }
};

export default function Invoices({ user, invoices, setInvoices, lang }) {
  const [search, setSearch]   = useState("");
  const [statusF, setStatusF] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const rtl = lang === "ar";
  const t = translations[lang] || translations.en;
  const dc = user.role === "manager" ? user.dc : null;

  const filtered = invoices.filter(i => {
    const mDC = !dc || i.dc === dc;
    const mS  = statusF === "all" || i.status === statusF;
    const mQ  = !search || i.id.toLowerCase().includes(search.toLowerCase()) || i.customer.toLowerCase().includes(search.toLowerCase());
    return mDC && mS && mQ;
  });

  const updateStatus = (id, newStatus) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
  };

  return (
    <div style={{ direction: rtl ? "rtl" : "ltr" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 14, marginTop: 6 }}>
        {rtl ? "إدارة الفواتير" : "Invoice Management"}
      </h2>
      
      <Card style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
        />
        <select
          value={statusF}
          onChange={e => setStatusF(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white", fontSize: 14 }}
        >
          <option value="all">{t.allStatus}</option>
          <option value="pending">{t.pending}</option>
          <option value="assigned">{t.assigned}</option>
          <option value="intransit">{t.transit}</option>
          <option value="delivered">{t.delivered}</option>
          <option value="outstanding">{t.outstanding}</option>
          <option value="failed">{t.failed}</option>
        </select>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(inv => (
          <Card key={inv.id} style={{ 
            borderRight: rtl ? `4px solid ${STATUS_STYLES[inv.status]?.c || "#64748b"}` : "none", 
            borderLeft: !rtl ? `4px solid ${STATUS_STYLES[inv.status]?.c || "#64748b"}` : "none" 
          }}>
            <div onClick={() => setExpanded(expanded === inv.id ? null : inv.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{t.invoiceNo}: {inv.id}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}><b>{t.customer}:</b> {inv.customer}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AgingBadge days={2} lang={lang} />
                <Badge status={inv.status} lang={lang} />
              </div>
            </div>

            {expanded === inv.id && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e2e8f0", fontSize: 13, color: "#334155" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8, marginBottom: 12 }}>
                  <div>🏢 <b>{t.institution}:</b> {inv.institution || "SPCO Hospital Center"}</div>
                  <div>📍 <b>{t.dcLocation}:</b> {inv.dc} DC</div>
                  <div>📅 <b>{t.dateAdded}:</b> {inv.date || "2026-05-28"}</div>
                </div>

                {user.role === "admin" && (
                  <div style={{ marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>{t.changeStatusAdmin}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {Object.entries(STATUS_STYLES).map(([k, v]) => (
                        <button
                          key={k}
                          onClick={() => updateStatus(inv.id, k)}
                          style={{
                            padding: "6px 12px", borderRadius: 6,
                            border: `1px solid ${v.c}`,
                            background: inv.status === k ? v.bg : "white",
                            color: v.c, cursor: "pointer", fontSize: 12, fontWeight: 600
                          }}
                        >
                          {v.icon} {rtl && v.lblAr ? v.lblAr : v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 14 }}>{t.noInvoices}</div>
        )}
      </div>
    </div>
  );
}
