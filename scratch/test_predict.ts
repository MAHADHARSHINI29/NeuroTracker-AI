import fs from 'fs';
import path from 'path';

const modelParamsPath = path.join(__dirname, 'supabase', 'functions', 'predict-headache', 'model_params.json');
const activeParams = JSON.parse(fs.readFileSync(modelParamsPath, 'utf8'));

const { feature_names, classes, scaler, gamma, support_vectors, dual_coef, intercept, n_support } = activeParams;

function predict(data: any) {
    const processed: any = { ...data };
    processed.severity_score = (data.pain_intensity * 0.5) + (Number(data.nausea) * 2.0);

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

    const encoders = activeParams.encoders || {};
    const encodedData: any = { ...processed };
    for (const [feature, categories] of Object.entries(encoders)) {
      const cats = categories as string[];
      const rawVal = String(processed[feature] || '');
      const idx = cats.indexOf(rawVal);
      encodedData[feature] = idx >= 0 ? idx : 0;
    }

    const X_scaled = feature_names.map((name: string, i: number) => {
      const val = Number(encodedData[name] ?? 0);
      if (scaler?.mean?.[i] !== undefined) {
        return (val - scaler.mean[i]) / (scaler.scale[i] || 1);
      }
      return val;
    });

    let predictionIdx = 0;
    let votes = [0, 0, 0, 0];

    const rbf = (v1: number[], v2: number[]) => {
      let distSq = 0;
      for (let i = 0; i < v1.length; i++) distSq += Math.pow(v1[i] - v2[i], 2);
      return Math.exp(-(gamma || 0.1) * distSq);
    };

    const nClasses = classes.length;
    const kValues = support_vectors.map((sv: number[]) => rbf(sv, X_scaled));
    let interceptIdx = 0;
    const startSV = new Array(nClasses).fill(0);
    for (let i = 1; i < nClasses; i++) startSV[i] = startSV[i-1] + (n_support[i-1] || 0);

    for (let i = 0; i < nClasses; i++) {
        for (let j = i + 1; j < nClasses; j++) {
        let sum = 0;
        for (let k = 0; k < n_support[i]; k++) sum += dual_coef[j - 1][startSV[i] + k] * kValues[startSV[i] + k];
        for (let k = 0; k < n_support[j]; k++) sum += dual_coef[i][startSV[j] + k] * kValues[startSV[j] + k];
        sum += intercept[interceptIdx++];
        if (sum > 0) votes[i]++; else votes[j]++;
        }
    }
    predictionIdx = votes.indexOf(Math.max(...votes));
    
    return {
        votes,
        predictionIdx,
        prediction: ["Migraine without aura", "Migraine with aura", "Tension-type headache", "Cluster headache"][predictionIdx]
    }
}

const tests = [
    {
        name: 'migraine_aura',
        data: {
            age: 25, gender: 'Female', pain_intensity: 8, pain_location: 'Temporal', pain_quality: 'Throbbing',
            duration_hours: 240/60, nausea: true, vomiting: false, photophobia: true, phonophobia: false,
            aura_present: true, aura_type: 'Visual', visual_disturbance: true, stress_level: 6, sleep_hours: 7,
            physical_activity: 'Moderate', caffeine_intake: 2, alcohol_intake: 0, weather_sensitivity: false,
            hormonal_factor: false, screen_time: 6, frequency_per_month: 2, onset_pattern: 'Gradual',
            family_history: false, medication_response: 'Good'
        }
    },
    {
        name: 'tension',
        data: {
            age: 25, gender: 'Female', pain_intensity: 4, pain_location: 'Bilateral', pain_quality: 'Pressing',
            duration_hours: 60/60, nausea: false, vomiting: false, photophobia: false, phonophobia: false,
            aura_present: false, aura_type: 'None', visual_disturbance: false, stress_level: 8, sleep_hours: 7,
            physical_activity: 'Moderate', caffeine_intake: 2, alcohol_intake: 0, weather_sensitivity: false,
            hormonal_factor: false, screen_time: 6, frequency_per_month: 2, onset_pattern: 'Gradual',
            family_history: false, medication_response: 'Good'
        }
    }
]

for (const test of tests) {
    console.log(test.name, predict(test.data));
}
