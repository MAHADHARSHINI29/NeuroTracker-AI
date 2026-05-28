import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Brain, ShieldCheck, Lightbulb, Heart, Droplets, Moon,
  Monitor, Utensils, HelpCircle, ChevronDown,
  Activity, Zap, Clock, Eye, Sparkles, ArrowRight, AlertTriangle
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/* ── Headache type data ─────────────────────────────────── */
const headacheTypes = [
  {
    name: 'Migraine with Aura',
    icon: Eye,
    gradient: 'from-purple-500 to-violet-600',
    lightBg: 'bg-purple-500/5 border-purple-500/15 hover:border-purple-500/30',
    iconBg: 'bg-purple-500/10',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    description:
      'Visual disturbances like flashing lights, zigzag patterns, or blind spots appear 20–60 minutes before the headache. Often accompanied by nausea and extreme light sensitivity.',
    keySymptoms: ['Visual aura', 'One-sided pain', 'Nausea', 'Light sensitivity'],
    duration: '4 – 72 hours',
    severity: 'Moderate to Severe',
  },
  {
    name: 'Migraine without Aura',
    icon: Zap,
    gradient: 'from-red-500 to-rose-600',
    lightBg: 'bg-red-500/5 border-red-500/15 hover:border-red-500/30',
    iconBg: 'bg-red-500/10',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400',
    description:
      'The most common migraine type — moderate-to-severe throbbing pain, usually on one side of the head, worsened by physical activity.',
    keySymptoms: ['Throbbing pain', 'Sound sensitivity', 'Nausea / vomiting', 'Fatigue'],
    duration: '4 – 72 hours',
    severity: 'Moderate to Severe',
  },
  {
    name: 'Tension-Type Headache',
    icon: Activity,
    gradient: 'from-blue-500 to-cyan-600',
    lightBg: 'bg-blue-500/5 border-blue-500/15 hover:border-blue-500/30',
    iconBg: 'bg-blue-500/10',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    description:
      "Feels like a tight band around the head. Usually mild-to-moderate and doesn't worsen with routine physical activity.",
    keySymptoms: ['Pressing pain', 'Both sides', 'Mild intensity', 'No nausea'],
    duration: '30 min – 7 days',
    severity: 'Mild to Moderate',
  },
  {
    name: 'Cluster Headache',
    icon: Clock,
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-500/5 border-amber-500/15 hover:border-amber-500/30',
    iconBg: 'bg-amber-500/10',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    description:
      'Extremely intense pain around one eye, occurring in cyclical patterns ("clusters"). Often wakes patients from sleep.',
    keySymptoms: ['Severe eye pain', 'Tearing / redness', 'Restlessness', 'Nasal congestion'],
    duration: '15 min – 3 hours',
    severity: 'Severe',
  },
];

/* ── Prevention tips ────────────────────────────────────── */
const preventionTips = [
  {
    icon: Moon, title: 'Prioritise Sleep',
    description: 'Stick to a consistent sleep schedule — even on weekends. 7–9 hours is ideal for reducing migraine frequency.',
    gradient: 'from-indigo-500 to-blue-600',
    stat: '40%', statLabel: 'risk reduction with good sleep',
  },
  {
    icon: Droplets, title: 'Stay Hydrated',
    description: 'Dehydration is a top trigger. Aim for 2–3 litres of water per day, more in hot weather.',
    gradient: 'from-cyan-500 to-teal-600',
    stat: '2-3L', statLabel: 'daily water intake recommended',
  },
  {
    icon: Heart, title: 'Manage Stress',
    description: 'Practise deep breathing, yoga, or short walks to keep cortisol and stress hormones in check.',
    gradient: 'from-rose-500 to-pink-600',
    stat: '68%', statLabel: 'of migraines linked to stress',
  },
  {
    icon: Monitor, title: 'Limit Screen Time',
    description: 'Blue light and eye strain can trigger migraines. Take a 5-minute break every 30 minutes of screen use.',
    gradient: 'from-violet-500 to-purple-600',
    stat: '20-20', statLabel: 'rule: 20min screen, 20sec break',
  },
  {
    icon: Utensils, title: 'Eat Regularly',
    description: 'Skipping meals causes blood-sugar dips that can trigger headaches. Keep healthy snacks handy throughout the day.',
    gradient: 'from-emerald-500 to-green-600',
    stat: '3-5', statLabel: 'small meals per day recommended',
  },
  {
    icon: Activity, title: 'Exercise Moderately',
    description: 'Regular aerobic exercise (30 min, 3× per week) can reduce migraine frequency by up to 40%.',
    gradient: 'from-orange-500 to-amber-600',
    stat: '30min', statLabel: '3x per week aerobic exercise',
  },
];

