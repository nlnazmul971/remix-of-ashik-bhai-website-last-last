import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const META_GRAPH_URL = 'https://graph.facebook.com/v18.0';

// ---------- helpers ----------

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const norm = (s: string | null | undefined) => (s || '').toString().trim().toLowerCase();
const phoneDigits = (s: string | null | undefined) => (s || '').toString().replace(/[^0-9]/g, '');

async function hashIfPresent(v: string | null | undefined): Promise<string[] | undefined> {
  const n = norm(v);
  if (!n) return undefined;
  return [await sha256(n)];
}

const FB_EVENT_NAMES: Record<string, string> = {
  Cancelled: 'CancelOrder',
  Returned: 'ReturnOrder',
  ReturnCancel: 'ReturnOrder',
  Delivered: 'OrderDelivered',
};

const STATUS_TO_CLIENT_EVENT: Record<string, string> = {
  Cancelled: 'order_cancel',
  Returned: 'order_return',
  ReturnCancel: 'order_return',
  Delivered: 'order_delivered',
};

const ALLOWED_CLIENT_EVENTS = new Set(['ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase']);

async function buildClientUserData(data: any, req: Request): Promise<Record<string, any>> {
  const raw = data?.user_data || {};
  const fullName = (raw.name || '').trim();
  const parts = fullName.split(/\s+/);
  const firstName = raw.first_name || parts[0] || '';
  const lastName = raw.last_name || parts.slice(1).join(' ') || '';
  const userData: Record<string, any> = {
    em: await hashIfPresent(raw.email_address || raw.email),
    ph: raw.phone_number || raw.phone ? [await sha256(phoneDigits(raw.phone_number || raw.phone))] : undefined,
    fn: await hashIfPresent(firstName),
    ln: await hashIfPresent(lastName),
    ct: await hashIfPresent(raw.city),
    country: await hashIfPresent(raw.country || 'BD'),
    zp: await hashIfPresent(raw.postal_code || raw.zip),
    fbp: data?.fbp || undefined,
    fbc: data?.fbc || undefined,
    client_user_agent: req.headers.get('user-agent') || undefined,
    client_ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
  };
  Object.keys(userData).forEach(k => userData[k] === undefined && delete userData[k]);
  return userData;
}

