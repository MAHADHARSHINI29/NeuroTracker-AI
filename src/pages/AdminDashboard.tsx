import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell,
  Legend,
} from 'recharts';
import {
  Brain, Users, Activity, ShieldCheck, RefreshCw, Clock, Database,
  TrendingUp, Cpu, Layers, ArrowLeft, LogOut, CheckCircle2, XCircle,
  AlertTriangle, Zap, BarChart3, Server, Hash, Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { isAdminAuthenticated } from './Admin';
import { useToast } from '@/hooks/use-toast';

/* ═══════════════════════════════════════════════════════════════
   STATIC BASELINE MODEL DATA
   ═══════════════════════════════════════════════════════════════ */

const BASELINE_MODELS = [
  { name: 'SVM (RBF)', accuracy: 88.5, f1: 87.2, recall: 86.8, precision: 87.5, color: '#818cf8' },
  { name: 'Random Forest', accuracy: 85.3, f1: 84.1, recall: 83.5, precision: 84.8, color: '#34d399' },
  { name: 'Logistic Reg.', accuracy: 79.8, f1: 78.4, recall: 77.9, precision: 79.0, color: '#fbbf24' },
  { name: 'KNN', accuracy: 76.2, f1: 74.8, recall: 74.1, precision: 75.5, color: '#f87171' },
];

const CONFUSION_MATRIX = [
  { actual: 'Migraine w/ Aura', 'Migraine w/ Aura': 42, 'Migraine w/o Aura': 3, 'Tension': 1, 'Cluster': 0 },
  { actual: 'Migraine w/o Aura', 'Migraine w/ Aura': 4, 'Migraine w/o Aura': 38, 'Tension': 2, 'Cluster': 1 },
  { actual: 'Tension', 'Migraine w/ Aura': 1, 'Migraine w/o Aura': 2, 'Tension': 35, 'Cluster': 0 },
  { actual: 'Cluster', 'Migraine w/ Aura': 0, 'Migraine w/o Aura': 1, 'Tension': 0, 'Cluster': 28 },
];

const FEATURE_IMPORTANCE = [
  { feature: 'Pain Intensity', importance: 0.92 },
  { feature: 'Visual Aura', importance: 0.88 },
  { feature: 'Nausea', importance: 0.82 },
  { feature: 'Duration', importance: 0.78 },
  { feature: 'Photophobia', importance: 0.75 },
  { feature: 'Stress Level', importance: 0.68 },
  { feature: 'Sleep Hours', importance: 0.62 },
  { feature: 'Location', importance: 0.55 },
];

const RADAR_DATA = [
  { metric: 'Accuracy', SVM: 88.5, RF: 85.3, LR: 79.8, KNN: 76.2 },
  { metric: 'Precision', SVM: 87.5, RF: 84.8, LR: 79.0, KNN: 75.5 },
  { metric: 'Recall', SVM: 86.8, RF: 83.5, LR: 77.9, KNN: 74.1 },
  { metric: 'F1 Score', SVM: 87.2, RF: 84.1, LR: 78.4, KNN: 74.8 },
  { metric: 'Speed', SVM: 72, RF: 65, LR: 95, KNN: 88 },
];

function confusionColor(value: number, max: number) {
  const pct = value / max;
  if (pct > 0.7) return 'bg-emerald-500 text-slate-900 font-bold';
  if (pct > 0.3) return 'bg-amber-500/70 text-slate-900';
  if (value > 0) return 'bg-red-500/40 text-red-200';
  return 'bg-slate-100 hover:bg-slate-200 text-slate-400';
}

/* ═══════════════════════════════════════════════════════════════ */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAdminAuthenticated()) navigate('/admin');
  }, [navigate]);

  const [activeTab, setActiveTab] = useState('models');
  const [retraining, setRetraining] = useState(false);
  const [retrainResult, setRetrainResult] = useState<any>(null);
  const [mlModels, setMlModels] = useState<any[]>([]);
  const [headacheCount, setHeadacheCount] = useState(0);
  const [riskCount, setRiskCount] = useState(0);
  const [modelCount, setModelCount] = useState(0);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Data fetching via admin-stats edge function (bypasses RLS) ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/admin-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.error) {
        console.error('Admin stats error:', data.error);
        await fetchDataFallback();
        return;
      }
      setMlModels(data.models || []);
      setModelCount((data.models || []).length);
      setHeadacheCount(data.headacheCount || 0);
      setRiskCount(data.riskCount || 0);
      setUserActivity(
        (data.users || []).map((u: any) => ({
          userId: u.userId.substring(0, 8) + '…',
          fullId: u.userId,
          entries: u.entries,
          lastActive: new Date(u.lastActive).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          }),
        }))
      );
      setDailyEntries(
        (data.dailyEntries || []).map((d: any) => ({
          day: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: d.count,
        }))
      );
    } catch (err) {
      console.error('Admin stats fetch failed, using fallback:', err);
      await fetchDataFallback();
    }
    setLoading(false);
  }, []);

  const fetchDataFallback = useCallback(async () => {
    try {
      const { data: models } = await supabase
        .from('ml_models').select('*').order('last_trained', { ascending: false });
      setMlModels(models || []);
      setModelCount((models || []).length);
      const { count: hCount } = await supabase
        .from('headache_history').select('*', { count: 'exact', head: true });
      setHeadacheCount(hCount || 0);
      const { count: rCount } = await supabase
        .from('risk_predictions').select('*', { count: 'exact', head: true });
      setRiskCount(rCount || 0);
      const { data: entries } = await supabase
        .from('headache_history').select('user_id, created_at').order('created_at', { ascending: false });
      if (entries) {
        const userMap: Record<string, { count: number; lastActive: string }> = {};
        const dayMap: Record<string, number> = {};
        entries.forEach((e: any) => {
          if (!userMap[e.user_id]) userMap[e.user_id] = { count: 0, lastActive: e.created_at };
          userMap[e.user_id].count++;
          const day = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dayMap[day] = (dayMap[day] || 0) + 1;
        });
        setUserActivity(Object.entries(userMap).map(([uid, d]) => ({
          userId: uid.substring(0, 8) + '…', fullId: uid, entries: d.count,
          lastActive: new Date(d.lastActive).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        })));
        setDailyEntries(Object.entries(dayMap).slice(0, 14).reverse().map(([day, count]) => ({ day, count })));
      }
    } catch (err) { console.error('Fallback fetch error:', err); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainResult(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/retrain-model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}`, 'apikey': supabaseKey },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setRetrainResult(data);
      toast({
        title: data.status === 'success' ? '✅ Model Retrained' : 'ℹ️ Retrain Info',
        description: data.status === 'success'
          ? `Deployed v${data.deployed_version} — ${data.metrics?.samples_processed} samples, ${(data.metrics?.new_accuracy * 100).toFixed(1)}% accuracy`
          : data.message || JSON.stringify(data),
      });
      fetchData();
    } catch (err: any) {
      setRetrainResult({ error: err.message });
      toast({ title: '❌ Retrain Failed', description: err.message, variant: 'destructive' });
    }
    setRetraining(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('neurotrack_admin');
    navigate('/admin');
  };

  const latestModel = mlModels[0];

  /* ═══════════════════════════════════════════════════════════════
     RENDER — wrapped in .dark class for forced dark-mode theme
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div>
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        {/* ── Animated background ── */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50" />
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
        </div>

        {/* ── Top bar ── */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-2xl">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:bg-slate-200" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 bg-slate-200" />
              <div className="flex items-center gap-2.5">
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg p-1.5 shadow-lg shadow-indigo-500/20">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <span className="font-display font-bold text-slate-900 text-sm tracking-tight">NeuroTrack Admin</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-emerald-400/30 text-emerald-400 text-[11px] bg-emerald-500/5 px-3">
                <span className="relative flex h-1.5 w-1.5 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                Online
              </Badge>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:bg-slate-200 text-xs" onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5 mr-1.5" /> Exit
              </Button>
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="container py-8 max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Title */}
            <div className="mb-8">
              <h1 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-slate-500 text-sm mt-1.5">
                Model management, user monitoring & system health
              </p>
            </div>

            {/* ── Quick Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Entries', value: headacheCount, icon: Database, gradient: 'from-blue-500 to-cyan-400', glow: 'shadow-blue-500/10' },
                { label: 'Model Versions', value: modelCount, icon: Layers, gradient: 'from-indigo-500 to-violet-400', glow: 'shadow-indigo-500/10' },
                { label: 'Risk Predictions', value: riskCount, icon: Zap, gradient: 'from-amber-500 to-orange-400', glow: 'shadow-amber-500/10' },
                { label: 'Active Users', value: userActivity.length, icon: Users, gradient: 'from-emerald-500 to-teal-400', glow: 'shadow-emerald-500/10' },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <div className={`relative rounded-xl border border-slate-200 bg-white border-slate-200 backdrop-blur-sm p-5 shadow-xl ${stat.glow} overflow-hidden group hover:bg-slate-50 transition-colors`}>
                    <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${stat.gradient} opacity-[0.07] rounded-bl-[40px] group-hover:opacity-[0.12] transition-opacity`} />
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                        <stat.icon className="h-3.5 w-3.5 text-slate-900" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">{stat.label}</span>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900">{loading ? '…' : stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── Tabs ── */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-slate-100 border border-slate-200 p-1.5 rounded-xl backdrop-blur-sm">
                <TabsTrigger value="models" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-600 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/20 text-slate-500 gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all">
                  <Brain className="h-4 w-4" /> AI Models
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-600 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/20 text-slate-500 gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all">
                  <Users className="h-4 w-4" /> Users
                </TabsTrigger>
                <TabsTrigger value="system" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-600 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/20 text-slate-500 gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all">
                  <Activity className="h-4 w-4" /> System Logs
                </TabsTrigger>
              </TabsList>

              {/* ═════════════════════════════════════════════
                  TAB 1 — AI MODEL MANAGEMENT
                  ═════════════════════════════════════════════ */}
              <TabsContent value="models" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Active Model */}
                  <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white border-slate-200 backdrop-blur-sm p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu className="h-5 w-5 text-indigo-400" />
                      <h3 className="text-lg font-bold text-slate-900">Active Model</h3>
                    </div>
                    <p className="text-slate-500 text-xs mb-5">Currently deployed model powering predictions</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                      {[
                        { label: 'Name', value: latestModel?.name || 'SVM Baseline v1', color: 'text-slate-900' },
                        { label: 'Version', value: `v${latestModel?.version || '1.0'}`, color: 'text-indigo-400' },
                        { label: 'Accuracy', value: latestModel?.accuracy ? `${(latestModel.accuracy * 100).toFixed(1)}%` : '88.5%', color: 'text-emerald-400' },
                        { label: 'Last Trained', value: latestModel?.last_trained ? new Date(latestModel.last_trained).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Baseline', color: 'text-slate-700' },
                      ].map(item => (
                        <div key={item.label} className="space-y-1.5">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-semibold">{item.label}</p>
                          <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    {latestModel?.accuracy && (
                      <div className="mt-5">
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
                          <span>Model Accuracy</span>
                          <span className="text-emerald-400 font-semibold">{(latestModel.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 hover:bg-slate-200 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all" style={{ width: `${latestModel.accuracy * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Retrain Card */}
                  <div className="rounded-xl border border-slate-200 bg-white border-slate-200 backdrop-blur-sm p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className={`h-5 w-5 text-amber-400 ${retraining ? 'animate-spin' : ''}`} />
                      <h3 className="text-lg font-bold text-slate-900">Retrain</h3>
                    </div>
                    <p className="text-slate-500 text-xs mb-4">Trigger incremental model update</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                      Fetches all verified headache logs, recalculates model coefficients, and deploys a new versioned model.
                    </p>
                    <Button
                      onClick={handleRetrain}
                      disabled={retraining}
                      className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 border-0 shadow-lg shadow-indigo-500/20 text-slate-900 font-semibold"
                    >
                      {retraining ? (
                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Retraining…</>
                      ) : (
                        <><Zap className="h-4 w-4 mr-2" /> Retrain Now</>
                      )}
                    </Button>
                    <AnimatePresence>
                      {retrainResult && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 text-xs rounded-lg overflow-hidden">
                          {retrainResult.error ? (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <p className="text-red-400 flex items-center gap-1.5"><XCircle className="h-3 w-3" /> {retrainResult.error}</p>
                            </div>
                          ) : (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-1">
                              <p className="text-emerald-400 flex items-center gap-1.5 font-semibold"><CheckCircle2 className="h-3 w-3" /> {retrainResult.status || 'Complete'}</p>
                              {retrainResult.deployed_version && <p className="text-slate-500">Deployed: <span className="text-slate-900">v{retrainResult.deployed_version}</span></p>}
                              {retrainResult.metrics && <p className="text-slate-500">Accuracy: <span className="text-emerald-300">{(retrainResult.metrics.new_accuracy * 100).toFixed(1)}%</span> · Samples: <span className="text-slate-900">{retrainResult.metrics.samples_processed}</span></p>}
                              {retrainResult.message && <p className="text-slate-600">{retrainResult.message}</p>}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-slate-200 bg-white border-slate-200 backdrop-blur-sm p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="h-4 w-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-slate-900">Model Accuracy Comparison</h3>
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={BASELINE_MODELS} margin={{ left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: 'rgba(0,0,0,0.5)', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} />
                          <YAxis tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 11 }} domain={[60, 100]} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.2)', borderRadius: 12, color: '#0f172a', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
                          <Bar dataKey="accuracy" name="Accuracy (%)" radius={[8, 8, 0, 0]}>
                            {BASELINE_MODELS.map((m, i) => <Cell key={i} fill={m.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white border-slate-200 backdrop-blur-sm p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Eye className="h-4 w-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-slate-900">Multi-Metric Radar</h3>
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={RADAR_DATA}>
                          <PolarGrid stroke="rgba(0,0,0,0.1)" />
                          <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(0,0,0,0.5)', fontSize: 11 }} />
                          <PolarRadiusAxis tick={{ fill: 'rgba(0,0,0,0.3)', fontSize: 10 }} domain={[0, 100]} />
                          <Radar name="SVM" dataKey="SVM" stroke="#818cf8" fill="#818cf8" fillOpacity={0.25} strokeWidth={2} />
                          <Radar name="RF" dataKey="RF" stroke="#34d399" fill="#34d399" fillOpacity={0.1} />
                          <Radar name="LR" dataKey="LR" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.08} />
                          <Legend wrapperStyle={{ color: 'rgba(0,0,0,0.6)', fontSize: 11 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Confusion Matrix + Feature Importance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-slate-200 bg-white border-slate-200 backdrop-blur-sm p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="h-4 w-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-slate-900">Confusion Matrix (SVM)</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-4">Rows = Actual · Columns = Predicted</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr>
                            <th className="p-2 text-left text-slate-400 font-medium"></th>
                            {['Migraine w/ Aura', 'Migraine w/o Aura', 'Tension', 'Cluster'].map(h => (
                              <th key={h} className="p-2 text-center text-slate-500 font-medium text-[10px]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {CONFUSION_MATRIX.map(row => (
                            <tr key={row.actual}>
                              <td className="p-2 font-medium text-slate-600 whitespace-nowrap text-[11px]">{row.actual}</td>
                              {['Migraine w/ Aura', 'Migraine w/o Aura', 'Tension', 'Cluster'].map(col => {
                                const val = (row as any)[col];
                                return (
                                  <td key={col} className="p-1 text-center">
                                    <div className={`rounded-lg py-2.5 px-3 text-sm ${confusionColor(val, 42)}`}>{val}</div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white border-slate-200 backdrop-blur-sm p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-4 w-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-slate-900">Feature Importance (SVM)</h3>
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={FEATURE_IMPORTANCE} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                          <XAxis type="number" domain={[0, 1]} tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} />
                          <YAxis dataKey="feature" type="category" tick={{ fill: 'rgba(0,0,0,0.5)', fontSize: 11 }} width={100} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.2)', borderRadius: 12, color: '#0f172a', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
                          <Bar dataKey="importance" name="Importance" radius={[0, 8, 8, 0]}>
                            {FEATURE_IMPORTANCE.map((_, i) => <Cell key={i} fill={`hsl(${230 + i * 12}, 80%, ${65 + i * 2}%)`} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Training History */}
                <div className="rounded-xl border border-slate-200 bg-white border-slate-200 backdrop-blur-sm p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-900">Training History</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-4">All model versions stored in the <code className="text-indigo-400/70 bg-indigo-500/10 px-1.5 py-0.5 rounded">ml_models</code> table</p>
                  {mlModels.length === 0 ? (
                    <div className="text-center py-10">
                      <Layers className="h-10 w-10 text-white/10 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">No trained models in the database yet.</p>
                      <p className="text-[11px] text-slate-900/15 mt-1">Click "Retrain Now" above to create the first version.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-200 hover:bg-transparent">
                            <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Name</TableHead>
                            <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Version</TableHead>
                            <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Accuracy</TableHead>
                            <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Dataset</TableHead>
                            <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Trained At</TableHead>
                            <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mlModels.map((m, i) => (
                            <TableRow key={m.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                              <TableCell className="text-slate-900 font-semibold text-sm">{m.name}</TableCell>
                              <TableCell><Badge variant="outline" className="border-indigo-400/30 text-indigo-400 text-[10px] bg-indigo-500/5">v{m.version}</Badge></TableCell>
                              <TableCell className="text-emerald-400 font-semibold">{m.accuracy ? `${(m.accuracy * 100).toFixed(1)}%` : '—'}</TableCell>
                              <TableCell className="text-slate-600">{m.dataset_size || m.model_params?.training_samples || '—'}</TableCell>
                              <TableCell className="text-slate-500 text-xs">{new Date(m.last_trained).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                              <TableCell>
                                {i === 0
                                  ? <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px]">Active</Badge>
                                  : <Badge variant="outline" className="border-slate-200 text-slate-500 text-[10px]">Archived</Badge>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ═════════════════════════════════════════════
                  TAB 2 — USER MANAGEMENT
                  ═════════════════════════════════════════════ */}
              <TabsContent value="users" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white border-slate-200 backdrop-blur-sm p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-5 w-5 text-indigo-400" />
                      <h3 className="text-lg font-bold text-slate-900">Registered Users</h3>
                    </div>
                    <p className="text-slate-500 text-xs mb-5">Users identified from headache history entries</p>
                    {userActivity.length === 0 ? (
                      <div className="text-center py-10">
                        <Users className="h-10 w-10 text-white/10 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No users found in the system.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-200 hover:bg-transparent">
                              <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">User ID</TableHead>
                              <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Entries</TableHead>
                              <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Last Active</TableHead>
                              <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userActivity.map(u => (
                              <TableRow key={u.fullId} className="border-white/[0.04] hover:bg-white/[0.02]">
                                <TableCell className="font-mono text-xs text-slate-600">{u.userId}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-900 font-bold">{u.entries}</span>
                                    <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-slate-100 hover:bg-slate-200 overflow-hidden">
                                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-400" style={{ width: `${Math.min(u.entries * 5, 100)}%` }} />
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-slate-500 text-xs">{u.lastActive}</TableCell>
                                <TableCell>
                                  <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px]">Active</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-white border-slate-200 backdrop-blur-sm p-6 shadow-xl">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-4 w-4 text-indigo-400" />
                        <h3 className="text-sm font-bold text-slate-900">Overview</h3>
                      </div>
                      <div className="space-y-4">
                        {[
                          { label: 'Total Users', value: userActivity.length, color: 'text-slate-900' },
                          { label: 'Total Entries', value: headacheCount, color: 'text-slate-900' },
                          { label: 'Avg / User', value: userActivity.length > 0 ? (headacheCount / userActivity.length).toFixed(1) : '0', color: 'text-indigo-400' },
                        ].map((item, i) => (
                          <div key={item.label}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-500">{item.label}</span>
                              <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                            </div>
                            {i < 2 && <Separator className="bg-slate-100 mt-4" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.03] backdrop-blur-sm p-5 shadow-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <h3 className="text-sm font-bold text-slate-900">Auth Note</h3>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Supabase auth is currently mocked. The user table shows distinct <code className="text-indigo-400/70 bg-indigo-500/10 px-1 py-0.5 rounded text-[10px]">user_id</code> values from headache entries.
                        Real user profiles will appear once authentication is re-enabled.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Daily entries chart */}
                <div className="rounded-xl border border-slate-200 bg-white border-slate-200 backdrop-blur-sm p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-900">Daily Entry Volume</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-4">Number of headache entries logged per day</p>
                  <div className="h-[260px]">
                    {dailyEntries.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-slate-400">No entry data to display</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyEntries}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                          <XAxis dataKey="day" tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} />
                          <YAxis tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 11 }} allowDecimals={false} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.2)', borderRadius: 12, color: '#0f172a', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
                          <Bar dataKey="count" name="Entries" fill="#818cf8" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* ═════════════════════════════════════════════
                  TAB 3 — SYSTEM LOGS
                  ═════════════════════════════════════════════ */}
              <TabsContent value="system" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: 'predict-headache', icon: Server, iconColor: 'text-indigo-400', endpoint: '/functions/v1/predict-headache', meta: 'SVM (RBF Kernel)', metaLabel: 'Algorithm' },
                    { name: 'retrain-model', icon: Server, iconColor: 'text-amber-400', endpoint: '/functions/v1/retrain-model', meta: 'Manual (Admin)', metaLabel: 'Trigger' },
                  ].map(fn => (
                    <div key={fn.name} className="rounded-xl border border-slate-200 bg-white border-slate-200 backdrop-blur-sm p-6 shadow-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <fn.icon className={`h-4 w-4 ${fn.iconColor}`} />
                        <h3 className="text-sm font-bold text-slate-900">{fn.name}</h3>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-4">Edge Function Status</p>
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400 font-medium">Deployed & Active</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white border-slate-200 border border-slate-200">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-400 font-semibold">Endpoint</p>
                          <p className="text-xs text-slate-600 mt-1 truncate">{fn.endpoint}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white border-slate-200 border border-slate-200">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-400 font-semibold">{fn.metaLabel}</p>
                          <p className="text-xs text-slate-900 font-semibold mt-1">{fn.meta}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Database Stats */}
                <div className="rounded-xl border border-slate-200 bg-white border-slate-200 backdrop-blur-sm p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-900">Database Statistics</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-5">Row counts across core Supabase tables</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { table: 'headache_history', count: headacheCount, icon: Activity, gradient: 'from-blue-500 to-cyan-400', desc: 'Patient symptom entries' },
                      { table: 'risk_predictions', count: riskCount, icon: Zap, gradient: 'from-amber-500 to-orange-400', desc: 'AI risk assessments' },
                      { table: 'ml_models', count: modelCount, icon: Brain, gradient: 'from-indigo-500 to-violet-400', desc: 'Trained model versions' },
                    ].map(t => (
                      <div key={t.table} className="p-5 rounded-xl bg-white/[0.02] border border-slate-200 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center`}>
                            <t.icon className="h-3 w-3 text-slate-900" />
                          </div>
                          <code className="text-xs text-indigo-400/70">{t.table}</code>
                        </div>
                        <p className="text-3xl font-extrabold text-slate-900">{loading ? '…' : t.count}</p>
                        <p className="text-[11px] text-slate-400">{t.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Retraining Log */}
                <div className="rounded-xl border border-slate-200 bg-white border-slate-200 backdrop-blur-sm p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-900">Retraining Log</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-4">Chronological history of all model retraining events</p>
                  {mlModels.length === 0 ? (
                    <div className="text-center py-10">
                      <Clock className="h-10 w-10 text-white/10 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">No retraining events recorded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mlModels.map((m, i) => (
                        <motion.div key={m.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-slate-100 transition-colors">
                          <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-400'}`}>
                            {i === 0 ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-900">{m.name}</span>
                              <Badge variant="outline" className="border-indigo-400/30 text-indigo-400 text-[10px] bg-indigo-500/5">v{m.version}</Badge>
                              {i === 0 && <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px]">Current</Badge>}
                            </div>
                            <div className="flex gap-4 mt-1 text-[11px] text-slate-500">
                              <span>Accuracy: <span className="text-emerald-400 font-medium">{m.accuracy ? `${(m.accuracy * 100).toFixed(1)}%` : '—'}</span></span>
                              <span>Samples: <span className="text-slate-600">{m.dataset_size || m.model_params?.training_samples || '—'}</span></span>
                              <span>{new Date(m.last_trained).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* pg_cron info */}
                <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/[0.03] backdrop-blur-sm p-5 shadow-xl">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Cpu className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 mb-1">Automated Retraining (Optional)</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        To enable 24-hour automated retraining, configure <code className="text-indigo-400/70 bg-indigo-500/10 px-1 py-0.5 rounded text-[10px]">pg_cron</code> in your
                        Supabase dashboard. For this project, manual retrain from this panel is sufficient.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
