import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Mail, ArrowRight, ShieldCheck, Loader2, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const { login, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('dkm_login_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
    }
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) {
      toast({ title: 'Email wajib diisi', variant: 'destructive' });
      return;
    }

    if (!pin.trim()) {
      toast({ title: 'PIN wajib diisi', variant: 'destructive' });
      return;
    }

    const res = await login(email.trim(), pin.trim());
    if (res.success) {
      setPin('');
      toast({ title: 'Login berhasil' });
      onLoginSuccess();
    } else {
      toast({ title: res.message || 'Login gagal', variant: 'destructive' });
    }
  };

  const handlePinChange = (value: string) => {
    setPin(value.replace(/\D/g, ''));
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <section className="relative overflow-hidden rounded-[30px] border border-border bg-card p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(22,101,52,0.10),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,246,241,0.98))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/80" />
        <div className="relative">
        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[18px] border border-primary/10 bg-dkm-green-soft/80 shadow-[0_10px_24px_rgba(22,101,52,0.08)]">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-heading text-xl font-bold text-foreground">
            Masuk ke Panel Internal
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Panel ini dipakai bendahara dan pengurus untuk tugas internal. Warga cukup memakai halaman publik.
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
            className="h-12 rounded-2xl border-border bg-white/80 pl-11 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            disabled={loading}
          />
        </div>

        <label htmlFor="pinInput" className="mt-4 block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          PIN
        </label>
        <div className="relative">
          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="pinInput"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            placeholder="Masukkan PIN"
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            className="h-12 rounded-2xl border-border bg-white/80 pl-11 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            disabled={loading}
          />
        </div>

        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
          Login diproses lewat backend Apps Script dengan email dan PIN dari sheet USERS. Auto-login email-only lama dimatikan agar tidak gagal diam-diam.
        </p>

        <Button
          onClick={handleLogin}
          disabled={loading}
          className="mt-5 h-12 w-full rounded-2xl bg-gradient-to-b from-primary to-dkm-green-strong
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
