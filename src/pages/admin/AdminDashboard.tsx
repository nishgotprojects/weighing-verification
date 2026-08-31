import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { getAllApplications } from '@/services/applicationService';
import { Application } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, FileText, CheckCircle, AlertTriangle, Clock, TrendingUp, BarChart3 } from 'lucide-react';

const COLORS = ['#d97706', '#16a34a', '#dc2626', '#be185d'];

export default function AdminDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllApplications().then(apps => { setApplications(apps); setLoading(false); });
  }, []);

  const total = applications.length;
  const pending = applications.filter(a => a.status === 'pending').length;
  const approved = applications.filter(a => a.status === 'approved').length;
  const rejected = applications.filter(a => a.status === 'rejected').length;
  const flagged = applications.filter(a => a.aiFlagged).length;

  const pieData = [
    { name: 'Pending', value: pending },
    { name: 'Approved', value: approved },
    { name: 'Rejected', value: rejected },
    { name: 'AI Flagged', value: flagged },
  ].filter(d => d.value > 0);

  // Group by month for bar chart
  const monthMap: Record<string, number> = {};
  applications.forEach(a => {
    if (!a.submittedAt) return;
    const month = a.submittedAt.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthMap[month] = (monthMap[month] || 0) + 1;
  });
  const barData = Object.entries(monthMap).map(([month, count]) => ({ month, count })).slice(-6);

  // Instrument type breakdown
  const typeMap: Record<string, number> = {};
  applications.forEach(a => { typeMap[a.instrumentType || 'Other'] = (typeMap[a.instrumentType || 'Other'] || 0) + 1; });
  const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  return (
    <Shell title="Admin Dashboard">
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #264f82)', borderRadius: '0.75rem', padding: '1.25rem 1.75rem', marginBottom: '1.5rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>Platform Administration</div>
          <div style={{ opacity: 0.7, fontSize: '0.875rem' }}>Legal Metrology — Online Verification System</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin/reports" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
            <BarChart3 size={16} /> Reports
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Applications', count: total, icon: <FileText size={22} color="#2563eb" />, bg: '#dbeafe' },
          { label: 'Pending Review', count: pending, icon: <Clock size={22} color="#d97706" />, bg: '#fef3c7' },
          { label: 'Approved', count: approved, icon: <CheckCircle size={22} color="#16a34a" />, bg: '#dcfce7' },
          { label: 'Rejected', count: rejected, icon: <FileText size={22} color="#dc2626" />, bg: '#fee2e2' },
          { label: 'AI Flagged', count: flagged, icon: <AlertTriangle size={22} color="#be185d" />, bg: '#fce7f3' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{s.label}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{loading ? '—' : s.count}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Applications over time */}
        <div className="card">
          <div className="card-header"><h3 style={{ fontWeight: 600 }}>Applications Over Time</h3></div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '3rem' }}><TrendingUp size={32} className="empty-state-icon" /><div className="empty-state-desc">No data yet</div></div>
          )}
        </div>

        {/* Status distribution */}
        <div className="card">
          <div className="card-header"><h3 style={{ fontWeight: 600 }}>Status Distribution</h3></div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '3rem' }}><div className="empty-state-desc">No data yet</div></div>
          )}
        </div>
      </div>

      {/* Instrument Types */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ fontWeight: 600 }}>Applications by Instrument Type</h3>
          <Link to="/admin/applications" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        {typeData.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}><div className="empty-state-desc">No data yet</div></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {typeData.map(t => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 160, fontSize: '0.875rem', color: 'var(--text)' }}>{t.name}</div>
                <div style={{ flex: 1 }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${total > 0 ? (t.value / total) * 100 : 0}%` }} />
                  </div>
                </div>
                <div style={{ width: 40, textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>{t.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
