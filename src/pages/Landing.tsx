import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Activity, BarChart3, FileText, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Activity, title: 'Smart Tracking', desc: 'Log headache symptoms with detailed pain, trigger, and lifestyle data.' },
  { icon: Brain, title: 'AI Prediction', desc: 'Rule-based engine classifies migraine, tension, and cluster headache types.' },
  { icon: BarChart3, title: 'Visual Analytics', desc: 'Charts and calendars reveal frequency trends and trigger correlations.' },
  { icon: FileText, title: 'Doctor Reports', desc: 'Generate structured PDF summaries to share with your neurologist.' },
  { icon: Shield, title: 'Risk Alerts', desc: 'Automatic warnings when headache patterns indicate elevated risk.' },
  { icon: Sparkles, title: 'Personal Insights', desc: 'Discover connections between sleep, stress, screen time and headaches.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="gradient-primary rounded-lg p-1.5">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">NeuroTrack AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth?mode=login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container relative py-20 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              AI-Powered Headache Intelligence
            </div>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6">
              Track. Predict.{' '}
              <span className="text-primary">Prevent.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground mb-8">
              NeuroTrack AI helps you log headache symptoms, predict migraine types with intelligent analysis, and detect neurological risk early — all in one beautiful dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="gradient-primary border-0 text-primary-foreground px-8 text-base">
                  Start Tracking Free
                </Button>
              </Link>
              <Link to="/auth?mode=login">
                <Button size="lg" variant="outline" className="px-8 text-base">
                  I have an account
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-3xl md:text-4xl font-bold text-center mb-4"
        >
          Everything You Need
        </motion.h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          A complete headache management platform built for patients and physicians.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="rounded-xl border bg-card p-6 hover:shadow-lg transition-shadow"
            >
              <div className="inline-flex items-center justify-center rounded-lg gradient-primary p-2.5 mb-4">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <div className="rounded-2xl gradient-primary p-10 md:p-16 text-center text-primary-foreground">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Take Control of Your Headaches
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of people who use NeuroTrack AI to understand their headache patterns and live better.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" variant="secondary" className="px-8 text-base font-semibold">
              Get Started — It&apos;s Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">NeuroTrack AI</span>
          </div>
          <p>© 2026 NeuroTrack AI. For educational purposes. Not medical advice.</p>
        </div>
      </footer>
    </div>
  );
}
