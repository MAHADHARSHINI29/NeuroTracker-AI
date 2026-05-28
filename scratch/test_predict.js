"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
var modelParamsPath = path_1.default.join(__dirname, 'supabase', 'functions', 'predict-headache', 'model_params.json');
var activeParams = JSON.parse(fs_1.default.readFileSync(modelParamsPath, 'utf8'));
var feature_names = activeParams.feature_names, classes = activeParams.classes, scaler = activeParams.scaler, gamma = activeParams.gamma, support_vectors = activeParams.support_vectors, dual_coef = activeParams.dual_coef, intercept = activeParams.intercept, n_support = activeParams.n_support;
function predict(data) {
    var processed = __assign({}, data);
    processed.severity_score = (data.pain_intensity * 0.5) + (Number(data.nausea) * 2.0);
    processed.frequency_index = (data.frequency_per_month || 2) / 30.0;
    processed.trigger_count = [
        data.stress_level > 7 ? 1 : 0,
        (data.sleep_hours || 7) < 6 ? 1 : 0,
        data.weather_sensitivity ? 1 : 0,
    ].reduce(function (a, b) { return a + b; }, 0);
    processed.symptom_count = [
        data.nausea, data.vomiting, data.photophobia,
        data.phonophobia, data.aura_present
    ].filter(Boolean).length;
    var encoders = activeParams.encoders || {};
    var encodedData = __assign({}, processed);
    for (var _i = 0, _a = Object.entries(encoders); _i < _a.length; _i++) {
        var _b = _a[_i], feature = _b[0], categories = _b[1];
        var cats = categories;
        var rawVal = String(processed[feature] || '');
        var idx = cats.indexOf(rawVal);
        encodedData[feature] = idx >= 0 ? idx : 0;
    }
    var X_scaled = feature_names.map(function (name, i) {
        var _a, _b;
        var val = Number((_a = encodedData[name]) !== null && _a !== void 0 ? _a : 0);
        if (((_b = scaler === null || scaler === void 0 ? void 0 : scaler.mean) === null || _b === void 0 ? void 0 : _b[i]) !== undefined) {
            return (val - scaler.mean[i]) / (scaler.scale[i] || 1);
        }
        return val;
    });
    var predictionIdx = 0;
    var votes = [0, 0, 0, 0];
    var rbf = function (v1, v2) {
        var distSq = 0;
        for (var i = 0; i < v1.length; i++)
            distSq += Math.pow(v1[i] - v2[i], 2);
        return Math.exp(-(gamma || 0.1) * distSq);
    };
    var nClasses = classes.length;
    var kValues = support_vectors.map(function (sv) { return rbf(sv, X_scaled); });
    var interceptIdx = 0;
    var startSV = new Array(nClasses).fill(0);
    for (var i = 1; i < nClasses; i++)
        startSV[i] = startSV[i - 1] + (n_support[i - 1] || 0);
    for (var i = 0; i < nClasses; i++) {
        for (var j = i + 1; j < nClasses; j++) {
            var sum = 0;
            for (var k = 0; k < n_support[i]; k++)
                sum += dual_coef[j - 1][startSV[i] + k] * kValues[startSV[i] + k];
            for (var k = 0; k < n_support[j]; k++)
                sum += dual_coef[i][startSV[j] + k] * kValues[startSV[j] + k];
            sum += intercept[interceptIdx++];
            if (sum > 0)
                votes[i]++;
            else
                votes[j]++;
        }
    }
    predictionIdx = votes.indexOf(Math.max.apply(Math, votes));
    return {
        votes: votes,
        predictionIdx: predictionIdx,
        prediction: ["Migraine without aura", "Migraine with aura", "Tension-type headache", "Cluster headache"][predictionIdx]
    };
}
var tests = [
    {
        name: 'migraine_aura',
        data: {
            age: 25, gender: 'Female', pain_intensity: 8, pain_location: 'Temporal', pain_quality: 'Throbbing',
            duration_hours: 240 / 60, nausea: true, vomiting: false, photophobia: true, phonophobia: false,
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
            duration_hours: 60 / 60, nausea: false, vomiting: false, photophobia: false, phonophobia: false,
            aura_present: false, aura_type: 'None', visual_disturbance: false, stress_level: 8, sleep_hours: 7,
            physical_activity: 'Moderate', caffeine_intake: 2, alcohol_intake: 0, weather_sensitivity: false,
            hormonal_factor: false, screen_time: 6, frequency_per_month: 2, onset_pattern: 'Gradual',
            family_history: false, medication_response: 'Good'
        }
    }
];
for (var _i = 0, tests_1 = tests; _i < tests_1.length; _i++) {
    var test = tests_1[_i];
    console.log(test.name, predict(test.data));
}
