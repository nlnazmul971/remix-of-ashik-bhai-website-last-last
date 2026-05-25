import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const fill = (tmpl: string, vars: Record<string, string>) =>
  tmpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { template_id, combinations, use_ai } = await req.json();
    if (!template_id || !Array.isArray(combinations)) {
      return new Response(JSON.stringify({ error: 'template_id and combinations[] required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: tpl, error: tplErr } = await supabase
      .from('pseo_templates')
      .select('*')
      .eq('id', template_id)
      .maybeSingle();
    if (tplErr || !tpl) throw new Error('Template not found');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const vars of combinations) {
      const slug = slugify(fill(tpl.url_pattern, vars));
      if (!slug) { skipped++; continue; }

      // Skip if exists
      const { data: existing } = await supabase.from('pseo_pages').select('id').eq('slug', slug).maybeSingle();
      if (existing) { skipped++; continue; }

      let title = fill(tpl.title_template, vars);
      let description = fill(tpl.description_template, vars);
      let h1 = fill(tpl.h1_template, vars);
      let content = fill(tpl.content_template, vars);
      const keywords = fill(tpl.seo_keywords_template || '', vars);

      // Optional AI enrichment for uniqueness
      if (use_ai && LOVABLE_API_KEY) {
        try {
          const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: 'You are an SEO copywriter for a premium fashion ecommerce brand. Rewrite the supplied HTML to be unique, conversion-focused, and 300+ words. Return only the HTML body (no markdown, no <html>/<head>).' },
                { role: 'user', content: `Variables: ${JSON.stringify(vars)}\n\nBase content:\n${content}` },
              ],
            }),
          });
          if (res.ok) {
            const j = await res.json();
            const enriched = j?.choices?.[0]?.message?.content;
            if (enriched && typeof enriched === 'string') content = enriched;
          } else if (res.status === 429 || res.status === 402) {
            errors.push(`AI rate/credits limit hit at ${slug}; falling back to template`);
          }
        } catch (e) {
          console.error('AI enrich failed', e);
        }
      }

      const { error: insErr } = await supabase.from('pseo_pages').insert({
        template_id,
        slug,
        title,
        description,
        h1,
        content,
        variables: vars,
        seo_keywords: keywords,
        status: 'published',
      });
      if (insErr) {
        errors.push(`${slug}: ${insErr.message}`);
      } else {
        created++;
      }
    }

    return new Response(JSON.stringify({ created, skipped, errors }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('pseo-generate error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
