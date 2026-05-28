import type { HeadacheEntry, PredictionResult, HeadacheType, RiskLevel } from '@/types/headache';

interface TypeScore {
  type: HeadacheType;
  score: number;
}

export function predictHeadacheType(entry: HeadacheEntry): PredictionResult {
  const scores: TypeScore[] = [
    { type: 'migraine_with_aura', score: scoreMigraineWithAura(entry) },
    { type: 'migraine_without_aura', score: scoreMigraineWithoutAura(entry) },
    { type: 'tension', score: scoreTension(entry) },
    { type: 'cluster', score: scoreCluster(entry) },
  ];

  scores.sort((a, b) => b.score - a.score);
  const top = scores[0];
  const totalScore = scores.reduce((s, t) => s + t.score, 0);
  const confidence = totalScore > 0 ? Math.round((top.score / totalScore) * 100) : 25;

  const detectedTriggers = detectTriggers(entry);
  const riskLevel = assessRisk(entry, confidence);
  const recommendations = generateRecommendations(top.type, riskLevel, detectedTriggers);

  return {
    id: crypto.randomUUID(),
    entry_id: entry.id,
    predicted_type: top.type,
    confidence: Math.min(confidence, 95),
    detected_triggers: detectedTriggers,
    risk_level: riskLevel,
    recommendations,
  };
}

function scoreMigraineWithAura(e: HeadacheEntry): number {
  let s = 0;
  if (e.symptoms.includes('visual_aura')) s += 35;
  if (e.pain_type === 'throbbing') s += 20;
  if (e.symptoms.includes('light_sensitivity')) s += 15;
  if (e.symptoms.includes('nausea')) s += 10;
  if (e.intensity >= 7) s += 10;
  if (e.location === 'side') s += 10;
  return s;
}

function scoreMigraineWithoutAura(e: HeadacheEntry): number {
  let s = 0;
  if (e.pain_type === 'throbbing') s += 25;
  if (e.symptoms.includes('nausea')) s += 20;
  if (e.symptoms.includes('light_sensitivity')) s += 15;
  if (e.symptoms.includes('sound_sensitivity')) s += 15;
  if (!e.symptoms.includes('visual_aura')) s += 10;
  if (e.intensity >= 6) s += 10;
  if (e.location === 'side') s += 5;
  return s;
}

function scoreTension(e: HeadacheEntry): number {
  let s = 0;
  if (e.pain_type === 'pressure') s += 30;
  if (e.location === 'whole' || e.location === 'front') s += 20;
  if (e.intensity <= 5) s += 20;
  if (e.stress_level >= 7) s += 15;
  if (!e.symptoms.includes('nausea')) s += 10;
  if (!e.symptoms.includes('visual_aura')) s += 5;
  return s;
}

function scoreCluster(e: HeadacheEntry): number {
  let s = 0;
  if (e.pain_type === 'stabbing') s += 30;
  if (e.location === 'side') s += 20;
  if (e.intensity >= 8) s += 20;
  if (e.duration_minutes <= 180) s += 15;
  if (e.duration_minutes <= 60) s += 10;
  return s;
}

function detectTriggers(e: HeadacheEntry): string[] {
  const triggers: string[] = [];
  if (e.sleep_hours < 6) triggers.push('Poor sleep (less than 6 hours)');
  if (e.hydration_level < 4) triggers.push('Low hydration levels');
  if (e.stress_level >= 7) triggers.push('High stress levels');
  if (e.screen_time > 8) triggers.push('Excessive screen time');
  e.triggers.forEach(t => {
    const labels: Record<string, string> = {
      lack_of_sleep: 'Lack of sleep',
      dehydration: 'Dehydration',
      stress: 'Stress',
      weather_change: 'Weather change',
    };
    if (labels[t] && !triggers.some(x => x.toLowerCase().includes(t.replace('_', ' ')))) {
      triggers.push(labels[t]);
    }
  });
  return triggers;
}

function assessRisk(e: HeadacheEntry, confidence: number): RiskLevel {
  let riskScore = 0;
  riskScore += e.intensity * 2;
  if (e.symptoms.length >= 3) riskScore += 15;
  if (e.duration_minutes > 240) riskScore += 10;
  if (e.symptoms.includes('visual_aura')) riskScore += 5;
  if (confidence > 70) riskScore += 5;

  if (riskScore >= 35) return 'severe';
  if (riskScore >= 25) return 'high';
  if (riskScore >= 15) return 'moderate';
  return 'low';
}

