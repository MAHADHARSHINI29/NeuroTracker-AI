import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, CheckCircle, ArrowRight, Lightbulb, Loader2, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

export default function PredictionResults() {
  const { entryId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('headache_history')
          .select('*')
          .eq('id', entryId)
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;
        setData(data);
      } catch (error) {
        console.error('Error fetching prediction:', error);
      } finally {
        setLoading(false);
      }
    };
    if (entryId) fetchData();
  }, [entryId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Analyzing your results...</p>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Prediction not found.</p>
          <Link to="/tracker"><Button className="mt-4">Back to Tracker</Button></Link>
        </div>
      </Layout>
    );
  }

  const typeDescriptions: Record<string, string> = {
    'Migraine with aura': 'Migraines with aura involve visual disturbances like flashing lights or blind spots before the headache begins.',
    'Migraine without aura': 'Migraines without aura feature moderate-to-severe throbbing pain, often with nausea and sensitivity to light or sound.',
    'Tension-type headache': 'Tension headaches cause a dull, aching sensation with pressure around the forehead or back of the head.',
    'Cluster headache': 'Cluster headaches are extremely painful, occurring in cyclical patterns with severe pain around one eye.',
  };

  const riskColors: Record<string, string> = {
    low: 'bg-green-500/10 text-green-500 border-green-500/30',
    moderate: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    high: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    severe: 'bg-red-500/10 text-red-500 border-red-500/30',
  };

  const xaiData = data.xai_factors ? Object.entries(data.xai_factors).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value: Math.abs(value as number),
    original: value
  })).sort((a, b) => b.value - a.value) : [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center gradient-primary rounded-full p-4 mb-4"
          >
            <Brain className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">AI Neuro-Analysis Complete</h1>
          <p className="text-muted-foreground mt-1">
            Processed via <Badge variant="secondary" className="ml-1">{data.algorithm_used || 'SVM'}</Badge> engine
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Predicted Type */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1 uppercase font-bold tracking-wider">Primary Diagnosis Forecast</p>
                  <h2 className="font-display text-3xl font-bold text-primary mb-3">
                    {data.predicted_type}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {typeDescriptions[data.predicted_type] || 'Consult a specialist for more information.'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Explainable AI (XAI) Factors */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    Explainable AI (XAI) Insights
                    <Badge variant="outline" className="text-[10px] uppercase">Clinical Transparency</Badge>
                  </CardTitle>
                  <CardDescription>Factors that most influenced this specific prediction.</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px]">
                  {xaiData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={xaiData} layout="vertical" margin={{ left: 20, right: 30 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-2 border rounded-lg shadow-sm text-xs">
                                  <p className="font-bold">{payload[0].payload.name}</p>
                                  <p>Contribution: {payload[0].value}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                          {xaiData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.original > 0 ? '#3b82f6' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Info className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-sm italic">Feature importance analysis not available for this entry.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            {/* Confidence Score */}
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">Model Confidence</p>
                <div className="relative w-24 h-24 mx-auto mb-2">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle cx="50" cy="50" r="40" stroke="currentColor" className="text-secondary/20" strokeWidth="10" fill="none" />
                    <circle cx="50" cy="50" r="40" stroke="currentColor" className="text-primary" strokeWidth="10" fill="none"
                      strokeDasharray={`${(data.confidence || 0) * 2.51} 251`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-xl">
                    {Math.round(data.confidence || 0)}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-tighter">Reliability Index</p>
              </CardContent>
            </Card>

            {/* Risk Level */}
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">Risk Level</p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold mb-2 ${riskColors[data.risk_level] || riskColors.low}`}>
                  {data.risk_level === 'high' || data.risk_level === 'severe' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {data.risk_level?.toUpperCase() || 'LOW'}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter shrink-0">Priority Assessment</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommendations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  Consult a doctor to verify this AI analysis.
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  Continue logging your headaches to improve accuracy.
                </li>
                {data.intensity > 7 && (
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    High intensity noted. Seek immediate medical attention if pain worsens.
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/analytics" className="flex-1">
            <Button variant="outline" className="w-full">
              View Analytics <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link to="/tracker" className="flex-1">
            <Button className="w-full gradient-primary border-0">
              Log Another
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
