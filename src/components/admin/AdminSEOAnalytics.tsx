import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Eye, TrendingUp, FileText, Rocket, Globe, BookOpen, RefreshCw, ExternalLink } from 'lucide-react';

type Row = { path: string; title: string; views: number; type: string };

const AdminSEOAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [stats, setStats] = useState({ totalViews: 0, totalPages: 0, blogs: 0, landing: 0, pseo: 0 });

  const load = async () => {
    setLoading(true);
    const [blogs, landing, pseo, lpAnalytics] = await Promise.all([
      supabase.from('blogs').select('slug, title, view_count, status').eq('status', 'published'),
      supabase.from('landing_pages').select('slug, title, view_count, conversion_count, status').eq('status', 'published'),
      supabase.from('pseo_pages').select('slug, title, view_count, status').eq('status', 'published'),
      supabase.from('landing_page_analytics').select('event_type, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const collected: Row[] = [];
    let totalViews = 0;
    (blogs.data || []).forEach((b: any) => {
      const v = b.view_count || 0; totalViews += v;
      collected.push({ path: `/blog/${b.slug}`, title: b.title, views: v, type: 'blog' });
    });
    (landing.data || []).forEach((p: any) => {
      const v = p.view_count || 0; totalViews += v;
      collected.push({ path: `/l/${p.slug}`, title: p.title, views: v, type: 'landing' });
    });
    (pseo.data || []).forEach((p: any) => {
      const v = p.view_count || 0; totalViews += v;
      collected.push({ path: `/p/${p.slug}`, title: p.title || p.slug, views: v, type: 'pseo' });
    });

    collected.sort((a, b) => b.views - a.views);
    setRows(collected);
    setStats({
      totalViews,
      totalPages: collected.length,
      blogs: (blogs.data || []).length,
      landing: (landing.data || []).length,
      pseo: (pseo.data || []).length,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filter = (type: string) => rows.filter(r => type === 'all' || r.type === type);

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  const Table = ({ data }: { data: Row[] }) => (
    <Card>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No pages yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {data.slice(0, 100).map((r, i) => (
              <div key={i} className="flex items-center justify-between p-4 gap-3 hover:bg-muted/30">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Badge variant="outline" className="capitalize shrink-0">{r.type}</Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{r.path}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold flex items-center gap-1"><Eye className="w-3 h-3" />{r.views.toLocaleString()}</span>
                  <Button size="icon" variant="ghost" asChild>
                    <a href={r.path} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">SEO Analytics</h2>
          <p className="text-sm text-muted-foreground">Traffic across blogs, landing pages, and programmatic SEO.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp} label="Total Views" value={stats.totalViews} color="text-primary" />
        <StatCard icon={FileText} label="Indexed Pages" value={stats.totalPages} color="text-foreground/60" />
        <StatCard icon={BookOpen} label="Blog Posts" value={stats.blogs} color="text-foreground/60" />
        <StatCard icon={Rocket} label="Landing + PSEO" value={stats.landing + stats.pseo} color="text-foreground/60" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({rows.length})</TabsTrigger>
          <TabsTrigger value="blog"><BookOpen className="w-3 h-3 mr-1" />Blog</TabsTrigger>
          <TabsTrigger value="landing"><Rocket className="w-3 h-3 mr-1" />Landing</TabsTrigger>
          <TabsTrigger value="pseo"><Globe className="w-3 h-3 mr-1" />PSEO</TabsTrigger>
        </TabsList>
        <TabsContent value="all"><Table data={filter('all')} /></TabsContent>
        <TabsContent value="blog"><Table data={filter('blog')} /></TabsContent>
        <TabsContent value="landing"><Table data={filter('landing')} /></TabsContent>
        <TabsContent value="pseo"><Table data={filter('pseo')} /></TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sitemap & Indexing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">Your sitemap is auto-generated at build time and includes all products, custom pages, blogs, landing pages, and programmatic SEO pages.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button size="sm" variant="outline" asChild><a href="/sitemap.xml" target="_blank" rel="noreferrer">View sitemap.xml <ExternalLink className="w-3 h-3 ml-1" /></a></Button>
            <Button size="sm" variant="outline" asChild><a href="/robots.txt" target="_blank" rel="noreferrer">View robots.txt <ExternalLink className="w-3 h-3 ml-1" /></a></Button>
            <Button size="sm" variant="outline" asChild><a href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Google Search Console <ExternalLink className="w-3 h-3 ml-1" /></a></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSEOAnalytics;
