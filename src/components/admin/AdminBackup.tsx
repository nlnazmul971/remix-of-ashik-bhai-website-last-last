import { useState } from 'react';
import { Download, Upload, Database, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Tables included in full-site backup (excludes auth/users-managed tables).
const BACKUP_TABLES = [
  'store_settings',
  'header_categories',
  'subcategories',
  'products',
  'product_images',
  'product_size_stock',
  'stock_logs',
  'orders',
  'reviews',
  'coupons',
  'delivery_zones',
  'packaging_options',
  'checkout_payment_settings',
  'tracking_settings',
  'redirects',
  'custom_pages',
  'landing_pages',
  'landing_page_analytics',
  'blog_authors',
  'blog_categories',
  'blog_tags',
  'blogs',
  'blog_comments',
  'newsletter_subscribers',
  'wishlist_items',
  'pseo_templates',
  'pseo_pages',
  'fraud_checks',
] as const;

const AdminBackup = () => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<string>('');

  const handleExport = async () => {
    setExporting(true);
    try {
      const dump: Record<string, any[]> = {};
      for (const table of BACKUP_TABLES) {
        setProgress(`Exporting ${table}…`);
        const { data, error } = await supabase.from(table as any).select('*');
        if (error) {
          console.error(`[backup] ${table}`, error);
          dump[table] = [];
          continue;
        }
        dump[table] = data || [];
      }
      const payload = {
        version: 1,
        exported_at: new Date().toISOString(),
        tables: dump,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `website-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
    } catch (e: any) {
      toast.error(`Export failed: ${e.message}`);
    } finally {
      setExporting(false);
      setProgress('');
    }
  };

  const handleImport = async (file: File) => {
    if (!confirm('⚠️ This will REPLACE all existing website data with the uploaded backup. Continue?')) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const tables: Record<string, any[]> = parsed.tables || parsed;
      // Restore in given order; child tables after parents.
      for (const table of BACKUP_TABLES) {
        const rows = tables[table];
        if (!Array.isArray(rows)) continue;
        setProgress(`Restoring ${table} (${rows.length})…`);
        // Wipe table first
        await supabase.from(table as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (rows.length === 0) continue;
        // Insert in chunks of 500
        for (let i = 0; i < rows.length; i += 500) {
          const chunk = rows.slice(i, i + 500);
          const { error } = await supabase.from(table as any).insert(chunk);
          if (error) {
            console.error(`[restore] ${table}`, error);
            toast.error(`${table}: ${error.message}`);
          }
        }
      }
      toast.success('Backup restored. Refresh the site to see changes.');
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
            <h3 className="font-semibold">Restore from backup</h3>
            <p className="text-xs text-muted-foreground">Upload a previously downloaded JSON backup.</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 mb-3 rounded-md bg-destructive/10 text-destructive text-xs">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>This <strong>permanently overwrites</strong> existing data in every table listed in the backup. Take a fresh download first.</span>
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
