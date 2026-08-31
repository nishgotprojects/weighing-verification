import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/context/AuthContext";
import { getApplicationsByOwner } from "@/services/applicationService";
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  checkAndCreateExpiryNotifications,
} from "@/services/notificationService";
import { Notification } from "@/types";
import { formatRelative } from "@/lib/utils";
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";
import { toast, Toaster } from "sonner";

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; bg: string; border: string; color: string }> = {
  critical: { icon: <XCircle size={18} />, bg: "#fef2f2", border: "#fca5a5", color: "#dc2626" },
  error:    { icon: <AlertTriangle size={18} />, bg: "#fef2f2", border: "#fca5a5", color: "#dc2626" },
  warning:  { icon: <Clock size={18} />, bg: "#fffbeb", border: "#fcd34d", color: "#d97706" },
  success:  { icon: <CheckCircle size={18} />, bg: "#f0fdf4", border: "#86efac", color: "#16a34a" },
  info:     { icon: <Info size={18} />, bg: "#eff6ff", border: "#93c5fd", color: "#2563eb" },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let resolved = false;

    // Timeout fallback: if Firestore doesn't respond in 8s, stop spinner
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setLoading(false);
      }
    }, 8000);

    // Real-time subscription — error handler in service ensures callback always fires
    const unsub = subscribeToNotifications(user.uid, (notifs) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        setLoading(false);
      }
      setNotifications(notifs);
    });

    // Run expiry check in background — non-blocking
    const runExpiryCheck = async () => {
      setChecking(true);
      try {
        const apps = await getApplicationsByOwner(user.uid);
        await checkAndCreateExpiryNotifications(user.uid, apps);
      } catch (e) {
        console.error("Expiry check failed:", e);
      } finally {
        setChecking(false);
      }
    };
    runExpiryCheck();

    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, [user]);

  const handleMarkRead = async (n: Notification) => {
    if (!n.read) await markNotificationRead(n.id);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.uid);
    toast.success("All notifications marked as read.");
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayed = filter === "unread" ? notifications.filter(n => !n.read) : notifications;

  return (
    <Shell title="Notifications">
      <Toaster richColors position="top-right" />

      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            Real-time alerts for certificate expiry and application updates
            {checking && (
              <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                · Checking expiry...
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAllRead}>
            <CheckCheck size={16} /> Mark All Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="tabs" style={{ marginBottom: "1rem" }}>
        <button className={`tab-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          All ({notifications.length})
        </button>
        <button className={`tab-btn ${filter === "unread" ? "active" : ""}`} onClick={() => setFilter("unread")}>
          Unread{" "}
          {unreadCount > 0 && (
            <span style={{
              marginLeft: 4, background: "var(--blue)", color: "white",
              borderRadius: 9999, padding: "1px 6px",
              fontSize: "0.6875rem", fontWeight: 700,
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem", gap: "1rem" }}>
            <div className="spinner" />
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading notifications...</div>
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} className="empty-state-icon" />
            <div className="empty-state-title">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </div>
            <div className="empty-state-desc">
              {filter === "unread"
                ? "You are all caught up!"
                : "Notifications about certificate expiry, application updates, and more will appear here."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {displayed.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
              return (
                <div
                  key={n.id}
                  onClick={() => handleMarkRead(n)}
                  style={{
                    display: "flex",
                    gap: "0.875rem",
                    padding: "1rem",
                    borderBottom: i < displayed.length - 1 ? "1px solid var(--border)" : "none",
                    cursor: n.link ? "pointer" : "default",
                    background: n.read ? "white" : "#f8fafc",
                    transition: "background 0.15s",
                  }}
                  onMouseOver={e => { if (n.link) (e.currentTarget as HTMLDivElement).style.background = "#f1f5f9"; }}
                  onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = n.read ? "white" : "#f8fafc"; }}
                >
                  {/* Unread dot */}
                  <div style={{ paddingTop: 6, flexShrink: 0 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: n.read ? "transparent" : cfg.color,
                      border: n.read ? "2px solid #e2e8f0" : "none",
                    }} />
                  </div>

                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: "0.5rem",
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: cfg.color, flexShrink: 0,
                  }}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                      <div style={{ fontWeight: n.read ? 400 : 600, fontSize: "0.875rem" }}>{n.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {formatRelative(n.createdAt)}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: 2 }}>{n.message}</div>
                    {n.link && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "var(--blue)", marginTop: "0.375rem", fontWeight: 500 }}>
                        View details <ArrowRight size={12} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="alert alert-info" style={{ marginTop: "1rem" }}>
        <Info size={16} />
        <span>
          Expiry notifications are automatically generated at <strong>30, 15, and 7 days</strong> before
          certificate expiry, and when a certificate has <strong>expired</strong>.
        </span>
      </div>
    </Shell>
  );
}