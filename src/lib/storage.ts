import type { HeadacheEntry, PredictionResult } from '@/types/headache';

const ENTRIES_KEY = 'neurotrack_entries';
const PREDICTIONS_KEY = 'neurotrack_predictions';

export function getEntries(): HeadacheEntry[] {
  const data = localStorage.getItem(ENTRIES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveEntry(entry: HeadacheEntry): void {
  const entries = getEntries();
  entries.push(entry);
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function deleteEntry(id: string): void {
  const entries = getEntries().filter(e => e.id !== id);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  const preds = getPredictions().filter(p => p.entry_id !== id);
  localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(preds));
}

export function getPredictions(): PredictionResult[] {
  const data = localStorage.getItem(PREDICTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function savePrediction(prediction: PredictionResult): void {
  const preds = getPredictions();
  preds.push(prediction);
  localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(preds));
}

export function getProfile() {
  const data = localStorage.getItem('neurotrack_profile');
  return data ? JSON.parse(data) : { name: 'User', email: '' };
}

export function saveProfile(profile: { name: string; email: string }) {
  localStorage.setItem('neurotrack_profile', JSON.stringify(profile));
}
