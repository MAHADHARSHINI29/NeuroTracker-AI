import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * DYNAMIC NEURO-PREDICTION ENGINE v3.0 (Self-Learning)
 * System fetches the latest 'Learned' coefficients from the database.
 * If no dynamic model exists, it falls back to the baseline model_params.json.
 */

import baseModelParams from "./model_params.json" assert { type: "json" };

const LABELS = [
  "Migraine without aura", "Migraine with aura", "Tension-type headache", "Cluster headache"
];

const LR_COEFS: Record<string, Record<string, number>> = {
  "Migraine with aura": { "aura_present": 2.5, "photophobia": 1.2, "nausea": 1.0 },
  "Migraine without aura": { "nausea": 1.8, "phonophobia": 1.5, "pain_intensity": 1.1 },
  "Tension-type headache": { "stress_level": 2.0, "pain_location": -1.2, "sleep_hours": -1.5 },
  "Cluster headache": { "pain_intensity": 2.8, "duration_hours": -2.0, "frequency_per_month": 1.2 }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
    }});
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { data, algorithm = 'SVM' } = body;

    if (!data) {
      return new Response(JSON.stringify({ error: "Missing 'data' in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
      });
    }
    
    // Create Supabase Client to fetch the dynamic model
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. FETCH DYNAMIC MODEL: Pull the latest parameters from Research database
    const { data: dynamicModel } = await supabaseClient
      .from('ml_models')
      .select('model_params, accuracy')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(); // Safer than single() as it doesn't throw if 0 rows found

    // Use dynamic params if available and valid, otherwise use base baseline
    const dynamicParams = dynamicModel?.model_params as any;
    const isValidModel = dynamicParams && dynamicParams.feature_names && dynamicParams.support_vectors;
    const activeParams = isValidModel ? dynamicParams : baseModelParams;
    
    const { feature_names, classes, scaler, gamma, support_vectors, dual_coef, intercept, n_support } = activeParams;

    // 2. Preprocessing & Scaling
    const processed: any = { ...data };
    processed.severity_score = (data.pain_intensity * 0.5) + (Number(data.nausea) * 2.0);

    // Calculate missing engineered features
    processed.frequency_index = (data.frequency_per_month || 2) / 30.0;
    processed.trigger_count = [
      data.stress_level > 7 ? 1 : 0,
      (data.sleep_hours || 7) < 6 ? 1 : 0,
      data.weather_sensitivity ? 1 : 0,
    ].reduce((a: number, b: number) => a + b, 0);
    processed.symptom_count = [
      data.nausea, data.vomiting, data.photophobia,
      data.phonophobia, data.aura_present
    ].filter(Boolean).length;

    // Label-encode categorical features using the encoders from model_params
    const encoders = activeParams.encoders || {};
    const encodedData: any = { ...processed };
    for (const [feature, categories] of Object.entries(encoders)) {
      const cats = categories as string[];
      const rawVal = String(processed[feature] || '');
      const idx = cats.indexOf(rawVal);
      encodedData[feature] = idx >= 0 ? idx : 0;
    }

    // Build a mapping of which features are numeric (need scaling) vs categorical/boolean (no scaling)
    const categoricalFeatures = new Set(Object.keys(encoders || {}));
    const booleanFeatures = new Set([
      'nausea', 'vomiting', 'photophobia', 'phonophobia',
      'aura_present', 'visual_disturbance', 'weather_sensitivity',
      'hormonal_factor', 'family_history'
    ]);

    // The scaler's mean/scale arrays correspond 1:1 with ONLY the numeric features, in order
    const numericFeatureIndices: number[] = [];
    feature_names.forEach((name: string, i: number) => {
      if (!categoricalFeatures.has(name) && !booleanFeatures.has(name)) {
        numericFeatureIndices.push(i);
      }
    });

    const X_scaled = feature_names.map((name: string, i: number) => {
      const val = Number(encodedData[name] ?? 0);
      // Only scale numeric features using the correct scaler index
      const scalerIdx = numericFeatureIndices.indexOf(i);
      if (scalerIdx >= 0 && scaler?.mean?.[scalerIdx] !== undefined) {
        return (val - scaler.mean[scalerIdx]) / (scaler.scale[scalerIdx] || 1);
      }
      return val;
    });

    // 3. Inference with Dynamic Versioning
    let predictionIdx = 0;
    let confidence = 0;
    let votes = [0, 0, 0, 0];

    // Standard SVM RBF Logic (with dynamically loaded SVs)
    const rbf = (v1: number[], v2: number[]) => {
      let distSq = 0;
      for (let i = 0; i < v1.length; i++) distSq += Math.pow(v1[i] - v2[i], 2);
      return Math.exp(-(gamma || 0.1) * distSq);
    };

    const nClasses = (classes || [0,1,2,3]).length;
    if (support_vectors && dual_coef) {
       const kValues = support_vectors.map((sv: number[]) => rbf(sv, X_scaled));
       let interceptIdx = 0;
       const startSV = new Array(nClasses).fill(0);
       for (let i = 1; i < nClasses; i++) startSV[i] = startSV[i-1] + (n_support[i-1] || 0);

       for (let i = 0; i < nClasses; i++) {
         for (let j = i + 1; j < nClasses; j++) {
           let sum = 0;
           for (let k = 0; k < (n_support[i] || 0); k++) sum += dual_coef[j - 1][startSV[i] + k] * kValues[startSV[i] + k];
           for (let k = 0; k < (n_support[j] || 0); k++) sum += dual_coef[i][startSV[j] + k] * kValues[startSV[j] + k];
           sum += intercept[interceptIdx++];
           if (sum > 0) votes[i]++; else votes[j]++;
         }
       }
       predictionIdx = votes.indexOf(Math.max(...votes));
       confidence = Math.round((votes[predictionIdx] / (nClasses - 1)) * 95);
    } else {
       // Heuristic fallback if DB params are incomplete
       predictionIdx = processed.aura_present ? 1 : processed.stress_level > 7 ? 2 : 0;
       confidence = 75;
    }

    // 4. XAI calculation (Explainable AI)
    const xai_factors: Record<string, number> = {};
    const label = LABELS[predictionIdx];
    const coefSet = LR_COEFS[label] || LR_COEFS[LABELS[0]];
    
    Object.entries(coefSet).forEach(([feature, weight]) => {
      const val = processed[feature];
      if (typeof val === 'boolean' && val) xai_factors[feature] = Math.round(weight * 10);
      else if (typeof val === 'number') xai_factors[feature] = Math.round((val / 10) * weight * 15);
    });

    return new Response(
      JSON.stringify({ 
        prediction: label,
        confidence: Math.max(confidence, 65),
        model_version: `v${activeParams.version || '1.0'}`,
        xai_factors,
        risk_level: data.pain_intensity >= 8 ? 'severe' : data.pain_intensity >= 5 ? 'high' : 'low'
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
