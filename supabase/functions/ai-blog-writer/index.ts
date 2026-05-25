import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { kind, topic, focusKeyword, tone, brand, title, content } = await req.json();
    if (!kind) {
      return new Response(JSON.stringify({ error: 'kind required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ctx = `Topic: ${topic || title || ''}
Focus Keyword: ${focusKeyword || ''}
Tone: ${tone || 'friendly, expert, helpful'}
Brand: ${brand || ''}
Existing content snippet: ${(content || '').slice(0, 800)}`;

    let prompt = '';
    let system = 'You are an expert SEO blog writer for an ecommerce brand. Output ONLY the requested content with no extra commentary, no code fences, no labels.';

    if (kind === 'title') {
      prompt = `Write ONE compelling, SEO-optimized blog title (50-65 chars) that includes the focus keyword naturally. Just the title.\n\n${ctx}`;
    } else if (kind === 'excerpt') {
      prompt = `Write ONE engaging blog excerpt (140-160 chars) that includes the focus keyword and entices clicks. Just the excerpt.\n\n${ctx}`;
    } else if (kind === 'meta-title') {
      prompt = `Write ONE SEO meta title (50-60 chars) with focus keyword. Just the title.\n\n${ctx}`;
    } else if (kind === 'meta-description') {
      prompt = `Write ONE SEO meta description (140-155 chars) with focus keyword and soft CTA. Just the description.\n\n${ctx}`;
    } else if (kind === 'keywords') {
      prompt = `List 8-12 SEO keywords for this blog post, comma-separated, lowercase. Just the list.\n\n${ctx}`;
    } else if (kind === 'tags') {
      prompt = `Return STRICT JSON array of 5-8 lowercase tag slugs for this post, e.g. ["baby-care","sleep-tips"]. JSON only, no prose.\n\n${ctx}`;
    } else if (kind === 'faq') {
      prompt = `Generate 5 helpful FAQ entries about this topic. Return STRICT JSON: [{"q":"...","a":"..."}]. JSON only, no code fences.\n\n${ctx}`;
    } else if (kind === 'outline') {
      prompt = `Create a detailed blog outline as STRICT JSON: {"intro":"...","sections":[{"h2":"...","points":["..."]}],"conclusion":"..."}. JSON only.\n\n${ctx}`;
    } else if (kind === 'full-article') {
      prompt = `Write a complete, SEO-optimized blog article (900-1400 words) in semantic HTML.
Rules:
- Start with a 2-3 sentence engaging intro paragraph (no H1, the title is rendered separately).
- Use <h2> for main sections, <h3> for sub-sections.
- Include 4-6 <h2> sections with thorough content.
- Use <p>, <ul>/<ol>/<li>, <blockquote>, <strong> where helpful.
- Include the focus keyword naturally in intro, at least one <h2>, and conclusion.
- End with a <h2>Conclusion</h2> and a soft CTA paragraph.
Output raw HTML only — no markdown, no code fences, no <html>/<body> wrappers.\n\n${ctx}`;
    } else {
      return new Response(JSON.stringify({ error: 'invalid kind' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: kind === 'full-article' ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: system },
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
    let raw = (json.choices?.[0]?.message?.content || '').trim();
    raw = raw.replace(/^```(?:json|html)?/i, '').replace(/```$/, '').trim();

    if (kind === 'faq' || kind === 'tags' || kind === 'outline') {
      try {
        return new Response(JSON.stringify({ result: JSON.parse(raw) }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch {
        return new Response(JSON.stringify({ result: kind === 'outline' ? {} : [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ result: raw.replace(/^["']|["']$/g, '') }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
