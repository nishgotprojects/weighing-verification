import { useEffect, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { getAllApplications } from "@/services/applicationService";
import { Application } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart3, Download, TrendingUp, Printer, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast, Toaster } from "sonner";

export default function AdminReportsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getAllApplications().then(a => { setApps(a); setLoading(false); }); }, []);

  const total = apps.length;
  const approvalRate = total > 0 ? Math.round((apps.filter(a => a.status === "approved").length / total) * 100) : 0;
  const flagRate = total > 0 ? Math.round((apps.filter(a => a.aiFlagged).length / total) * 100) : 0;

  const typeData = Object.entries(
    apps.reduce((acc, a) => { acc[a.instrumentType || "Other"] = (acc[a.instrumentType || "Other"] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  const handleExportCSV = () => {
    if (apps.length === 0) { toast.error("No data to export."); return; }

    const headers = ["Application ID", "Instrument Name", "Instrument Type", "Serial Number", "Owner Email", "Location", "Status", "AI Flagged", "Submitted Date", "Reviewed By", "Assigned Officer"];
    const rows = apps.map(a => [
      a.id,
      `"${a.instrumentName}"`,
      `"${a.instrumentType}"`,
      a.serialNumber,
      a.ownerEmail,
      `"${a.location || ""}"`,
      a.status,
      a.aiFlagged ? "Yes" : "No",
      formatDate(a.submittedAt),
      a.reviewedBy || "",
      a.assignedOfficerName || "",
    ].join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `LM_Verification_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully!", { icon: <CheckCircle size={16} /> });
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <Shell title="Reports">
      <Toaster richColors position="top-right" />

      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Platform performance metrics and verification statistics</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-secondary" onClick={handlePrintReport}>
            <Printer size={16} /> Print Report
          </button>
          <button className="btn btn-primary" onClick={handleExportCSV} disabled={loading}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Applications", value: loading ? "�" : total.toString() },
          { label: "Approval Rate", value: loading ? "�" : `${approvalRate}%` },
          { label: "AI Flag Rate", value: loading ? "�" : `${flagRate}%` },
          { label: "Assigned", value: loading ? "�" : apps.filter(a => a.status === "assigned").length.toString() },
        ].map(k => (
          <div key={k.label} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--navy)" }}>{k.value}</div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={18} /> Applications by Instrument Type
          </h3>
        </div>
        {typeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={typeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state" style={{ padding: "3rem" }}>
            <TrendingUp size={32} className="empty-state-icon" />
            <div className="empty-state-desc">No data yet</div>
          </div>
        )}
      </div>

      {/* Data table preview */}
      {apps.length > 0 && (
        <div className="card" style={{ marginTop: "1.25rem" }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontWeight: 600 }}>Recent Applications (preview of export)</h3>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{apps.length} total records</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Owner</th>
                <th>Status</th>
                <th>AI Flagged</th>
                <th>Submitted</th>
                <th>Assigned Officer</th>
              </tr>
            </thead>
            <tbody>
              {apps.slice(0, 10).map(app => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{app.instrumentName}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{app.instrumentType}</div>
                  </td>
                  <td style={{ fontSize: "0.8125rem" }}>{app.ownerEmail}</td>
                  <td><span className={`badge badge-${app.status === "approved" ? "approved" : app.status === "rejected" ? "rejected" : app.status === "assigned" ? "blue" : "pending"}`}>{app.status}</span></td>
                  <td>{app.aiFlagged ? <span className="badge badge-flagged">? Yes</span> : <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>No</span>}</td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{formatDate(app.submittedAt)}</td>
                  <td style={{ fontSize: "0.8125rem" }}>{app.assignedOfficerName || <span style={{ color: "var(--text-muted)" }}>�</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {apps.length > 10 && (
            <div style={{ textAlign: "center", padding: "0.75rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Showing 10 of {apps.length} records. Export CSV for full data.
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}
