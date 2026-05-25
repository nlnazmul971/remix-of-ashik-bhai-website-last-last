import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { topic, goal, audience } = await req.json();
    if (!topic || typeof topic !== 'string') {
      return new Response(JSON.stringify({ error: 'topic required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');

    const systemPrompt = `You are a senior conversion copywriter and landing-page strategist for a premium fashion ecommerce brand. Return STRICTLY a single JSON object matching the supplied schema. No prose, no markdown.`;

    const userPrompt = `Build a complete, high-converting landing page.

Topic: ${topic}
Goal: ${goal || 'drive product purchases / signups'}
Audience: ${audience || 'modern fashion-conscious shoppers'}

Requirements:
- Generate 6-9 blocks total in a conversion-optimized order
- Include at minimum: hero, features (3-4), testimonials (3), cta, faq (4-5)
- Copy must be sharp, benefit-led, and on-brand for a premium clothing label
- Slug must be url-safe, lowercase, hyphenated
- SEO title 50-60 chars, description 140-160 chars`;

    const schema = {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        seo_title: { type: 'string' },
        seo_description: { type: 'string' },
        seo_keywords: { type: 'string' },
        seo_focus_keyword: { type: 'string' },
        blocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['hero', 'text', 'features', 'testimonials', 'cta', 'faq', 'stats', 'trust', 'newsletter', 'gallery'] },
              data: { type: 'object' },
            },
            required: ['type', 'data'],
          },
        },
      },
      required: ['slug', 'title', 'description', 'seo_title', 'seo_description', 'blocks'],
    };

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{ type: 'function', function: { name: 'generate_landing_page', description: 'Return the full landing page spec', parameters: schema } }],
        tool_choice: { type: 'function', function: { name: 'generate_landing_page' } },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Gateway error', res.status, text);
      if (res.status === 429) return new Response(JSON.stringify({ error: 'Rate limited, try again shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (res.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ error: 'AI gateway error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const json = await res.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : null;
    if (!args) throw new Error('No structured output');

    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('ai-landing-page error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