async function verifyAdmin(req: Request): Promise<{ authorized: boolean; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: 'Missing authorization header' };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { authorized: false, error: 'Invalid token' };

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!roleData) return { authorized: false, error: 'Forbidden: admin role required' };
  return { authorized: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, data } = body;

    if (action !== 'track_client_event' && action !== 'get_public_settings') {
      const auth = await verifyAdmin(req);
      if (!auth.authorized) {
        return new Response(JSON.stringify({ success: false, error: auth.error }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settings } = await supabase
      .from('tracking_settings')
      .select('key, value');

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: any) => { settingsMap[s.key] = s.value; });

    const pixelId = settingsMap['meta_pixel_id'];
    const accessToken = settingsMap['meta_capi_access_token'];

    // ---------- get_public_settings: safe browser-readable tracking IDs only ----------
    if (action === 'get_public_settings') {
      return new Response(JSON.stringify({
        success: true,
        settings: {
          ga4_measurement_id: settingsMap['ga4_measurement_id'] || '',
          gtm_container_id: settingsMap['gtm_container_id'] || '',
          meta_pixel_id: settingsMap['meta_pixel_id'] || '',
        },
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---------- check_connection ----------
    if (action === 'check_connection') {
      if (!pixelId || !accessToken) {
        return new Response(JSON.stringify({ success: false, error: 'Meta Pixel ID or CAPI Access Token not configured' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const response = await fetch(`${META_GRAPH_URL}/${pixelId}?access_token=${accessToken}`);
      const responseText = await response.text();
      let result; try { result = JSON.parse(responseText); } catch {
        return new Response(JSON.stringify({ success: false, error: 'Non-JSON response from Meta API' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: !result.error, data: result }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---------- send_event (raw passthrough) ----------
    if (action === 'send_event') {
      if (!pixelId || !accessToken) {
        return new Response(JSON.stringify({ success: false, error: 'Meta credentials not configured' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const response = await fetch(`${META_GRAPH_URL}/${pixelId}/events?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: data.events }),
      });
      const responseText = await response.text();
      let result; try { result = JSON.parse(responseText); } catch {
        return new Response(JSON.stringify({ success: false, error: 'Non-JSON response' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: response.ok, data: result }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---------- track_client_event: website Pixel/CAPI with full custom_data ----------
    if (action === 'track_client_event') {
      if (!pixelId || !accessToken) {
        return new Response(JSON.stringify({ success: false, error: 'Meta credentials not configured' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!ALLOWED_CLIENT_EVENTS.has(data?.event_name)) {
        return new Response(JSON.stringify({ success: false, error: 'Unsupported client event' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const event = {
        event_name: data.event_name,
        event_time: Number(data.event_time) || Math.round(Date.now() / 1000),
        event_id: data.event_id,
        action_source: 'website',
        event_source_url: data.event_source_url,
        user_data: await buildClientUserData(data, req),
        custom_data: data.custom_data || {},
      };

      const response = await fetch(`${META_GRAPH_URL}/${pixelId}/events?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [event] }),
      });
      const responseText = await response.text();
      let result; try { result = JSON.parse(responseText); } catch {
        return new Response(JSON.stringify({ success: false, error: 'Non-JSON response from Meta', raw: responseText }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: response.ok && !result.error, data: result }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---------- track_order: order_cancel / order_return / order_delivered ----------
    if (action === 'track_order') {
      if (!pixelId || !accessToken) {
        return new Response(JSON.stringify({ success: false, error: 'Meta credentials not configured' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const status: string = data?.status || '';
      const fbEventName = FB_EVENT_NAMES[status];
      const clientEventBase = STATUS_TO_CLIENT_EVENT[status];
      if (!fbEventName || !clientEventBase) {
        return new Response(JSON.stringify({ success: false, error: `Unsupported status: ${status}` }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const orderId: string = data.order_id;
      const customer = data.customer || {};
      const items: any[] = Array.isArray(data.items) ? data.items : [];

      // First/last name split
      const fullName = (customer.name || '').trim();
      const parts = fullName.split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      // Hashed user_data (Advanced Matching)
      const user_data: Record<string, any> = {
        em: await hashIfPresent(customer.email),
        ph: customer.phone ? [await sha256(phoneDigits(customer.phone))] : undefined,
        fn: await hashIfPresent(firstName),
        ln: await hashIfPresent(lastName),
        ct: await hashIfPresent(customer.city),
        country: await hashIfPresent(customer.country || 'BD'),
        zp: await hashIfPresent(customer.postal_code),
      };

      // fbp / fbc if forwarded from client (admin browser snapshot of customer cookies, optional)
      if (data.fbp) user_data.fbp = data.fbp;
      if (data.fbc) user_data.fbc = data.fbc;

      // Strip undefined keys
      Object.keys(user_data).forEach(k => user_data[k] === undefined && delete user_data[k]);

      const content_ids = items.map((it: any) => String(it.product_id || it.id || '')).filter(Boolean);
      const content_name = items.map((it: any) => it.name || it.item_name || '').filter(Boolean).join(', ');
      const content_category = items.map((it: any) => it.category || it.item_category || '').filter(Boolean).join(', ');
      const contents = items.map((it: any) => ({
        id: String(it.product_id || it.id || ''),
        quantity: Number(it.quantity) || 1,
        item_price: Number(it.price) || 0,
      }));

      const event = {
        event_name: fbEventName,
        event_time: Math.round(Date.now() / 1000),
        event_id: `${clientEventBase}_${orderId}`, // matches dataLayer event_id for dedup
        action_source: 'system_generated',
        user_data,
        custom_data: {
          currency: data.currency || 'BDT',
          value: Number(data.value) || 0,
          order_id: orderId,
          content_type: 'product',
          content_ids,
          content_name,
          content_category,
          contents,
          num_items: items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0),
          status,
          payment_method: data.payment_method,
          delivery_method: data.delivery_method,
        },
      };

      const response = await fetch(`${META_GRAPH_URL}/${pixelId}/events?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [event] }),
      });
      const responseText = await response.text();
      let result; try { result = JSON.parse(responseText); } catch {
        return new Response(JSON.stringify({ success: false, error: 'Non-JSON response from Meta', raw: responseText }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: response.ok && !result.error, data: result }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Meta CAPI error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
