export type HeadLocation = 'front' | 'side' | 'back' | 'whole';
export type PainType = 'throbbing' | 'pressure' | 'stabbing';
export type Symptom = 'nausea' | 'vomiting' | 'light_sensitivity' | 'sound_sensitivity' | 'visual_aura';
export type Trigger = 'lack_of_sleep' | 'dehydration' | 'stress' | 'weather_change';

export interface HeadacheEntry {
  id: string;
  user_id: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  date: string;
  time?: string;
  intensity: number;
  location: HeadLocation;
  pain_type: PainType;
  duration_minutes: number;
  symptoms: Symptom[];
  sleep_hours: number;
  stress_level: number;
  hydration_level: number;
  screen_time: number;
  triggers: Trigger[];
  predicted_type?: string;
  confidence?: number;
  risk_level?: RiskLevel;
  algorithm_used?: string;
  xai_factors?: Record<string, number>;
  created_at: string;
}

export type HeadacheType = 'migraine_with_aura' | 'migraine_without_aura' | 'tension' | 'cluster' | string;

export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe';

export interface PredictionResult {
  id: string;
  entry_id: string;
  predicted_type: HeadacheType;
  confidence: number;
  xai_factors: Record<string, number>;
  algorithm_used: AlgorithmType;
  risk_level: RiskLevel;
  recommendations: string[];
}

export type AlgorithmType = 'SVM' | 'Random Forest' | 'Logistic Regression' | 'KNN';

export interface MLModelMetrics {
  id: string;
  name: AlgorithmType;
  accuracy: number;
  precision_score: number;
  recall_score: number;
  f1_score: number;
  confusion_matrix: number[][];
  last_trained: string;
}

export interface RiskPrediction {
  id: string;
  user_id: string;
  prediction_date: string;
  risk_score: number;
  risk_level: RiskLevel;
  top_triggers: string[];
  recommendations: string[];
}

export interface Insight {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success';
}

export const HEADACHE_TYPE_LABELS: Record<string, string> = {
  migraine_with_aura: 'Migraine with Aura',
  migraine_without_aura: 'Migraine without Aura',
  tension: 'Tension Headache',
  cluster: 'Cluster Headache',
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: 'Low Risk',
  moderate: 'Moderate Risk',
  high: 'High Risk',
  severe: 'Severe Risk',
};

export const SYMPTOM_LABELS: Record<Symptom, string> = {
  nausea: 'Nausea',
  vomiting: 'Vomiting',
  light_sensitivity: 'Light Sensitivity',
  sound_sensitivity: 'Sound Sensitivity',
  visual_aura: 'Visual Aura',
};

export const TRIGGER_LABELS: Record<Trigger, string> = {
  lack_of_sleep: 'Lack of Sleep',
  dehydration: 'Dehydration',
  stress: 'Stress',
  weather_change: 'Weather Change',
};

export const LOCATION_LABELS: Record<HeadLocation, string> = {
  front: 'Front',
  side: 'Side',
  back: 'Back',
  whole: 'Whole Head',
};

export const PAIN_TYPE_LABELS: Record<PainType, string> = {
  throbbing: 'Throbbing',
  pressure: 'Pressure',
  stabbing: 'Stabbing',
};
