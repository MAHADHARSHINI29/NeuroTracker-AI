import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Brain, Calendar, Plus, AlertTriangle, TrendingUp, Droplets } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { getEntries, getPredictions, getProfile } from '@/lib/storage';
import { generateInsights, checkRiskAlerts } from '@/lib/prediction';
import type { HeadacheEntry, PredictionResult } from '@/types/headache';
import { supabase } from '@/lib/supabase';
import { HEADACHE_TYPE_LABELS } from '@/types/headache';
import type { HeadLocation, PainType, Symptom, RiskLevel, HeadacheType } from '@/types/headache';

export default function Dashboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<HeadacheEntry[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    const fetchEntries = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth?mode=login');
        return;
      }
      setUserName(session.user.user_metadata?.full_name || 'User');

      const { data: dbData, error } = await supabase
        .from('headache_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entries:', error);
        return;
      }

      if (dbData) {
        const mappedEntries: HeadacheEntry[] = dbData.map(row => ({
          id: row.id,
          user_id: row.user_id,
          date: (row.created_at || new Date().toISOString()).split('T')[0],
          time: new Date(row.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          intensity: row.intensity,
          location: (row.location?.toLowerCase().includes('front') ? 'front' : 
                     row.location?.toLowerCase().includes('side') ? 'side' : 
                     row.location?.toLowerCase().includes('back') ? 'back' : 'whole') as HeadLocation,
          pain_type: (row.character?.toLowerCase().includes('throbbing') ? 'throbbing' : 
                      row.character?.toLowerCase().includes('stabbing') ? 'stabbing' : 'pressure') as PainType,
          duration_minutes: (row.duration || 1) * 60,
          symptoms: [
            ...(row.nausea ? ['nausea'] : []),
            ...(row.vomiting ? ['vomiting'] : []),
            ...(row.photophobia ? ['light_sensitivity'] : []),
            ...(row.phonophobia ? ['sound_sensitivity'] : []),
            ...(row.visual_aura ? ['visual_aura'] : []),
          ] as Symptom[],
          sleep_hours: row.age || 7, // Fallback
          stress_level: 5,
          hydration_level: 5,
          screen_time: 5,
          triggers: [],
          created_at: row.created_at
        }));

        const mappedPredictions: PredictionResult[] = dbData.map(row => ({
          id: row.id + '_pred',
          entry_id: row.id,
          predicted_type: row.predicted_type as HeadacheType,
          confidence: row.confidence || 0.8,
          detected_triggers: [],
          risk_level: (row.risk_level?.toLowerCase() || 'low') as RiskLevel,
          recommendations: []
        }));

        setEntries(mappedEntries);
        setPredictions(mappedPredictions);
      }
    };
    fetchEntries();
  }, [navigate]);

  const alerts = checkRiskAlerts(entries);
  const insights = generateInsights(entries);
  const avgSeverity = entries.length > 0
    ? (entries.reduce((s, e) => s + e.intensity, 0) / entries.length).toFixed(1)
    : '—';
  const daysSinceLast = entries.length > 0
    ? Math.floor((Date.now() - new Date(entries[0].date).getTime()) / 86400000)
    : null;

  const recentEntries = entries.slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              Welcome back, {userName} 👋
            </h1>
            <p className="text-muted-foreground mt-1">Here's your headache overview</p>
          </div>
          <Link to="/tracker">
            <Button className="gradient-primary border-0">
              <Plus className="h-4 w-4 mr-1" /> Log Headache
            </Button>
          </Link>
        </div>

        {/* Risk Alerts */}
        {alerts.map((alert, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">{alert}</p>
          </motion.div>
        ))}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Activity, label: 'Total Logged', value: entries.length.toString(), color: 'text-primary' },
            { icon: TrendingUp, label: 'Avg Severity', value: `${avgSeverity}/10`, color: 'text-warning' },
            { icon: Calendar, label: 'Days Since Last', value: daysSinceLast !== null ? daysSinceLast.toString() : '—', color: 'text-success' },
            { icon: Brain, label: 'Predictions', value: predictions.length.toString(), color: 'text-accent' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="p-4 md:p-6">
                  <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                  <p className="text-2xl font-bold font-display">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div>
            <h2 className="font-display font-semibold text-lg mb-3">Personal Insights</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {insights.map((insight, i) => (
                <Card key={i} className={`border-l-4 ${
                  insight.type === 'warning' ? 'border-l-warning' :
                  insight.type === 'success' ? 'border-l-success' : 'border-l-info'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{insight.icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{insight.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Entries */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-lg">Recent Entries</h2>
            {entries.length > 5 && (
              <Link to="/analytics">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            )}
          </div>

          {recentEntries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Droplets className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No headache entries yet.</p>
                <Link to="/tracker">
                  <Button className="mt-4" variant="outline" size="sm">Log Your First Headache</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentEntries.map((entry) => {
                const pred = predictions.find(p => p.entry_id === entry.id);
                return (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground ${
                          entry.intensity >= 8 ? 'bg-destructive' :
                          entry.intensity >= 5 ? 'bg-warning' : 'bg-success'
                        }`}>
                          {entry.intensity}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {pred ? (HEADACHE_TYPE_LABELS[pred.predicted_type as keyof typeof HEADACHE_TYPE_LABELS] || pred.predicted_type) : 'Headache Entry'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()} · {entry.duration_minutes}min · {entry.location}
                          </p>
                        </div>
                      </div>
                      {pred && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          pred.risk_level === 'severe' ? 'bg-destructive/10 text-destructive' :
                          pred.risk_level === 'high' ? 'bg-warning/10 text-warning' :
                          pred.risk_level === 'moderate' ? 'bg-info/10 text-info' :
                          'bg-success/10 text-success'
                        }`}>
                          {pred.confidence}% confidence
                        </span>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
