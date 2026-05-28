import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, Activity, BarChart3, Brain, AlertTriangle, User, ClipboardList, Stethoscope } from 'lucide-react';
import jsPDF from 'jspdf';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { HeadLocation, PainType, Symptom, RiskLevel, HeadacheType, HeadacheEntry, PredictionResult, Trigger } from '@/types/headache';
import { HEADACHE_TYPE_LABELS, SYMPTOM_LABELS, TRIGGER_LABELS } from '@/types/headache';

export default function DoctorReport() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<HeadacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth?mode=login');
          return;
        }
        setUserProfile(session.user);

        const { data: dbData, error } = await supabase
          .from('headache_history')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (dbData) {
          const mappedEntries: HeadacheEntry[] = dbData.map(row => ({
            ...row,
            date: new Date(row.created_at).toLocaleDateString(),
            time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          setEntries(mappedEntries);
        }
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const avgSeverity = entries.length > 0 ? (entries.reduce((s, e) => s + (e.intensity || 0), 0) / entries.length).toFixed(1) : '0';
  const severeEpisodes = entries.filter(e => e.intensity >= 7).length;
  
  const typeCounts: Record<string, number> = {};
  entries.forEach(e => {
    if (e.predicted_type) {
      typeCounts[e.predicted_type] = (typeCounts[e.predicted_type] || 0) + 1;
    }
  });
  const commonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

  const downloadPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    // Header
    doc.setFillColor(59, 130, 246); // Primary Blue
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('NEURO-TRACK CLINICAL REPORT', margin, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`DATE GENERATED: ${new Date().toLocaleDateString().toUpperCase()}`, margin, 34);

    y = 55;
    doc.setTextColor(40, 40, 40);
    
    // Patient Profile Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT PROFILE', margin, y); y += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const patientName = userProfile?.user_metadata?.full_name || userProfile?.email || 'N/A';
    doc.text(`NAME: ${patientName}`, margin, y);
    doc.text(`PATIENT ID: ${userProfile?.id?.substring(0, 8).toUpperCase() || 'N/A'}`, margin + 80, y); y += 6;
    doc.text(`AGE: ${entries[0]?.age || 'N/A'}`, margin, y);
    doc.text(`GENDER: ${entries[0]?.gender || 'N/A'}`, margin + 80, y); y += 12;

    // Clinical Summary Section
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, 190, y); y += 10;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AI CLINICAL SUMMARY', margin, y); y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`TOTAL RECORDED EPISODES: ${entries.length}`, margin, y); y += 6;
    doc.text(`AVERAGE PAIN INTENSITY: ${avgSeverity}/10`, margin, y); y += 6;
    doc.text(`SEVERE EPISODES (7-10): ${severeEpisodes}`, margin, y); y += 6;
    doc.text(`PRIMARY DIAGNOSED PATTERN: ${commonType ? commonType[0] : 'N/A'}`, margin, y); y += 15;

    // Episode History
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RECENT EPISODE LOG', margin, y); y += 10;

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, 170, 8, 'F');
    doc.setFontSize(9);
    doc.text('DATE', margin + 5, y + 5);
    doc.text('INTENSITY', margin + 30, y + 5);
    doc.text('DURATION', margin + 60, y + 5);
    doc.text('AI PREDICTION', margin + 90, y + 5); y += 12;

    doc.setFont('helvetica', 'normal');
    entries.slice(0, 15).forEach(e => {
      doc.text(e.date || 'N/A', margin + 5, y);
      doc.text(`${e.intensity}/10`, margin + 30, y);
      doc.text(`${e.duration_minutes || (e as any).duration*60} min`, margin + 60, y);
      doc.text(e.predicted_type || 'Unclassified', margin + 90, y);
      
      y += 8;
      if (y > 270) { doc.addPage(); y = 30; }
    });

    // Prediction Transparency (XAI)
    if (entries[0]?.xai_factors) {
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('AI EXPLAINABILITY FACTORS (LATEST EPISODE)', margin, y); y += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      Object.entries(entries[0].xai_factors).slice(0, 5).forEach(([factor, score]) => {
        doc.text(`${factor.replace('_', ' ').toUpperCase()}: ${score > 0 ? '+' : ''}${score}% INFLUENCE`, margin + 5, y);
        y += 5;
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`This report is generated by NeuroTrack AI Assistive Technology. Not a replacement for professional neurological diagnosis.`, margin, 285);
        doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
    }

    doc.save(`NeuroTrack_Clinical_Report_${patientName}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><Activity className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="text-primary border-primary/20">Clinical Portal</Badge>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Physician Reporting Service</h1>
            <p className="text-muted-foreground">Certified data summary for neurological consultation.</p>
          </div>
          <Button onClick={downloadPDF} size="lg" className="gradient-primary border-0 shadow-lg shadow-primary/20" disabled={entries.length === 0}>
            <FileDown className="h-5 w-5 mr-3" /> Generate Clinical PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Summary Cards */}
           <Card className="md:col-span-1 border-primary/20 bg-primary/5">
             <CardHeader className="pb-3"><CardTitle className="text-sm">Patient Summary</CardTitle></CardHeader>
             <CardContent className="space-y-4">
               <div className="flex items-center gap-4 p-3 bg-white rounded-xl border">
                 <User className="h-8 w-8 text-primary/60" />
                 <div>
                   <p className="text-sm font-bold">{userProfile?.user_metadata?.full_name || userProfile?.email || 'Patient'}</p>
                   <p className="text-[10px] text-muted-foreground uppercase">Verified Patient Profile</p>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-2 text-xs">
                 <div className="p-3 bg-white border rounded-lg">
                   <p className="text-muted-foreground mb-1 uppercase tracking-tighter">Episodes</p>
                   <p className="text-lg font-bold">{entries.length}</p>
                 </div>
                 <div className="p-3 bg-white border rounded-lg">
                   <p className="text-muted-foreground mb-1 uppercase tracking-tighter">Severe</p>
                   <p className="text-lg font-bold text-destructive">{severeEpisodes}</p>
                 </div>
               </div>
             </CardContent>
           </Card>

           {/* Metrics Table */}
           <Card className="md:col-span-2">
             <CardHeader className="pb-3 border-b">
               <div className="flex justify-between items-center">
                 <CardTitle className="text-sm flex items-center gap-2">
                   <ClipboardList className="h-4 w-4" /> Comprehensive Data History
                 </CardTitle>
                 <Badge variant="secondary" className="text-[10px]">{entries.length} RECORDS</Badge>
               </div>
             </CardHeader>
             <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-muted/30 text-[10px] uppercase font-bold text-muted-foreground">
                     <tr>
                       <th className="px-4 py-3">Date</th>
                       <th className="px-4 py-3">Intensity</th>
                       <th className="px-4 py-3">Type</th>
                       <th className="px-4 py-3">ALGO</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y">
                     {entries.slice(0, 8).map(e => (
                       <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                         <td className="px-4 py-3 font-medium">{e.date}</td>
                         <td className="px-4 py-3">
                           <div className="flex items-center gap-2">
                             <div className={`h-2 w-2 rounded-full ${e.intensity >= 7 ? 'bg-destructive' : e.intensity >= 4 ? 'bg-warning' : 'bg-success'}`} />
                             {e.intensity}/10
                           </div>
                         </td>
                         <td className="px-4 py-3 text-xs">{e.predicted_type}</td>
                         <td className="px-4 py-3"><Badge variant="outline" className="text-[8px] py-0">{e.algorithm_used || 'SVM'}</Badge></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               {entries.length > 8 && <div className="p-4 text-center border-t text-[10px] text-muted-foreground uppercase cursor-pointer hover:text-primary">View all records in history</div>}
             </CardContent>
           </Card>
        </div>
      </div>
    </Layout>
  );
}
