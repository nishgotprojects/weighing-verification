import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/context/AuthContext";
import { getApplicationsByOwner } from "@/services/applicationService";
import { Application } from "@/types";
import { formatDate, generateCertificateUrl } from "@/lib/utils";
import { Award, QrCode, ArrowRight, Printer, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { CertificatePrintView } from "@/components/CertificatePrintView";
import { toast, Toaster } from "sonner";

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCertId, setActiveCertId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getApplicationsByOwner(user.uid).then(apps => {
      setCerts(apps.filter(a => a.status === "approved"));
      setLoading(false);
    });
  }, [user]);

  return (
    <Shell title="My Certificates">
      <Toaster richColors position="top-right" />

      <div className="page-header">
        <div>
          <h1 className="page-title">Digital Certificates</h1>
          <p className="page-subtitle">Your verified instrument certificates with QR codes, print and PDF download</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><div className="spinner" /></div>
      ) : certs.length === 0 ? (
        <div className="empty-state">
          <Award size={48} className="empty-state-icon" />
          <div className="empty-state-title">No certificates yet</div>
          <div className="empty-state-desc">Certificates appear here once your applications are approved by an inspector.</div>
          <Link to="/owner/apply" className="btn btn-primary" style={{ marginTop: "1rem" }}>Apply for Verification</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem" }}>
          {certs.map(app => {
            const certUrl = generateCertificateUrl(app.id);
            const expiry = app.submittedAt
              ? new Date(app.submittedAt.getFullYear() + 1, app.submittedAt.getMonth(), app.submittedAt.getDate())
              : null;
            const isExpired = expiry ? expiry < new Date() : false;
            const daysLeft = expiry ? Math.floor((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

            return (
              <div key={app.id} className="card" style={{ position: "relative", overflow: "hidden" }}>
                {/* Certificate header */}
                <div style={{
                  background: "linear-gradient(135deg, var(--navy), #264f82)",
                  margin: "-1.25rem -1.25rem 1.25rem",
                  padding: "1.25rem",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "white", fontWeight: 700, marginBottom: 4 }}>
                      <Award size={18} /> Verified Instrument
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>
                      Ministry of Consumer Affairs � Legal Metrology
                    </div>
                  </div>
                  <span className={`badge ${isExpired ? "badge-rejected" : "badge-approved"}`}>
                    {isExpired ? "Expired" : "Valid"}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  {/* QR */}
                  <div style={{ padding: 8, background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "0.5rem", flexShrink: 0 }}>
                    <QRCodeSVG value={certUrl} size={90} />
                  </div>
                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>{app.instrumentName}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{app.instrumentType}</div>
                    <div style={{ fontSize: "0.8125rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <div><span style={{ color: "var(--text-muted)" }}>Serial: </span><span style={{ fontFamily: "monospace", fontWeight: 600 }}>{app.serialNumber}</span></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Issued: </span><span>{formatDate(app.submittedAt)}</span></div>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>Expires: </span>
                        <span style={{ color: isExpired ? "var(--error)" : (daysLeft !== null && daysLeft <= 30) ? "var(--warning)" : "var(--success)", fontWeight: 600 }}>
                          {formatDate(expiry)}
                          {!isExpired && daysLeft !== null && daysLeft <= 30 && ` (${daysLeft}d left)`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expiry warning */}
                {!isExpired && daysLeft !== null && daysLeft <= 30 && (
                  <div className="alert alert-warning" style={{ marginTop: "0.875rem", padding: "0.5rem 0.75rem", fontSize: "0.75rem" }}>
                    ? Certificate expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}. Apply for re-verification soon.
                  </div>
                )}
                {isExpired && (
                  <div className="alert alert-error" style={{ marginTop: "0.875rem", padding: "0.5rem 0.75rem", fontSize: "0.75rem" }}>
                    ?? Expired. Using an expired instrument is illegal under the Legal Metrology Act.
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                  <Link to={`/verify/${app.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                    <QrCode size={14} /> Verify
                  </Link>
                  <Link to={`/owner/applications/${app.id}`} className="btn btn-ghost btn-sm" style={{ justifyContent: "center" }}>
                    Details <ArrowRight size={14} />
                  </Link>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setActiveCertId(activeCertId === app.id ? null : app.id)}
                  >
                    <Printer size={14} /> Print / PDF
                  </button>
                </div>

                {/* Inline PDF/Print panel */}
                {activeCertId === app.id && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                    <CertificatePrintView app={app} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