function generateRecommendations(type: HeadacheType, risk: RiskLevel, triggers: string[]): string[] {
  const recs: string[] = [];

  if (risk === 'severe' || risk === 'high') {
    recs.push('Consider consulting a neurologist for professional evaluation.');
  }

  if (triggers.some(t => t.toLowerCase().includes('sleep'))) {
    recs.push('Aim for 7-9 hours of quality sleep per night.');
  }
  if (triggers.some(t => t.toLowerCase().includes('hydration'))) {
    recs.push('Increase daily water intake to at least 8 glasses.');
  }
  if (triggers.some(t => t.toLowerCase().includes('stress'))) {
    recs.push('Practice stress-reduction techniques like meditation or deep breathing.');
  }
  if (triggers.some(t => t.toLowerCase().includes('screen'))) {
    recs.push('Take regular breaks from screens using the 20-20-20 rule.');
  }

  if (type === 'migraine_with_aura' || type === 'migraine_without_aura') {
    recs.push('Keep a detailed migraine diary to identify additional triggers.');
  }
  if (type === 'tension') {
    recs.push('Consider neck and shoulder stretches throughout the day.');
  }
  if (type === 'cluster') {
    recs.push('Cluster headaches may benefit from oxygen therapy — ask your doctor.');
  }

  return recs.slice(0, 5);
}

export function generateInsights(entries: HeadacheEntry[]) {
  if (entries.length < 2) return [];

  const insights: { icon: string; title: string; description: string; type: 'info' | 'warning' | 'success' }[] = [];

  // Sleep correlation
  const lowSleepEntries = entries.filter(e => e.sleep_hours < 6);
  if (lowSleepEntries.length > entries.length * 0.3) {
    const avgIntensity = lowSleepEntries.reduce((s, e) => s + e.intensity, 0) / lowSleepEntries.length;
    insights.push({
      icon: '😴',
      title: 'Sleep & Headache Link',
      description: `${Math.round(lowSleepEntries.length / entries.length * 100)}% of your headaches occur with less than 6 hours of sleep. Average intensity: ${avgIntensity.toFixed(1)}/10.`,
      type: 'warning',
    });
  }

  // Screen time correlation
  const highScreenEntries = entries.filter(e => e.screen_time > 8);
  if (highScreenEntries.length > entries.length * 0.3) {
    insights.push({
      icon: '📱',
      title: 'Screen Time Impact',
      description: `High screen time (>8hrs) correlates with ${Math.round(highScreenEntries.length / entries.length * 100)}% of your headaches.`,
      type: 'warning',
    });
  }

  // Stress correlation
  const highStressEntries = entries.filter(e => e.stress_level >= 7);
  if (highStressEntries.length > entries.length * 0.3) {
    insights.push({
      icon: '🧠',
      title: 'Stress Connection',
      description: `Stress levels ≥7 are present in ${Math.round(highStressEntries.length / entries.length * 100)}% of your headache episodes.`,
      type: 'info',
    });
  }

  // Improving trend
  if (entries.length >= 4) {
    const recent = entries.slice(-Math.ceil(entries.length / 2));
    const older = entries.slice(0, Math.floor(entries.length / 2));
    const recentAvg = recent.reduce((s, e) => s + e.intensity, 0) / recent.length;
    const olderAvg = older.reduce((s, e) => s + e.intensity, 0) / older.length;
    if (recentAvg < olderAvg - 1) {
      insights.push({
        icon: '📉',
        title: 'Improving Trend',
        description: `Your average headache intensity has decreased from ${olderAvg.toFixed(1)} to ${recentAvg.toFixed(1)}. Keep it up!`,
        type: 'success',
      });
    }
  }

  return insights;
}

export function checkRiskAlerts(entries: HeadacheEntry[]): string[] {
  const alerts: string[] = [];
  if (entries.length < 1) return alerts;

  // Check frequency in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentEntries = entries.filter(e => new Date(e.date) >= thirtyDaysAgo);

  if (recentEntries.length >= 15) {
    alerts.push('⚠️ Very high headache frequency detected (15+ in 30 days). Please consult a neurologist immediately.');
  } else if (recentEntries.length >= 8) {
    alerts.push('⚠️ High headache frequency detected. Consider consulting a neurologist.');
  }

  // Check high severity trend
  const highSeverity = recentEntries.filter(e => e.intensity >= 8);
  if (highSeverity.length >= 3) {
    alerts.push('🔴 Multiple severe headaches detected recently. Medical evaluation recommended.');
  }

  return alerts;
}
