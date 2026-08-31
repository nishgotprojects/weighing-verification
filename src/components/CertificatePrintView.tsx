import { useRef } from "react";
import { Application } from "@/types";
import { formatDate, generateCertificateUrl } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Loader2, Printer, Download } from "lucide-react";
import { useState } from "react";

interface CertificatePrintViewProps {
  app: Application;
}

export function CertificatePrintView({ app }: CertificatePrintViewProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  const expiry = app.submittedAt
    ? new Date(app.submittedAt.getFullYear() + 1, app.submittedAt.getMonth(), app.submittedAt.getDate())
    : null;
  const isExpired = expiry ? expiry < new Date() : false;
  const certUrl = generateCertificateUrl(app.id);
  const certId = `LM-${app.id.slice(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    setPrinting(true);
    const printContent = certRef.current;
    if (!printContent) { setPrinting(false); return; }
    const printWin = window.open("", "_blank", "width=900,height=700");
    if (!printWin) { setPrinting(false); return; }
    printWin.document.write(`
      <html><head><title>Certificate - ${app.instrumentName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
        @media print { @page { size: A4; margin: 15mm; } }
      </style></head>
      <body>${printContent.innerHTML}</body></html>
    `);
    printWin.document.close();
    printWin.onload = () => { printWin.print(); printWin.close(); setPrinting(false); };
  };

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`Certificate_${certId}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      {/* Action buttons */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <button className="btn btn-secondary btn-sm" onClick={handlePrint} disabled={printing}>
          {printing ? <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> : <Printer size={14} />}
          Print
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleDownloadPDF} disabled={downloading}>
          {downloading ? <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> : <Download size={14} />}
          Download PDF
        </button>
      </div>

      {/* Certificate (hidden off-screen, captured for PDF/print) */}
      <div ref={certRef} style={{
        width: 794,
        minHeight: 500,
        background: "white",
        fontFamily: "'Inter', sans-serif",
        border: "2px solid #1e3a5f",
        borderRadius: 8,
        overflow: "hidden",
        position: "absolute",
        left: -9999,
        top: 0,
      }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1e3a5f, #264f82)", padding: "24px 32px", color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.7, marginBottom: 4 }}>GOVERNMENT OF INDIA</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>Legal Metrology Department</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Ministry of Consumer Affairs, Food & Public Distribution</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 2 }}>CERTIFICATE ID</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>{certId}</div>
            </div>
          </div>
        </div>

        {/* Title banner */}
        <div style={{ background: isExpired ? "#fee2e2" : "#dcfce7", padding: "12px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: isExpired ? "#7f1d1d" : "#14532d", letterSpacing: 1 }}>
            {isExpired ? "? CERTIFICATE EXPIRED � RE-VERIFICATION REQUIRED" : "? VERIFICATION CERTIFICATE � LEGALLY COMPLIANT"}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 32px" }}>
          <div style={{ display: "flex", gap: 32 }}>
            {/* Left: Details */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, marginBottom: 12 }}>
                INSTRUMENT DETAILS
              </div>
              {[
                ["Instrument Name", app.instrumentName],
                ["Instrument Type", app.instrumentType || "�"],
                ["Serial Number", app.serialNumber],
                ["Owner / Business", app.ownerEmail],
                ["Location", app.location || "�"],
                ["Authorized Officer", app.reviewedBy || app.assignedOfficerName || "Legal Metrology Officer"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "8px 0" }}>
                  <div style={{ width: 160, fontSize: 11, color: "#64748b", fontWeight: 500 }}>{label}</div>
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#0f172a", fontFamily: label === "Serial Number" ? "monospace" : "inherit" }}>{value}</div>
                </div>
              ))}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                <div style={{ background: "#f0fdf4", borderRadius: 6, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>VERIFICATION DATE</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#14532d" }}>{formatDate(app.submittedAt)}</div>
                </div>
                <div style={{ background: isExpired ? "#fef2f2" : "#eff6ff", borderRadius: 6, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>VALID UNTIL</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isExpired ? "#dc2626" : "#2563eb" }}>{formatDate(expiry)}</div>
                </div>
              </div>
            </div>

            {/* Right: QR */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "white" }}>
                <QRCodeSVG value={certUrl} size={120} />
              </div>
              <div style={{ fontSize: 9, color: "#64748b", textAlign: "center", maxWidth: 140, wordBreak: "break-all" }}>
                Scan to verify authenticity
              </div>
              <div style={{
                padding: "4px 12px", borderRadius: 9999, fontSize: 10, fontWeight: 700,
                background: isExpired ? "#fee2e2" : "#dcfce7",
                color: isExpired ? "#7f1d1d" : "#14532d",
              }}>
                {isExpired ? "EXPIRED" : "VALID"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#f8fafc", padding: "14px 32px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 9, color: "#94a3b8" }}>
            Legal Metrology Act, 2009 � Legal Metrology (General) Rules, 2011 � Government of India
          </div>
          <div style={{ fontSize: 9, color: "#94a3b8" }}>
            Verify at: {certUrl}
          </div>
        </div>
      </div>
    </div>
  );
}
