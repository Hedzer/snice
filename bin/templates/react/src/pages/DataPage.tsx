import { useState, useEffect, useCallback } from 'react';
import { Spinner, EmptyState } from 'snice/react';
import { SearchBar } from '../components/SearchBar';

interface DataItem {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'pending' | 'archived';
  createdAt: string;
}

const MOCK_ITEMS: DataItem[] = [
  { id: '1', title: 'API Integration', description: 'Connect external payment gateway', status: 'active', createdAt: '2025-01-15' },
  { id: '2', title: 'User Analytics', description: 'Implement tracking dashboard', status: 'pending', createdAt: '2025-01-20' },
  { id: '3', title: 'Email Templates', description: 'Design transactional email set', status: 'active', createdAt: '2025-02-01' },
  { id: '4', title: 'Legacy Migration', description: 'Migrate v1 database schema', status: 'archived', createdAt: '2024-12-10' },
  { id: '5', title: 'Mobile App', description: 'React Native companion app', status: 'pending', createdAt: '2025-02-15' },
  { id: '6', title: 'CI/CD Pipeline', description: 'GitHub Actions deployment workflow', status: 'active', createdAt: '2025-01-05' },
  { id: '7', title: 'Documentation', description: 'API reference and developer guides', status: 'active', createdAt: '2025-02-10' },
  { id: '8', title: 'Performance Audit', description: 'Lighthouse and Core Web Vitals', status: 'archived', createdAt: '2024-11-20' },
];

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'var(--snice-color-success)',
    pending: 'var(--snice-color-warning)',
    archived: 'var(--snice-color-text-secondary)'
  };
  return colors[status] || 'var(--snice-color-text-secondary)';
}

export function DataPage() {
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState<DataItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'archived'>('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setAllItems([...MOCK_ITEMS]);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredItems = allItems.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <div className="page-container-medium">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: 'var(--snice-color-primary)' }}>Data</h1>
        <span style={{ fontSize: '0.875rem', color: 'var(--snice-color-text-secondary)' }}>
          {filteredItems.length} items
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <SearchBar placeholder="Search items..." onSearch={handleSearch} />

        <div className="filters" style={{ display: 'flex', gap: '0.5rem' }}>
          {(['all', 'active', 'pending', 'archived'] as const).map(status => (
            <button
              key={status}
              className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner />
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon="&#128269;"
          title="No results"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="data-table">
          <div className="table-header">
            <span className="col-title">Title</span>
            <span className="col-status">Status</span>
            <span className="col-date">Created</span>
          </div>
          {filteredItems.map(item => (
            <div className="table-row" key={item.id}>
              <div className="col-title">
                <strong>{item.title}</strong>
                <span className="description">{item.description}</span>
              </div>
              <div className="col-status">
                <span className="status-dot" style={{ background: getStatusColor(item.status) }} />
                {item.status}
              </div>
              <div className="col-date">{item.createdAt}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
