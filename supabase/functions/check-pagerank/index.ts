const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domains } = await req.json();

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'domains array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('OPEN_PAGERANK_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OPEN_PAGERANK_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Open PageRank API accepts up to 100 domains per request via query params
    const params = domains.map(d => `domains[]=${encodeURIComponent(d)}`).join('&');
    const response = await fetch(`https://openpagerank.com/api/v1.0/getPageRank?${params}`, {
      method: 'GET',
      headers: {
        'API-OPR': apiKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Open PageRank API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: data.response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking PageRank:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to check PageRank';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
