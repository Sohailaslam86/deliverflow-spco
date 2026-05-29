import { useState } from "react";
import { Card, CardTitle, Btn, OutlineBtn, EmptyState } from "../components/Shared.jsx";

export default function Download({ user, lang, invoices }) {
  const rtl = lang === "ar";
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const delivered = invoices.filter(inv => inv.status === "delivered");

  const filtered = delivered.filter(inv => {
    const matchDC = filter === "all" || inv.dc === filter;
    const matchSearch = !search ||
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer.toLowerCase().includes(search.toLowerCase());
    return matchDC && matchSearch;
  });

  function downloadCSV() {
    const headers = ["Invoice#", "Date", "Customer", "Institution", "DC", "Driver", "Vehicle", "Delivered Date", "Status"];
    const rows = filtered.map(inv => [
      inv.id, inv.date, inv.customer, inv.institution || "",
      inv.dc, inv.driver || "", inv.vehicle || "",
      inv.deliveredDate || inv.date, inv.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "DeliverFlow_PODs_" + new Date().toISOString().slice(0,10) + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const dcs = [...new Set(invoices.map(i => i.dc))];

  return (
    <div style={{ padding: 20, direction: rtl ? "rtl" : "ltr" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>
          {rtl ? "\u062a\u062d\u0645\u064a\u0644 PODs" : "Download PODs"}
        </h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
          {rtl ? "\u062a\u0635\u062f\u064a\u0631 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0633\u0644\u064a\u0645" : "Export delivery confirmation data"}
        </p>
      </div>

      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={rtl ? "\u0628\u062d\u062b \u0628\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u0623\u0648 \u0627\u0644\u0639\u0645\u064a\u0644" : "Search invoice # or customer..."}
            style={{ flex: 1, minWidth: 200, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none" }}
          />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 14, background: "white", outline: "none" }}
          >
            <option value="all">{rtl ? "\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0631\u0627\u0643\u0632" : "All DCs"}</option>
            {dcs.map(dc => <option key={dc} value={dc}>{dc}</option>)}
          </select>
          <Btn onClick={downloadCSV} color="#065f46">
            {rtl ? "\u062a\u062d\u0645\u064a\u0644 CSV" : "Download CSV"}
          </Btn>
        </div>

        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
          {filtered.length} {rtl ? "\u0641\u0627\u062a\u0648\u0631\u0629 \u0645\u0633\u0644\u0645\u0629" : "delivered invoices"}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="\ud83d\udce5" title={rtl ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a" : "No delivered invoices found"} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Invoice #", "Date", "Customer", "DC", "Driver", "Vehicle", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => (
                  <tr key={inv.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1A3A5C" }}>{inv.id}</td>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>{inv.date}</td>
                    <td style={{ padding: "10px 12px" }}>{inv.customer}</td>
                    <td style={{ padding: "10px 12px" }}>{inv.dc}</td>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>{inv.driver || "-"}</td>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>{inv.vehicle || "-"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: 99, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                        Delivered
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
