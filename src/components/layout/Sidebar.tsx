import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, FileText, CheckCircle, Users, ShieldCheck,
  AlertTriangle, BarChart3, ClipboardList, Scale, Award,
  Bell, ShoppingBag, ArrowRightLeft, MessageCircle, Map, BookOpen,
  LogOut,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  to: string;
}

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div>
      <div className="nav-section">{title}</div>
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const ownerNav: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, to: '/owner/dashboard' },
    { label: 'My Instruments', icon: <Scale size={18} />, to: '/owner/instruments' },
    { label: 'Apply for Verification', icon: <FileText size={18} />, to: '/owner/apply' },
    { label: 'My Applications', icon: <ClipboardList size={18} />, to: '/owner/applications' },
    { label: 'Certificates', icon: <Award size={18} />, to: '/owner/certificates' },
    { label: 'Notifications', icon: <Bell size={18} />, to: '/owner/notifications' },
  ];

  const ownerExtNav: NavItem[] = [
    { label: 'Marketplace', icon: <ShoppingBag size={18} />, to: '/owner/marketplace' },
    { label: 'Ownership Transfer', icon: <ArrowRightLeft size={18} />, to: '/owner/transfer' },
    { label: 'LM Chatbot', icon: <MessageCircle size={18} />, to: '/chatbot' },
  ];

  const inspectorNav: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, to: '/inspector/dashboard' },
    { label: 'Pending Applications', icon: <ClipboardList size={18} />, to: '/inspector/applications' },
  ];

  const adminNav: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, to: '/admin/dashboard' },
    { label: 'All Applications', icon: <FileText size={18} />, to: '/admin/applications' },
    { label: 'Users', icon: <Users size={18} />, to: '/admin/users' },
    { label: 'Officer Allocation', icon: <Map size={18} />, to: '/admin/officer-allocation' },
    { label: 'AI Alerts', icon: <AlertTriangle size={18} />, to: '/admin/ai-alerts' },
    { label: 'Reports', icon: <BarChart3 size={18} />, to: '/admin/reports' },
    { label: 'Audit Logs', icon: <BookOpen size={18} />, to: '/admin/audit-logs' },
  ];

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, #2563eb, #0d9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={20} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>
              LM Verify
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.6875rem' }}>
              Legal Metrology
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
        {user?.role === 'owner' && (
          <>
            <NavGroup title="Main" items={ownerNav} />
            <NavGroup title="Extended Features" items={ownerExtNav} />
          </>
        )}
        {user?.role === 'inspector' && (
          <NavGroup title="Inspector" items={inspectorNav} />
        )}
        {user?.role === 'admin' && (
          <NavGroup title="Administration" items={adminNav} />
        )}
      </div>

      {/* User info + logout */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, color: 'white',
          }}>
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'white', fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName || user?.email}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6875rem', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
