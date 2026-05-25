import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Client-side 301/302 redirect handler.
 * Looks up the current pathname in `redirects` table, and if a match is found,
 * navigates (or hard-redirects for absolute URLs) to the target.
 *
 * NOTE: This runs after React mounts — true server 301s require SSR/edge,
 * which Vite SPA cannot do. For SEO purposes Google still follows JS redirects.
 */
const RedirectHandler = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('redirects' as any)
        .select('to_path, status_code, id, hit_count')
        .eq('from_path', pathname)
        .eq('is_active', true)
        .maybeSingle();
      if (cancelled || !data) return;
      const { to_path, id, hit_count } = data as any;
      // Fire and forget hit increment
      supabase.from('redirects' as any)
        .update({ hit_count: (hit_count || 0) + 1, last_hit_at: new Date().toISOString() })
        .eq('id', id)
        .then(() => {});
      if (/^https?:\/\//i.test(to_path)) {
        window.location.replace(to_path);
      } else {
        navigate(to_path, { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [pathname, navigate]);

  return null;
};

export default RedirectHandler;
