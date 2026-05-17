import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const GTM_ID_REGEX = /^GTM-[A-Z0-9]+$/;

const TrackingScripts = () => {
  const [gtmId, setGtmId] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('tracking_settings')
        .select('key, value')
        .eq('key', 'gtm_container_id')
        .maybeSingle();
      if (data?.value) setGtmId(data.value);
    })();
  }, []);

  useEffect(() => {
    if (!gtmId || !GTM_ID_REGEX.test(gtmId)) return;
    if (document.getElementById('gtm-script')) return;

    const s = document.createElement('script');
    s.id = 'gtm-script';
    s.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
    document.head.appendChild(s);

    const ns = document.createElement('noscript');
    ns.id = 'gtm-noscript';
    ns.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.prepend(ns);
  }, [gtmId]);

  return null;
};

export default TrackingScripts;
