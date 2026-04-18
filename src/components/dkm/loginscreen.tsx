import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Mail, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const { login, loading } = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!email.trim()) {
      toast({ title: 'Email wajib diisi', variant: 'destructive' });
      return;
    }

    const res = await login(email.trim());
    if (res.success) {
      toast({ title: 'Login berhasil ✓' });
      onLoginSuccess();
    } else {
      toast({ title: res.message || 'Login gagal', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(22,101,52,0.10),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,246,241,0.98))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/80" />
        <div className="relative">
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-dkm-green-soft flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-heading text-xl font-bold text-foreground">
            Masuk ke Panel Internal
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Bendahara dan pengurus memakai panel yang lebih cepat untuk input dan monitoring keuangan.
          </p>
        </div>

        <label htmlFor="emailInput" className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="emailInput"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-11 h-12 rounded-2xl bg-background border-border text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            disabled={loading}
          />
        </div>

        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
          Login diproses lewat backend Apps Script. Hanya email yang terdaftar di sheet USERS yang bisa masuk.
        </p>

        <Button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-5 h-12 rounded-2xl bg-gradient-to-b from-primary to-dkm-green-strong
                     text-primary-foreground font-bold text-sm shadow-soft hover:shadow-elevated
                     transition-all duration-200 active:scale-[0.98]"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
          ) : (
            <>Lanjut Masuk <ArrowRight className="w-4 h-4 ml-1" /></>
          )}
        </Button>
        </div>
      </section>
    </div>
  );
}
