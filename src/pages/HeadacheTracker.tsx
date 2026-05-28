import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { CalendarIcon, Save, Activity } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { HeadLocation, PainType, Symptom, Trigger, HeadacheEntry } from '@/types/headache';
import { LOCATION_LABELS, PAIN_TYPE_LABELS, SYMPTOM_LABELS, TRIGGER_LABELS } from '@/types/headache';

export default function HeadacheTracker() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth?mode=login');
      }
    };
    checkAuth();
  }, [navigate]);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState('Female');
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [intensity, setIntensity] = useState(5);
  const [location, setLocation] = useState<HeadLocation>('front');
  const [painType, setPainType] = useState<PainType>('throbbing');
  const [duration, setDuration] = useState(60);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [sleepHours, setSleepHours] = useState(7);
  const [stressLevel, setStressLevel] = useState(5);
  const [hydrationLevel, setHydrationLevel] = useState(5);
  const [screenTime, setScreenTime] = useState(6);
  const [triggers, setTriggers] = useState<Trigger[]>([]);


  const toggleSymptom = (s: Symptom) =>
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggleTrigger = (t: Trigger) =>
    setTriggers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Get user authentication state early
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Please sign in to save your headache data.');
      }

      // 2. Prepare ML features
      const mlData = {
        age,
        gender,
        pain_intensity: intensity,
        pain_location: location === 'front' ? 'Frontal' :
          location === 'side' ? 'Temporal' :
            location === 'back' ? 'Occipital' : 'Bilateral',
        pain_quality: painType === 'throbbing' ? 'Throbbing' :
          painType === 'stabbing' ? 'Stabbing' : 'Pressing',
        duration_hours: duration / 60,
        nausea: symptoms.includes('nausea'),
        vomiting: symptoms.includes('vomiting'),
        photophobia: symptoms.includes('light_sensitivity'),
        phonophobia: symptoms.includes('sound_sensitivity'),
        aura_present: symptoms.includes('visual_aura'),
        aura_type: symptoms.includes('visual_aura') ? 'Visual' : 'None',
        visual_disturbance: symptoms.includes('visual_aura'),
        stress_level: stressLevel,
        sleep_hours: sleepHours,
        physical_activity: 'Moderate',
        caffeine_intake: 2,
        alcohol_intake: 0,
        weather_sensitivity: triggers.includes('weather_change'),
        hormonal_factor: false,
        screen_time: screenTime,
        frequency_per_month: 2,
        onset_pattern: triggers.includes('stress') ? 'Sudden' : 'Gradual',
        family_history: false,
        medication_response: 'Good'
      };

      // 3. Call Edge Function with algorithm selection
      const { data: predictionData, error: predictionError } = await supabase.functions.invoke('predict-headache', {
        body: { data: mlData, algorithm: 'SVM' }
      });

      if (predictionError) throw predictionError;

      // 4. Save to Database
      const { data: insertedData, error: dbError } = await supabase
        .from('headache_history')
        .insert({
          user_id: user.id,
          age,
          gender,
          duration: Math.round(duration / 60) || 1,
          intensity,
          location: mlData.pain_location,
          character: mlData.pain_quality,
          nausea: mlData.nausea,
          vomiting: mlData.vomiting,
          photophobia: mlData.photophobia,
          phonophobia: mlData.phonophobia,
          visual_aura: mlData.aura_present,
          sleep_hours: sleepHours,
          stress_level: stressLevel,
          hydration_level: hydrationLevel,
          screen_time: screenTime,
          predicted_type: predictionData.prediction,
          confidence: parseFloat(predictionData.confidence) || 0,
          risk_level: predictionData.risk_level,
          algorithm_used: predictionData.algorithm_used,
          xai_factors: predictionData.xai_factors
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database Insert Error:", dbError);
        throw new Error(dbError.message || 'Failed to save entries to the database');
      }

      toast({
        title: 'Entry saved!',
        description: `AI Predicted: ${predictionData.prediction}`
      });

      if (insertedData) {
        navigate(`/prediction/${insertedData.id}`);
      }
    } catch (error: any) {
      console.error("Submission Error Details:", error);
      toast({
        title: 'Form Submission Error',
        description: error.message || 'Failed to analyze symptoms',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };


  const intensityColor = intensity >= 8 ? 'text-destructive' : intensity >= 5 ? 'text-warning' : 'text-success';

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Log Headache</h1>
          <p className="text-muted-foreground mt-1">Record your symptoms for AI analysis</p>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" value={age} onChange={e => setAge(Number(e.target.value))} />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Gender</Label>
              <div className="flex gap-2">
                {['Female', 'Male', 'Other'].map(g => (
                  <Button key={g} type="button" size="sm" variant={gender === g ? 'default' : 'outline'} onClick={() => setGender(g)}>
                    {g}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">When did it happen?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Intensity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pain Intensity</CardTitle>
            <CardDescription>Rate your pain from 1 (mild) to 10 (unbearable)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Slider value={[intensity]} onValueChange={v => setIntensity(v[0])} min={1} max={10} step={1} className="flex-1" />
              <span className={`text-3xl font-bold font-display ${intensityColor}`}>{intensity}</span>
            </div>
          </CardContent>
        </Card>

        {/* Location & Pain Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Location & Pain Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Headache Location</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(LOCATION_LABELS) as [HeadLocation, string][]).map(([key, label]) => (
                  <Button key={key} type="button" size="sm" variant={location === key ? 'default' : 'outline'} onClick={() => setLocation(key)}>
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pain Type</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(PAIN_TYPE_LABELS) as [PainType, string][]).map(([key, label]) => (
                  <Button key={key} type="button" size="sm" variant={painType === key ? 'default' : 'outline'} onClick={() => setPainType(key)}>
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Duration (minutes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Slider value={[duration]} onValueChange={v => setDuration(v[0])} min={5} max={720} step={5} className="flex-1" />
              <span className="text-lg font-semibold w-20 text-right">
                {duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : `${duration}m`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Symptoms */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Associated Symptoms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.entries(SYMPTOM_LABELS) as [Symptom, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={symptoms.includes(key)} onCheckedChange={() => toggleSymptom(key)} />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lifestyle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lifestyle Factors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { label: 'Sleep Hours', value: sleepHours, set: setSleepHours, min: 0, max: 14, unit: 'hrs' },
              { label: 'Stress Level', value: stressLevel, set: setStressLevel, min: 1, max: 10, unit: '/10' },
              { label: 'Hydration Level', value: hydrationLevel, set: setHydrationLevel, min: 1, max: 10, unit: '/10' },
              { label: 'Screen Time', value: screenTime, set: setScreenTime, min: 0, max: 16, unit: 'hrs' },
            ].map(item => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>{item.label}</Label>
                  <span className="font-medium">{item.value}{item.unit}</span>
                </div>
                <Slider value={[item.value]} onValueChange={v => item.set(v[0])} min={item.min} max={item.max} step={1} />
              </div>
            ))}
          </CardContent>
        </Card>


        {/* Triggers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Possible Triggers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.entries(TRIGGER_LABELS) as [Trigger, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={triggers.includes(key)} onCheckedChange={() => toggleTrigger(key)} />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button onClick={handleSubmit} size="lg" className="w-full gradient-primary border-0 text-base" disabled={loading}>
            {loading ? 'Analyzing...' : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save & Analyze
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </Layout>
  );
}
