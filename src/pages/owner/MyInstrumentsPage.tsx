import { Shell } from '@/components/layout/Shell';
import { Scale, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyInstrumentsPage() {
  return (
    <Shell title="My Instruments">
      <div className="page-header">
        <div><h1 className="page-title">My Instruments</h1><p className="page-subtitle">Registered instruments portfolio</p></div>
        <Link to="/owner/apply" className="btn btn-primary"><Plus size={16} /> Register Instrument</Link>
      </div>
      <div className="card">
        <div className="empty-state">
          <Scale size={48} className="empty-state-icon" />
          <div className="empty-state-title">No instruments registered yet</div>
          <div className="empty-state-desc">Your registered instruments will appear here after your first application is submitted and approved.</div>
          <Link to="/owner/apply" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            <Plus size={16} /> Apply for Verification
          </Link>
        </div>
      </div>
    </Shell>
  );
}
