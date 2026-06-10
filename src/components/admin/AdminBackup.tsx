import { useState } from 'react';
import { Download, Upload, Database, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Tables included in full-site backup (excludes auth-managed tables).
// Ordered so parent tables come before child tables (FK-safe for restore).
const BACKUP_TABLES = [
  'store_settings',
  'tracking_settings',
  'checkout_payment_settings',
  'header_categories',
  'subcategories',
  'delivery_zones',
  'packaging_options',
  'coupons',
  'redirects',
  'custom_pages',
  
  'products',
  'product_images',
  'product_size_stock',
  'stock_logs',
  'profiles',
  'user_roles',
  'orders',
  'reviews',
  'wishlist_items',
  'newsletter_subscribers',
  'fraud_checks',
  'approval_requests',
  'action_logs',
  'blog_authors',
  'blog_categories',
  'blog_tags',
  'blogs',
  'blog_comments',
  'landing_pages',
  'landing_page_analytics',
  'pseo_templates',
  'pseo_pages',
] as const;

const AdminBackup = () => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<string>('');

  // Tables that don't have an `id` primary key — use a different conflict column
  const CONFLICT_COL: Record<string, string> = {
    store_settings: 'key',
    tracking_settings: 'key',
    checkout_payment_settings: 'method',
    user_roles: 'user_id,role',
    newsletter_subscribers: 'email',
    fraud_checks: 'phone',
  };

  const handleExport = async () => {
    setExporting(true);
    const summary: Record<string, number> = {};
    const errors: string[] = [];
    try {
      const dump: Record<string, any[]> = {};
      for (const table of BACKUP_TABLES) {
        setProgress(`Exporting ${table}…`);
        const all: any[] = [];
        const PAGE = 1000;
        let from = 0;
        while (true) {
          const { data, error } = await supabase
            .from(table as any)
            .select('*')
            .range(from, from + PAGE - 1);
          if (error) {
            console.error(`[backup] ${table}`, error);
            errors.push(`${table}: ${error.message}`);
            break;
          }
          if (!data || data.length === 0) break;
          all.push(...data);
          if (data.length < PAGE) break;
          from += PAGE;
          setProgress(`Exporting ${table}… (${all.length})`);
        }
        dump[table] = all;
        summary[table] = all.length;
      }
      const payload = {
        version: 2,
        exported_at: new Date().toISOString(),
        summary,
        tables: dump,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `website-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const total = Object.values(summary).reduce((a, b) => a + b, 0);
      const nonEmpty = Object.entries(summary).filter(([, n]) => n > 0);
      const emptyTables = Object.entries(summary).filter(([, n]) => n === 0).map(([t]) => t);
      console.log('[backup] Per-table row counts:', summary);
      if (emptyTables.length) console.log('[backup] Empty tables (no data in DB):', emptyTables);
      toast.success(
        `Backup downloaded — ${total} rows from ${nonEmpty.length}/${BACKUP_TABLES.length} tables. ${emptyTables.length} tables were empty in DB.`,
        { duration: 8000 }
      );
      if (errors.length) {
        toast.error(`${errors.length} table(s) failed: ${errors.slice(0, 3).join('; ')}`, { duration: 10000 });
      }
    } catch (e: any) {
      toast.error(`Export failed: ${e.message}`);
    } finally {
      setExporting(false);
      setProgress('');
    }
  };

  const handleImport = async (file: File) => {
    if (!confirm('This will MERGE the backup into your site: missing rows will be added, changed rows will be updated. Existing extra rows will NOT be deleted. Continue?')) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const tables: Record<string, any[]> = parsed.tables || parsed;
      let totalInserted = 0;
      let totalUpdated = 0;
      for (const table of BACKUP_TABLES) {
        const rows = tables[table];
        if (!Array.isArray(rows) || rows.length === 0) continue;
        const conflict = CONFLICT_COL[table] || 'id';
        setProgress(`Merging ${table} (${rows.length})…`);
        // Upsert in chunks — inserts missing rows and updates changed ones
        for (let i = 0; i < rows.length; i += 500) {
          const chunk = rows.slice(i, i + 500);
          const { error } = await supabase
            .from(table as any)
            .upsert(chunk, { onConflict: conflict, ignoreDuplicates: false });
          if (error) {
            console.error(`[restore] ${table}`, error);
            toast.error(`${table}: ${error.message}`);
          } else {
            totalUpdated += chunk.length;
          }
        }
        totalInserted += rows.length;
      }
      toast.success(`Backup merged: ${totalInserted} rows processed. Refresh the site to see changes.`);
    } catch (e: any) {
      toast.error(`Restore failed: ${e.message}`);
    } finally {
      setImporting(false);
      setProgress('');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Backup & Restore</h2>
        <p className="text-sm text-muted-foreground">
          Download a full snapshot of the website data, or restore from a previous backup file.
        </p>
      </div>

      <div className="rounded-lg border border-border p-5 bg-card">
        <div className="flex items-start gap-3 mb-4">
          <Database className="h-5 w-5 mt-0.5 text-foreground/70" />
          <div>
            <h3 className="font-semibold">Download backup</h3>
            <p className="text-xs text-muted-foreground">Exports {BACKUP_TABLES.length} tables as a single JSON file.</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || importing}
          className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? 'Exporting…' : 'Download Full Backup'}
        </button>
      </div>

      <div className="rounded-lg border border-border p-5 bg-card">
        <div className="flex items-start gap-3 mb-4">
          <Upload className="h-5 w-5 mt-0.5 text-foreground/70" />
          <div>
            <h3 className="font-semibold">Restore from backup (Smart Merge)</h3>
            <p className="text-xs text-muted-foreground">Upload a previously downloaded JSON backup. Missing rows will be added, changed rows updated. Existing extra data is kept.</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 mb-3 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Safe merge mode: nothing is deleted. Rows from the backup are <strong>added or updated</strong> based on their ID.</span>
        </div>
        <label className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm font-medium rounded-md cursor-pointer hover:bg-muted">
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {importing ? 'Restoring…' : 'Upload Backup File'}
          <input
            type="file"
            accept="application/json,.json"
            disabled={exporting || importing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.target.value = '';
            }}
            className="hidden"
          />
        </label>
      </div>

      {progress && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> {progress}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Note: User accounts, auth sessions, and storage bucket files (product images) are NOT included.
      </div>
    </div>
  );
};

export default AdminBackup;
