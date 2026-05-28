import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Stethoscope, 
  AlertTriangle, 
  MapPin, 
  ShieldCheck, 
  Pill, 
  Search, 
  Navigation, 
  Activity,
  HeartPulse,
  PhoneCall,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

export default function ClinicalToolkit() {
  const [latestEntry, setLatestEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('headache_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!error && data) setLatestEntry(data);
      setLoading(false);
    };
    fetchLatest();
  }, []);

  const getTriageStatus = () => {
    if (!latestEntry) return { label: 'AWAITING DATA', color: 'bg-muted text-muted-foreground', icon: Info, msg: 'Log your first headache to activate triage.' };
    const intensity = latestEntry.intensity;
    if (intensity >= 9) return { label: 'EMERGENCY CARE', color: 'bg-destructive text-destructive-foreground animate-pulse', icon: AlertTriangle, msg: 'Critical intensity detected. Immediate medical evaluation is required.' };
    if (intensity >= 6) return { label: 'URGENT CONSULT', color: 'bg-orange-500 text-white', icon: Activity, msg: 'High intensity episode. Schedule an urgent specialist review.' };
    return { label: 'ROUTINE MONITORING', color: 'bg-success text-white', icon: ShieldCheck, msg: 'Stable pattern. Maintain lifestyle tracking and standard protocol.' };
  };

  const getSpecialistRec = () => {
    const type = latestEntry?.predicted_type || '';
    if (type.includes('Migraine')) return { field: 'Neurologist', reason: 'Requires specialized migraine prophylaxis and triggers management.', focus: 'Neuro-stimulation & Medication' };
    if (type.includes('Tension')) return { field: 'Physical Therapist / Psychologist', reason: 'Focus on musculoskeletal relief and stress-reduction therapy.', focus: 'Biofeedback & Posture' };
    if (type.includes('Cluster')) return { field: 'Pain Management Specialist', reason: 'Intense cyclical pain requires oxygen therapy or specific blocks.', focus: 'Acute Abortive Therapy' };
    return { field: 'General Practitioner', reason: 'Baseline diagnostics and initial screening for headache disorders.', focus: 'Primary Assessment' };
  };

  const triage = getTriageStatus();
  const rec = getSpecialistRec();

  const openGoogleMaps = (query: string) => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <HeartPulse className="h-5 w-5 text-primary" />
            <Badge variant="outline" className="text-primary border-primary/20">Decision Support System</Badge>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Clinical Decision Toolkit</h1>
          <p className="text-muted-foreground text-lg">AI-driven specialist triage and emergency navigation portal.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Smart AI Triage System */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-2 shadow-xl shadow-primary/5">
              <div className={`h-2 w-full ${triage.color.split(' ')[0]}`} />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <triage.icon className="h-5 w-5" /> Smart Triage Status
                    </CardTitle>
                    <CardDescription>Real-time clinical priority based on your latest AI log.</CardDescription>
                  </div>
                  <Badge className={`px-3 py-1 font-bold ${triage.color}`}>{triage.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="p-4 rounded-xl bg-muted/40 border-l-4 border-primary">
                    <p className="font-medium text-sm leading-relaxed">{triage.msg}</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-primary/5 border-none">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase">
                          <Stethoscope className="h-4 w-4" /> Recommended Specialist
                        </div>
                        <div>
                          <p className="text-lg font-bold">{rec.field}</p>
                          <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{rec.focus}</Badge>
                      </CardContent>
                    </Card>

                    <Card className="bg-destructive/5 border-none">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-destructive font-bold text-xs uppercase">
                          <AlertTriangle className="h-4 w-4" /> Emergency Indicators
                        </div>
                        <ul className="text-[10px] space-y-1 text-muted-foreground list-disc list-inside">
                          <li>Sudden "Thunderclap" pain</li>
                          <li>Slurred speech or numbness</li>
                          <li>Loss of consciousness</li>
                          <li>Fever and stiff neck</li>
                        </ul>
                        <p className="text-[10px] font-bold text-destructive">Seek immediate ER if these occur.</p>
                      </CardContent>
                    </Card>
                 </div>
              </CardContent>
            </Card>

            {/* Locator Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="group hover:border-primary/50 transition-colors">
                 <CardContent className="p-6">
                   <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                      <Pill className="h-6 w-6" />
                   </div>
                   <h3 className="font-bold text-lg mb-1">Pharmacy Finder</h3>
                   <p className="text-sm text-muted-foreground mb-4">Locate 24/7 pharmacies for acute medication relief.</p>
                   <Button onClick={() => openGoogleMaps('24h pharmacy')} variant="outline" className="w-full gap-2">
                     Find Nearby <Navigation className="h-4 w-4" />
                   </Button>
                 </CardContent>
               </Card>

               <Card className="group hover:border-destructive/50 transition-colors">
                 <CardContent className="p-6">
                   <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4 text-destructive">
                      <PhoneCall className="h-6 w-6" />
                   </div>
                   <h3 className="font-bold text-lg mb-1">ER Locator</h3>
                   <p className="text-sm text-muted-foreground mb-4">Direct navigation to nearest Neurology-capable hospitals.</p>
                   <Button onClick={() => openGoogleMaps('emergency hospital neurology')} variant="outline" className="w-full gap-2 text-destructive hover:bg-destructive hover:text-white">
                     Emergency Route <ExternalLink className="h-4 w-4" />
                   </Button>
                 </CardContent>
               </Card>
            </div>
          </div>

          {/* Sidebar / Guidelines */}
          <div className="space-y-6">
             <Card className="gradient-primary text-white border-0 shadow-xl shadow-primary/20">
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <ShieldCheck className="h-5 w-5 text-white" />
                   Health Safety
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <p className="text-sm text-white/90">This toolkit utilizes ICHD-3 guidelines to support your decision making.</p>
                 <div className="space-y-2">
                    {['Automated Triage', 'Direct Navigation', 'Red-Flag Detection'].map(f => (
                       <div key={f} className="flex items-center gap-2 text-xs bg-white/10 p-2 rounded-lg">
                         <ChevronRight className="h-3 w-3" /> {f}
                       </div>
                    ))}
                 </div>
                 <hr className="border-white/20" />
                 <p className="text-[10px] italic text-white/70">Disclaimer: Not a replacement for professional diagnosis.</p>
               </CardContent>
             </Card>

             <Card>
               <CardHeader className="pb-3 text-sm font-bold flex flex-row items-center gap-2">
                 <Activity className="h-4 w-4 text-primary" /> Live Health Advisory
               </CardHeader>
               <CardContent className="space-y-3">
                 <div className="p-3 bg-muted rounded-xl text-xs leading-relaxed">
                   Stay hydrated and avoid high-screen time if you feel tension building.
                 </div>
                 <Link to="/health-guide">
                    <Button variant="link" className="p-0 text-xs h-auto underline">Read Neurology Guidelines</Button>
                 </Link>
               </CardContent>
             </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
}
