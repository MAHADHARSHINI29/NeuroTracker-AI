import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const ADMIN_PASSPHRASE = import.meta.env.VITE_ADMIN_PASSPHRASE || 'neurotrack-admin-2026';

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem('neurotrack_admin') === 'true';
}

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (passphrase === ADMIN_PASSPHRASE) {
        sessionStorage.setItem('neurotrack_admin', 'true');
        toast({
          title: 'Access Granted',
          description: 'Welcome to the Admin Panel.',
        });
        navigate('/admin/dashboard');
      } else {
        toast({
          title: 'Access Denied',
          description: 'Invalid passphrase. Please try again.',
          variant: 'destructive',
        });
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-primary/20 border border-primary/30 rounded-xl p-3 mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Admin Access</h1>
          <p className="text-slate-400 text-sm mt-1">NeuroTrack AI — Restricted Area</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-display text-xl text-white">Authentication Required</CardTitle>
            <CardDescription className="text-slate-400">
              Enter the admin passphrase to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passphrase" className="text-slate-300">Passphrase</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="passphrase"
                    type="password"
                    placeholder="Enter admin passphrase"
                    value={passphrase}
                    onChange={e => setPassphrase(e.target.value)}
                    className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full gradient-primary border-0"
                disabled={loading}
              >
                {loading ? (
                  'Verifying...'
                ) : (
                  <>
                    Access Admin Panel
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-6">
          This area is restricted to authorised administrators only.
        </p>
      </motion.div>
    </div>
  );
}
