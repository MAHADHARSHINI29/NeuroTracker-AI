import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * ADMIN STATS EDGE FUNCTION
 * Uses the service_role key to bypass RLS and return all user/data stats.
 * Only called from the admin panel (passphrase-protected).
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      },
    });
  }

  try {
    // Use service_role key to bypass RLS — this sees ALL data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. ALL headache entries (with user_id + timestamps)
    const { data: entries, error: entriesErr } = await supabaseAdmin
      .from('headache_history')
      .select('user_id, created_at, predicted_type, intensity, risk_level')
      .order('created_at', { ascending: false });

    if (entriesErr) throw entriesErr;

    // 2. Count risk predictions
    const { count: riskCount } = await supabaseAdmin
      .from('risk_predictions')
      .select('*', { count: 'exact', head: true });

    // 3. All ML models
    const { data: models, error: modelsErr } = await supabaseAdmin
      .from('ml_models')
      .select('*')
      .order('last_trained', { ascending: false });

    if (modelsErr) throw modelsErr;

    // 4. Aggregate user activity
    const userMap: Record<string, { count: number; lastActive: string }> = {};
    const dayMap: Record<string, number> = {};

    (entries || []).forEach((e: any) => {
      if (!userMap[e.user_id]) {
        userMap[e.user_id] = { count: 0, lastActive: e.created_at };
      }
      userMap[e.user_id].count++;

      const day = new Date(e.created_at).toISOString().split('T')[0]; // YYYY-MM-DD
      dayMap[day] = (dayMap[day] || 0) + 1;
    });

    const users = Object.entries(userMap).map(([uid, d]) => ({
      userId: uid,
      entries: d.count,
      lastActive: d.lastActive,
    }));

    // Daily entries (last 30 days)
    const dailyEntries = Object.entries(dayMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 30)
      .reverse()
      .map(([day, count]) => ({ day, count }));

    return new Response(
      JSON.stringify({
        headacheCount: (entries || []).length,
        riskCount: riskCount || 0,
        models: models || [],
        users,
        dailyEntries,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
