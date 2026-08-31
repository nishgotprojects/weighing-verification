import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockListings } from '@/services/mockServices';
import { MarketplaceListing } from '@/types';
import { ShoppingBag, MapPin, CheckCircle, Search, Tag } from 'lucide-react';

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = mockListings.filter(l => {
    const s = search.toLowerCase();
    const match = !search || l.instrumentName.toLowerCase().includes(s) || l.location.toLowerCase().includes(s);
    return match && (filter === 'all' || (filter === 'verified' && l.isVerified) || l.condition === filter);
  });

  return (
    <Shell title="Marketplace">
      <div className="page-header">
        <div>
          <h1 className="page-title">Instrument Marketplace</h1>
          <p className="page-subtitle">Buy & sell verified weighing and measuring instruments</p>
        </div>
        <button className="btn btn-primary"><ShoppingBag size={16} /> List Your Instrument</button>
      </div>

      <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
        <ShoppingBag size={16} />
        <span>Marketplace feature uses mock data. Backend API integration coming soon.</span>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 34 }} placeholder="Search instruments, location..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', 'verified', 'new', 'good', 'fair'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {filtered.map(listing => (
          <div key={listing.id} className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)')}
            onMouseOut={e => (e.currentTarget.style.boxShadow = '')}>
            <div style={{ height: 120, background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={40} color="#94a3b8" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{listing.instrumentName}</div>
              {listing.isVerified && <span className="badge badge-approved"><CheckCircle size={10} /> Verified</span>}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{listing.instrumentType}</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span className="badge badge-gray"><Tag size={10} /> {listing.condition}</span>
              <span className="badge badge-gray"><MapPin size={10} /> {listing.location}</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.875rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{listing.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy)' }}>
                ₹{listing.price.toLocaleString('en-IN')}
              </div>
              <button className="btn btn-primary btn-sm">Contact Seller</button>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