/* ── FAQ data ───────────────────────────────────────────── */
const faqs = [
  {
    question: 'How accurate is NeuroTrack AI?',
    answer:
      'Our AI model achieves over 88% accuracy in clinical validation tests. It continuously improves as more anonymised data is collected. However, it is a screening tool — always consult a neurologist for a formal diagnosis.',
  },
  {
    question: 'Is my health data safe?',
    answer:
      'Yes. All data is encrypted at rest and in transit. We follow industry-standard security practices and never share individual patient data with third parties.',
  },
  {
    question: 'When should I see a doctor?',
    answer:
      'Seek immediate attention if: you experience the worst headache of your life, headache after head injury, headache with fever/stiff neck, sudden vision loss, or if your headache pattern changes dramatically.',
  },
  {
    question: 'Can logging headaches really help?',
    answer:
      'Absolutely. Consistent logging helps our AI identify your personal triggers, seasonal patterns, and the effectiveness of lifestyle changes — insights that would take months to discover on your own.',
  },
  {
    question: 'What data does the AI use to make predictions?',
    answer:
      'The model analyses your symptom profile (pain intensity, location, type, duration), associated symptoms (nausea, aura, light sensitivity), and lifestyle factors (sleep, stress, hydration, screen time) to classify your headache type and assess risk.',
  },
];

/* ── Warning signs ──────────────────────────────────────── */
const warningSigns = [
  'Worst headache of your life (thunderclap)',
  'Headache after head injury or trauma',
  'Headache with fever, stiff neck, or rash',
  'Sudden changes in vision or speech',
  'Headache that worsens over days',
  'New headache pattern after age 50',
];

