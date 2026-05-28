import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, Zap, Clock, Activity, CalendarDays, Droplets, Brain, AlertTriangle,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8'];

export default function Analytics() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30days');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  /* ── Fetch user-specific data ── */
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth?mode=login');
        return;
      }
      setUserName(session.user.user_metadata?.full_name || 'User');

      // Calculate date range
      const now = new Date();
      const daysBack = timeRange === '7days' ? 7 : timeRange === '90days' ? 90 : 30;
      const fromDate = new Date(now.getTime() - daysBack * 86400000).toISOString();

      const { data, error } = await supabase
        .from('headache_history')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', fromDate)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Analytics fetch error:', error);
      }
      setEntries(data || []);
      setLoading(false);
    };
    fetchUserData();
  }, [navigate, timeRange]);

  /* ── Derived analytics ── */
  const analytics = useMemo(() => {
    if (entries.length === 0) {
      return {
        monthlyAvg: 0, mainTrigger: '—', peakTime: '—', avgIntensity: 0,
        severityData: [], typeDistribution: [], monthlyFrequency: [],
        triggerCorrelation: [], timeDistribution: [],
      };
    }

    // Severity over time (group by day)
    const dayMap: Record<string, { intensity: number; stress: number; count: number }> = {};
    const typeCount: Record<string, number> = {};
    const hourBuckets = { 'Morning (6–12)': 0, 'Afternoon (12–6)': 0, 'Evening (6–12)': 0, 'Night (12–6)': 0 };
    const monthMap: Record<string, number> = {};

    // Trigger-like factors
    let lowSleepCount = 0, highStressCount = 0, lowHydrationCount = 0, highScreenCount = 0;

    entries.forEach(e => {
      const d = new Date(e.created_at);
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dayMap[dayLabel]) dayMap[dayLabel] = { intensity: 0, stress: 0, count: 0 };
      dayMap[dayLabel].intensity += e.intensity || 0;
      dayMap[dayLabel].stress += e.stress_level || 0;
      dayMap[dayLabel].count++;

      // Type distribution
      const type = e.predicted_type || 'Unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;

      // Time of day
      const hour = d.getHours();
      if (hour >= 6 && hour < 12) hourBuckets['Morning (6–12)']++;
      else if (hour >= 12 && hour < 18) hourBuckets['Afternoon (12–6)']++;
      else if (hour >= 18) hourBuckets['Evening (6–12)']++;
      else hourBuckets['Night (12–6)']++;

      // Monthly
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
      monthMap[monthLabel] = (monthMap[monthLabel] || 0) + 1;

      // Trigger correlation proxies
      if ((e.sleep_hours || 7) < 6) lowSleepCount++;
      if ((e.stress_level || 5) >= 7) highStressCount++;
      if ((e.hydration_level || 5) <= 3) lowHydrationCount++;
      if ((e.screen_time || 5) >= 8) highScreenCount++;
    });

    const total = entries.length;

    const severityData = Object.entries(dayMap).map(([day, v]) => ({
      day,
      intensity: +(v.intensity / v.count).toFixed(1),
      stress: +(v.stress / v.count).toFixed(1),
    }));

    const typeDistribution = Object.entries(typeCount).map(([name, count], i) => ({
      name, count, fill: COLORS[i % COLORS.length],
    }));

    const monthlyFrequency = Object.entries(monthMap).map(([month, count]) => ({
      month, count,
    }));

    const triggerCorrelation = [
      { name: 'Poor Sleep (<6h)', correlation: +(lowSleepCount / total).toFixed(2), color: '#ef4444' },
      { name: 'High Stress (≥7)', correlation: +(highStressCount / total).toFixed(2), color: '#f59e0b' },
      { name: 'Low Hydration (≤3)', correlation: +(lowHydrationCount / total).toFixed(2), color: '#3b82f6' },
      { name: 'High Screen (≥8h)', correlation: +(highScreenCount / total).toFixed(2), color: '#8b5cf6' },
    ].sort((a, b) => b.correlation - a.correlation);

    const timeDistribution = Object.entries(hourBuckets)
      .filter(([, count]) => count > 0)
      .map(([time, count], i) => ({
        time, count, fill: COLORS[i % COLORS.length],
      }));

    const peakBucket = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1])[0];
    const avgIntensity = entries.reduce((s, e) => s + (e.intensity || 0), 0) / total;

    // Monthly average: total entries / distinct months
    const distinctMonths = new Set(entries.map(e => new Date(e.created_at).toISOString().slice(0, 7))).size || 1;

    return {
      monthlyAvg: +(total / distinctMonths).toFixed(1),
      mainTrigger: triggerCorrelation[0]?.name?.split(' (')[0] || '—',
      mainTriggerCorr: triggerCorrelation[0]?.correlation || 0,
      peakTime: peakBucket[1] > 0 ? peakBucket[0] : '—',
      avgIntensity: +avgIntensity.toFixed(1),
      severityData,
      typeDistribution,
      monthlyFrequency,
      triggerCorrelation,
      timeDistribution,
    };
  }, [entries]);

  const noData = entries.length === 0 && !loading;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Your Analytics</h1>
            <p className="text-muted-foreground text-lg">
              {userName ? `${userName}'s personalized headache insights` : 'Statistical patterns from your records'}
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading / No Data */}
        {loading && (
          <div className="text-center py-16">
            <Brain className="h-12 w-12 text-primary/30 mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading your analytics...</p>
          </div>
        )}

        {noData && (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <CalendarDays className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">No Data Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start logging your headaches to see personalized analytics, trigger correlations, and pattern insights here.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && entries.length > 0 && (
          <>
            {/* Top Insight Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: TrendingUp, label: 'Monthly Avg', value: `${analytics.monthlyAvg}`, sub: 'episodes', cardClass: 'bg-primary/5 border-primary/20' },
                { icon: Zap, label: 'Main Trigger', value: analytics.mainTrigger, sub: `${analytics.mainTriggerCorr} corr`, cardClass: 'bg-red-50 border-red-100 dark:bg-red-500/5 dark:border-red-500/20' },
                { icon: Clock, label: 'Peak Time', value: analytics.peakTime, sub: '', cardClass: 'bg-violet-50 border-violet-100 dark:bg-violet-500/5 dark:border-violet-500/20' },
                { icon: Activity, label: 'Avg Intensity', value: `${analytics.avgIntensity}`, sub: '/10', cardClass: 'bg-blue-50 border-blue-100 dark:bg-blue-500/5 dark:border-blue-500/20' },
              ].map(stat => (
                <Card key={stat.label} className={stat.cardClass}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon className="h-4 w-4 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className="text-2xl md:text-3xl font-extrabold">
                      {stat.value} {stat.sub && <span className="text-sm font-normal text-muted-foreground">{stat.sub}</span>}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Severity vs Stress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Severity vs. Stress Over Time</CardTitle>
                  <CardDescription>Your actual intensity & stress levels per day</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.severityData}>
                      <defs>
                        <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))' }} />
                      <Area type="monotone" dataKey="intensity" stroke="#818cf8" fillOpacity={1} fill="url(#colorIntensity)" name="Intensity" strokeWidth={2} />
                      <Line type="monotone" dataKey="stress" stroke="#f87171" dot={true} name="Stress" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Trigger Correlation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Trigger Correlations</CardTitle>
                  <CardDescription>% of your entries where each factor was present</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.triggerCorrelation} layout="vertical" margin={{ left: 30 }}>
                      <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))' }} />
                      <Bar dataKey="correlation" name="Ratio" radius={[0, 6, 6, 0]}>
                        {analytics.triggerCorrelation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {analytics.triggerCorrelation[0]?.correlation > 0 && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <p className="text-xs text-muted-foreground italic text-center">
                        💡 Your top trigger factor is <strong className="text-foreground">{analytics.triggerCorrelation[0].name}</strong> — present in {Math.round(analytics.triggerCorrelation[0].correlation * 100)}% of your logged headaches.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Type Distribution Pie */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Headache Type Breakdown</CardTitle>
                  <CardDescription>AI-classified distribution of your entries</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px] flex items-center">
                  {analytics.typeDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.typeDistribution}
                          innerRadius={55}
                          outerRadius={95}
                          paddingAngle={4}
                          dataKey="count"
                          nameKey="name"
                        >
                          {analytics.typeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center w-full">Not enough data for type breakdown</p>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Monthly Episode Frequency</CardTitle>
                  <CardDescription>How your headache frequency varies over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.monthlyFrequency}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))' }} />
                      <Bar dataKey="count" fill="#818cf8" radius={[6, 6, 0, 0]} name="Episodes" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Risk Banner */}
            {analytics.avgIntensity >= 6 && (
              <Card className="bg-gradient-to-r from-primary to-blue-600 text-white overflow-hidden relative">
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 flex items-center justify-center">
                  <AlertTriangle className="h-40 w-40 -mr-10" />
                </div>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="h-20 w-20 rounded-full border-4 border-white/20 flex items-center justify-center bg-white/10 shrink-0">
                      <p className="text-2xl font-bold">{analytics.avgIntensity}</p>
                    </div>
                    <div className="space-y-2 flex-1 text-center md:text-left">
                      <h3 className="text-xl font-bold">Elevated Average Intensity</h3>
                      <p className="text-primary-foreground/80 max-w-xl">
                        Your average pain intensity is {analytics.avgIntensity}/10 over this period. Consider consulting a neurologist and reviewing your trigger factors above.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
                        <Badge className="bg-white text-primary hover:bg-white/90 cursor-default">Monitor Closely</Badge>
                        <Badge variant="outline" className="text-white border-white/30 cursor-default">Review Triggers</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
