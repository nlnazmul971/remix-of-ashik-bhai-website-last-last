import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { kind, product, focusKeyword, brand } = await req.json();
    if (!product?.name) {
      return new Response(JSON.stringify({ error: 'product.name required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ctx = `Product: ${product.name}
Category: ${product.category || ''}
Brand: ${brand || product.brand || ''}
Price: ${product.price || ''} BDT
Focus Keyword: ${focusKeyword || product.name}
Description: ${(product.description || '').slice(0, 500)}`;

    let prompt = '';
    if (kind === 'title') {
      prompt = `Write ONE compelling, SEO-optimized meta title (50-60 chars) for this baby product. Include the focus keyword naturally. No quotes, no explanation, just the title.\n\n${ctx}`;
    } else if (kind === 'description') {
      prompt = `Write ONE SEO meta description (140-155 chars) for this baby product. Include the focus keyword naturally and end with a soft CTA. No quotes, no explanation, just the description.\n\n${ctx}`;
    } else if (kind === 'keywords') {
      prompt = `List 8-12 SEO keywords for this baby product, comma-separated, lowercase. No explanation, just the comma-separated list.\n\n${ctx}`;
    } else if (kind === 'faq') {
      prompt = `Generate 5 helpful FAQ entries (question + answer) about this baby product for SEO. Return STRICT JSON array: [{"q":"...","a":"..."}]. No prose, no code fences.\n\n${ctx}`;
    } else {
      return new Response(JSON.stringify({ error: 'invalid kind' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert ecommerce SEO copywriter for a baby products brand.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: 'AI error', detail: t }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const json = await aiRes.json();
    let content = json.choices?.[0]?.message?.content?.trim() || '';

    if (kind === 'faq') {
      // strip code fences if any
      content = content.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify({ result: parsed }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch {
        return new Response(JSON.stringify({ result: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ result: content.replace(/^["']|["']$/g, '') }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
