import { useState } from 'react';
import { Search, BarChart3, TrendingUp, Globe } from 'lucide-react';
import AdminSEO from './AdminSEO';
import AdminSEOAudit from './AdminSEOAudit';
import AdminSEOAnalytics from './AdminSEOAnalytics';
import AdminPSEO from './AdminPSEO';

const TABS = [
  { key: 'settings', label: 'SEO Settings', icon: Search },
  { key: 'audit', label: 'SEO Audit', icon: BarChart3 },
  { key: 'analytics', label: 'SEO Analytics', icon: TrendingUp },
  { key: 'pseo', label: 'Programmatic SEO', icon: Globe },
] as const;

const AdminSEOHub = () => {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('settings');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                active
                  ? 'bg-foreground text-background'
                  : 'bg-muted/60 hover:bg-muted text-foreground/80'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'settings' && <AdminSEO />}
      {tab === 'audit' && <AdminSEOAudit />}
      {tab === 'analytics' && <AdminSEOAnalytics />}
      {tab === 'pseo' && <AdminPSEO />}
    </div>
  );
};

export default AdminSEOHub;
