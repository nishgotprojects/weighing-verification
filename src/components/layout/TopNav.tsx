import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { subscribeToNotifications } from '@/services/notificationService';

interface TopNavProps {
  title?: string;
}

export function TopNav({ title }: TopNavProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.uid, (notifs) => {
      setUnreadCount(notifs.filter(n => !n.read).length);
    });
    return unsub;
  }, [user]);

  return (
    <header className="app-topnav" style={{ gap: '1rem' }}>
      {/* Page title */}
      <div style={{ flex: 1 }}>
        {title && (
          <h1 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>{title}</h1>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Government label */}
        <div style={{ marginRight: '0.5rem', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1 }}>
            Ministry of Consumer Affairs
          </span>
          <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
            Legal Metrology Division
          </span>
        </div>

        {/* Notification bell with badge */}
        <button
          className="btn btn-ghost btn-sm"
          style={{ position: 'relative', padding: '0.5rem' }}
          onClick={() => navigate('/owner/notifications')}
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: 2, right: 2,
              background: '#dc2626',
              color: 'white',
              borderRadius: '9999px',
              fontSize: '0.625rem',
              fontWeight: 700,
              lineHeight: 1,
              padding: '2px 4px',
              minWidth: 16,
              textAlign: 'center',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--navy)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: 'white',
          cursor: 'pointer',
        }}>
          {user?.email?.[0]?.toUpperCase() ?? '?'}
        </div>
      </div>
    </header>
  );
}
