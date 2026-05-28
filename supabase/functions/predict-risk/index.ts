import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * MIGRAINE RISK FORECASTING ENGINE (Temporal Analytics)
 * Analyzes recent lifestyle trends (48h) to predict upcoming risk.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
    }});
  }

  try {
    const { user_id } = await req.json();
    
    // Create Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch recent history (Last 7 days)
    const { data: history, error } = await supabaseClient
      .from('headache_history')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    // 2. Risk Calculation Algorithm (Heuristic weighting for the demo)
    let riskScore = 0.15; // Baseline risk
    
    if (history && history.length > 0) {
      const recent = history[0];
      
      // Stress Trend (+25% if high)
      if (recent.stress_level > 7) riskScore += 0.3;
      
      // Sleep Trend (+20% if low)
      if (recent.sleep_hours < 6) riskScore += 0.25;
      
      // Frequency Trend (+15% if cluster)
      const recentFreq = history.filter(h => {
          const d = new Date(h.created_at);
          return (Date.now() - d.getTime()) < (48 * 60 * 60 * 1000);
      }).length;
      
      if (recentFreq >= 2) riskScore += 0.2;
    }

    const finalProb = Math.min(Math.round(riskScore * 100), 95);
    let riskLevel = 'Low';
    if (finalProb > 75) riskLevel = 'High';
    else if (finalProb > 40) riskLevel = 'Moderate';

    return new Response(
      JSON.stringify({ 
        probability: finalProb,
        risk_level: riskLevel,
        forecast_period: '48 hours',
        insight: finalProb > 60 
            ? "Noticeable upward trend in neuro-triggers. Preventive measures recommended." 
            : "Stable neurological outlook for the next 48 hours.",
        factors: {
           stress: history?.[0]?.stress_level || 5,
           sleep: history?.[0]?.sleep_hours || 7
        }
      }),
      { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    });
  }
});
