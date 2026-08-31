import { useEffect, useState, useRef } from "react";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/context/AuthContext";
import { getOfficers, updateOfficerWorkload } from "@/services/officerService";
import { getAllApplications, assignOfficerToApplication } from "@/services/applicationService";
import { Officer, Application } from "@/types";
import { formatDate } from "@/lib/utils";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Map, User, CheckCircle, Clock, Search, Calendar,
  RefreshCw, AlertTriangle, ChevronRight, X, Loader2,
} from "lucide-react";
import { toast, Toaster } from "sonner";

// Fix leaflet marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const availableIcon = L.divIcon({
  className: "",
  html: `<div style="width:24px;height:24px;border-radius:50%;background:#16a34a;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;color:white;font-weight:700;">?</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const busyIcon = L.divIcon({
  className: "",
  html: `<div style="width:24px;height:24px;border-radius:50%;background:#d97706;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;color:white;font-weight:700;">!</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const appIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:4px;background:#2563eb;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface AssignModalData {
  application: Application;
  officer: Officer;
}

export default function OfficerAllocationPage() {
  const { user } = useAuth();
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [availFilter, setAvailFilter] = useState<"all" | "available" | "busy">("all");
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [assignModal, setAssignModal] = useState<AssignModalData | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    Promise.all([getOfficers(), getAllApplications()])
      .then(([offs, apps]) => {
        setOfficers(offs);
        setApplications(apps);
      })
      .catch(e => console.error('OfficerAllocationPage load error:', e))
      .finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setLoading(true);
    const [offs, apps] = await Promise.all([getOfficers(), getAllApplications()]);
    setOfficers(offs);
    setApplications(apps);
    setLoading(false);
  };

  const pendingApps = applications.filter(a => a.status === "pending" || a.status === "assigned");

  const filteredOfficers = officers.filter(o => {
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.district.toLowerCase().includes(search.toLowerCase()) ||
      (o.role ?? "").toLowerCase().includes(search.toLowerCase());
    const matchAvail = availFilter === "all" || o.status === availFilter;
    return matchSearch && matchAvail;
  });

  const handleAssign = async () => {
    if (!assignModal || !user || !scheduledDate) {
      toast.error("Please select a verification date.");
      return;
    }
    setAssigning(true);
    try {
      await assignOfficerToApplication(
        assignModal.application.id,
        assignModal.officer.id,
        assignModal.officer.name,
        scheduledDate,
        user.email
      );
      await updateOfficerWorkload(assignModal.officer.id, 1);
      toast.success(`? ${assignModal.officer.name} assigned to ${assignModal.application.instrumentName}`);
      setAssignModal(null);
      setScheduledDate("");
      await refresh();
    } catch (err) {
      toast.error("Assignment failed. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  const mapCenter: [number, number] = [10.8505, 76.2711]; // Tamil Nadu center

  return (
    <Shell title="Officer Allocation">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">GIS Officer Allocation & Scheduling</h1>
          <p className="page-subtitle">Assign Legal Metrology Officers to verification applications</p>
        </div>
        <button className="btn btn-secondary" onClick={refresh} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total Officers", value: officers.length, color: "#2563eb", bg: "#dbeafe" },
          { label: "Available", value: officers.filter(o => o.status === "available").length, color: "#16a34a", bg: "#dcfce7" },
          { label: "Busy", value: officers.filter(o => o.status === "busy").length, color: "#d97706", bg: "#fef3c7" },
          { label: "Pending Apps", value: pendingApps.length, color: "#dc2626", bg: "#fee2e2" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, width: 40, height: 40 }}>
              <User size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.label}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{loading ? "�" : s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "1.25rem", alignItems: "start" }}>
        {/* LEFT: Officer list */}
        <div className="card" style={{ maxHeight: 640, display: "flex", flexDirection: "column" }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <User size={18} /> Officers
            </h3>
            <div style={{ display: "flex", gap: 6 }}>
              {(["all", "available", "busy"] as const).map(f => (
                <button
                  key={f}
                  className={`btn btn-sm ${availFilter === f ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setAvailFilter(f)}
                  style={{ padding: "0.25rem 0.625rem", fontSize: "0.75rem" }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: "0.75rem" }}>
            <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32, fontSize: "0.8125rem" }}
              placeholder="Search officer, district, role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><div className="spinner" /></div>
            ) : filteredOfficers.length === 0 ? (
              <div className="empty-state" style={{ padding: "2rem" }}>
                <User size={32} className="empty-state-icon" />
                <div className="empty-state-desc">No officers match your filter.</div>
              </div>
            ) : filteredOfficers.map(officer => (
              <div
                key={officer.id}
                onClick={() => setSelectedOfficer(selectedOfficer?.id === officer.id ? null : officer)}
                style={{
                  padding: "0.875rem",
                  borderRadius: "0.625rem",
                  border: `1px solid ${selectedOfficer?.id === officer.id ? "var(--blue)" : "var(--border)"}`,
                  background: selectedOfficer?.id === officer.id ? "#eff6ff" : "white",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{officer.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{officer.role ?? "Legal Metrology Officer"}</div>
                  </div>
                  <span className={`badge ${officer.status === "available" ? "badge-approved" : "badge-pending"}`}>
                    {officer.status === "available" ? <CheckCircle size={10} /> : <Clock size={10} />}
                    {" "}{officer.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  ?? {officer.district} � {officer.activeApplications} active cases
                </div>
                {/* Workload bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{
                      width: `${Math.min(officer.workload ?? 0, 100)}%`,
                      background: (officer.workload ?? 0) > 70 ? "var(--error)" : (officer.workload ?? 0) > 40 ? "var(--warning)" : "var(--success)",
                    }} />
                  </div>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", minWidth: 28 }}>
                    {officer.workload ?? 0}%
                  </span>
                </div>

                {/* Expanded: assign application */}
                {selectedOfficer?.id === officer.id && officer.status === "available" && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      SELECT APPLICATION TO ASSIGN
                    </div>
                    {pendingApps.length === 0 ? (
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>No pending applications.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", maxHeight: 160, overflowY: "auto" }}>
                        {pendingApps.map(app => (
                          <button
                            key={app.id}
                            onClick={e => { e.stopPropagation(); setAssignModal({ application: app, officer }); setScheduledDate(""); }}
                            className="btn btn-secondary btn-sm"
                            style={{ justifyContent: "space-between", textAlign: "left" }}
                          >
                            <span>{app.instrumentName} � {app.serialNumber}</span>
                            <ChevronRight size={14} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {selectedOfficer?.id === officer.id && officer.status === "busy" && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <div className="alert alert-warning" style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem" }}>
                      <Clock size={12} /> Officer is currently busy. Wait for workload to clear.
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Map */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <Map size={18} /> Officer Location Map � Tamil Nadu
            </h3>
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} /> Available
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#d97706", display: "inline-block" }} /> Busy
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: "#2563eb", display: "inline-block" }} /> Applications
              </span>
            </div>
          </div>
          <div style={{ height: 540 }}>
            <MapContainer center={mapCenter} zoom={7} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='� <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {officers.map(officer => (
                <Marker
                  key={officer.id}
                  position={[officer.lat, officer.lng]}
                  icon={officer.status === "available" ? availableIcon : busyIcon}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: 4 }}>{officer.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: 4 }}>{officer.role}</div>
                      <div style={{ fontSize: "0.75rem", marginBottom: 4 }}>?? {officer.district}</div>
                      <div style={{ fontSize: "0.75rem", marginBottom: 4 }}>?? {officer.activeApplications} active cases</div>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px",
                        borderRadius: 9999, fontSize: "0.6875rem", fontWeight: 600,
                        background: officer.status === "available" ? "#dcfce7" : "#fef3c7",
                        color: officer.status === "available" ? "#14532d" : "#78350f",
                      }}>
                        {officer.status === "available" ? "? Available" : "? Busy"}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Pending Applications Table */}
      <div className="card" style={{ marginTop: "1.25rem" }}>
        <div className="card-header">
          <h3 style={{ fontWeight: 600 }}>Pending Applications � Awaiting Assignment</h3>
        </div>
        {pendingApps.length === 0 ? (
          <div className="empty-state" style={{ padding: "2rem" }}>
            <CheckCircle size={36} className="empty-state-icon" />
            <div className="empty-state-desc">All applications have been assigned.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Instrument</th><th>Owner</th><th>Location</th><th>AI Check</th><th>Submitted</th><th>Assignment</th><th>Action</th></tr></thead>
            <tbody>
              {pendingApps.map(app => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{app.instrumentName}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{app.instrumentType}</div>
                  </td>
                  <td style={{ fontSize: "0.8125rem" }}>{app.ownerEmail}</td>
                  <td style={{ fontSize: "0.8125rem" }}>{app.location || "�"}</td>
                  <td>{app.aiFlagged ? <span className="badge badge-flagged">? Flagged</span> : <span className="badge badge-approved">? Clear</span>}</td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{formatDate(app.submittedAt)}</td>
                  <td style={{ fontSize: "0.8125rem" }}>
                    {app.assignedOfficerName ? (
                      <div>
                        <div style={{ fontWeight: 500, color: "var(--success)" }}>? {app.assignedOfficerName}</div>
                        <div style={{ color: "var(--text-muted)" }}>{app.assignedDate}</div>
                      </div>
                    ) : (
                      <span className="badge badge-pending">Unassigned</span>
                    )}
                  </td>
                  <td>
                    {!app.assignedOfficerName && officers.filter(o => o.status === "available").length > 0 && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          const available = officers.filter(o => o.status === "available");
                          if (available.length > 0) { setSelectedOfficer(available[0]); setAssignModal({ application: app, officer: available[0] }); setScheduledDate(""); }
                        }}
                      >
                        Assign Officer
                      </button>
                    )}
                    {app.assignedOfficerName && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Scheduled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assignment Modal */}
      {assignModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div style={{ background: "white", borderRadius: "1rem", padding: "2rem", maxWidth: 480, width: "100%", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: "1.125rem", marginBottom: 4 }}>Assign Officer</h2>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Confirm the assignment and set verification date</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setAssignModal(null)}><X size={18} /></button>
            </div>

            <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ padding: "0.875rem", background: "#f0fdf4", borderRadius: "0.625rem", border: "1px solid #86efac" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>OFFICER</div>
                <div style={{ fontWeight: 600 }}>{assignModal.officer.name}</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{assignModal.officer.role} � {assignModal.officer.district}</div>
              </div>
              <div style={{ padding: "0.875rem", background: "#eff6ff", borderRadius: "0.625rem", border: "1px solid #93c5fd" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>APPLICATION</div>
                <div style={{ fontWeight: 600 }}>{assignModal.application.instrumentName}</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{assignModal.application.serialNumber}</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{assignModal.application.ownerEmail}</div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label"><Calendar size={14} style={{ display: "inline", marginRight: 6 }} />Scheduled Verification Date *</label>
              <input
                className="form-input"
                type="date"
                value={scheduledDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setScheduledDate(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setAssignModal(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ flex: 2, justifyContent: "center" }}
                onClick={handleAssign}
                disabled={assigning || !scheduledDate}
              >
                {assigning ? <><Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> Assigning...</> : "? Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