/* ── Component ──────────────────────────────────────────── */
export default function HealthGuide() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-12 pb-20">
        {/* ── Hero Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-4 py-1.5 text-sm text-muted-foreground mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Evidence-Based Health Education
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
            Health Guide
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Learn about headache types, evidence-based prevention strategies, and how our AI-powered platform helps you take control of your neurological health.
          </p>
        </motion.div>

        {/* ── Understanding Headache Types ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">Understanding Headache Types</h2>
              <p className="text-sm text-muted-foreground">
                Our AI classifies headaches into four medically-recognized categories
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {headacheTypes.map((type, i) => (
              <motion.div
                key={type.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className={`h-full border-2 transition-all duration-300 ${type.lightBg} group`}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center shadow-lg`}>
                          <type.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-base">{type.name}</h3>
                          <p className="text-[11px] text-muted-foreground">{type.duration}</p>
                        </div>
                      </div>
                      <Badge className={`text-[10px] ${type.badgeClass} border-0`}>
                        {type.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{type.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {type.keySymptoms.map(s => (
                        <Badge key={s} variant="secondary" className="text-[11px] font-medium">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Warning Signs Alert ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-destructive/20 bg-destructive/[0.03] overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <h3 className="font-display font-bold text-lg text-destructive">When to Seek Emergency Care</h3>
                    <p className="text-sm text-muted-foreground">See a doctor immediately if you experience any of these:</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {warningSigns.map((sign, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                        <span className="text-sm text-foreground/80">{sign}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* ── Prevention & Wellness Tips ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-accent flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">Prevention & Wellness</h2>
              <p className="text-sm text-muted-foreground">
                Evidence-based strategies to reduce headache frequency
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {preventionTips.map((tip, i) => (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 group border-2 hover:border-primary/20 overflow-hidden">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${tip.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                          <tip.icon className="h-5 w-5 text-white" />
                        </div>
                        <p className="font-display font-bold text-sm">{tip.title}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tip.description}
                    </p>
                    <div className="p-3 rounded-xl bg-muted/50 border">
                      <p className="text-2xl font-extrabold text-primary">{tip.stat}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{tip.statLabel}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── How Our AI Works ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">How Our AI Works</h2>
              <p className="text-sm text-muted-foreground">
                A three-step process from symptom logging to actionable insights
              </p>
            </div>
          </div>

          <Card className="border-2 border-primary/15 bg-gradient-to-br from-primary/[0.03] to-transparent overflow-hidden">
            <CardContent className="p-6 md:p-10">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                {[
                  {
                    step: '1',
                    title: 'You Log Symptoms',
                    desc: 'Record your pain intensity, location, duration, and associated symptoms using our intuitive tracker.',
                    icon: Activity,
                  },
                  {
                    step: '2',
                    title: 'AI Analyses Patterns',
                    desc: 'Our clinically-validated SVM model compares your profile against thousands of cases to classify your headache.',
                    icon: Brain,
                  },
                  {
                    step: '3',
                    title: 'You Get Insights',
                    desc: 'Receive a diagnosis forecast, risk assessment, and personalised recommendations — all in seconds.',
                    icon: Sparkles,
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.12 }}
                    className="space-y-3 relative"
                  >
                    <div className="mx-auto h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
                      <item.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="mx-auto h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {item.step}
                    </div>
                    <h3 className="font-display font-bold text-base">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    {i < 2 && (
                      <div className="hidden md:block absolute top-8 -right-4 text-primary/20">
                        <ArrowRight className="h-6 w-6" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 flex flex-col items-center gap-4">
                <div className="p-4 rounded-xl bg-muted/40 border border-dashed border-muted-foreground/20 max-w-2xl">
                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    <span className="font-semibold text-foreground">Clinical note:</span>{' '}
                    NeuroTrack AI is a screening and self-management tool — it does not replace
                    professional medical advice. Always consult a qualified healthcare provider for
                    diagnosis and treatment.
                  </p>
                </div>
                <Link to="/tracker">
                  <Button className="gradient-primary border-0 px-6 shadow-lg shadow-primary/20">
                    Start Logging Now <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── FAQ ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">Frequently Asked Questions</h2>
              <p className="text-sm text-muted-foreground">
                Common questions about NeuroTrack AI and headache management
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-300 border-2 hover:shadow-md ${
                      isOpen ? 'border-primary/30 shadow-md bg-primary/[0.02]' : 'hover:border-primary/10'
                    }`}
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isOpen ? 'bg-primary/10' : 'bg-muted'
                          }`}>
                            <span className={`text-sm font-bold ${isOpen ? 'text-primary' : 'text-muted-foreground'}`}>
                              {i + 1}
                            </span>
                          </div>
                          <p className="font-semibold text-sm">{faq.question}</p>
                        </div>
                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className={`h-4 w-4 shrink-0 transition-colors ${isOpen ? 'text-primary' : 'text-muted-foreground'}`} />
                        </motion.div>
                      </div>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="text-sm text-muted-foreground mt-4 ml-11 leading-relaxed border-l-2 border-primary/20 pl-4">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-primary to-blue-600 text-white overflow-hidden relative border-0">
            <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 flex items-center justify-center">
              <Brain className="h-48 w-48 -mr-12" />
            </div>
            <CardContent className="p-8 md:p-12 relative">
              <div className="max-w-xl">
                <h3 className="font-display text-2xl md:text-3xl font-bold mb-3">
                  Ready to Take Control?
                </h3>
                <p className="text-primary-foreground/80 mb-6 leading-relaxed">
                  Start tracking your headaches today and let our AI help you discover your personal triggers, patterns, and prevention strategies.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/tracker">
                    <Button size="lg" variant="secondary" className="font-semibold px-6">
                      Log Your First Headache <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/analytics">
                    <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10 px-6">
                      View Analytics
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
