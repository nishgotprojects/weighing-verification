import { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockAuditLogs } from '@/services/mockServices';
import { AuditLog } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { BookOpen, Search } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { setLogs(mockAuditLogs); }, []);

  const filtered = logs.filter(l => !search || l.action.toLowerCase().includes(search.toLowerCase()) || l.performedBy.toLowerCase().includes(search.toLowerCase()));

  const actionColor = (action: string) => {
    if (action.includes('APPROVED')) return 'var(--success)';
    if (action.includes('REJECTED')) return 'var(--error)';
    if (action.includes('CREATED')) return 'var(--blue)';
    return 'var(--text-muted)';
  };

  return (
    <Shell title="Audit Logs">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Complete system activity trail</p>
        </div>
      </div>
      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 34, maxWidth: 400 }} placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <table className="data-table">
          <thead><tr><th>Action</th><th>Performed By</th><th>Target</th><th>Details</th><th>Timestamp</th><th>IP</th></tr></thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id}>
                <td><span style={{ fontWeight: 600, color: actionColor(log.action), fontSize: '0.8125rem', fontFamily: 'monospace' }}>{log.action}</span></td>
                <td style={{ fontSize: '0.8125rem' }}>{log.performedBy}</td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.targetType}/{log.targetId.slice(0, 8)}...</td>
                <td style={{ fontSize: '0.8125rem' }}>{log.details}</td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTime(log.timestamp)}</td>
                <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="alert alert-info" style={{ marginTop: '1rem' }}>
          <BookOpen size={16} />
          <span>Audit logs are currently using mock data. In production, all actions will be automatically logged to Firestore.</span>
        </div>
      </div>
    </Shell>
  );
}
