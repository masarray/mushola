import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { User, Mail, Shield, LogOut } from 'lucide-react';

export function AccountScreen() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Profile Card */}
      <section className="rounded-3xl border border-border bg-card p-[clamp(1rem,4vw,1.5rem)] shadow-card">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-dkm-green-strong">
            <User className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-heading text-[clamp(1rem,4.4vw,1.125rem)] font-bold text-foreground">{user.name}</h3>
            <span className="mt-1 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-[11px] font-bold text-primary">
              {user.role}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 py-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
              <p className="text-[clamp(0.85rem,3.5vw,0.95rem)] font-medium text-foreground break-all">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Role</p>
              <p className="text-sm font-medium text-foreground">{user.role}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Permissions */}
      <section className="rounded-3xl border border-border bg-card p-[clamp(1rem,4vw,1.25rem)] shadow-card">
        <h4 className="mb-3 text-sm font-bold text-foreground">Akses Panel</h4>
        <div className="space-y-2 text-xs text-muted-foreground">
          {user.role === 'BENDAHARA' ? (
            <>
              <p>✅ Input transaksi harian & Ramadhan</p>
              <p>✅ Input pembayaran qurban</p>
              <p>✅ Lihat rekap keuangan</p>
              <p>✅ Koreksi transaksi</p>
              <p>✅ Lihat dashboard publik</p>
            </>
          ) : (
            <>
              <p>✅ Lihat rekap keuangan</p>
              <p>✅ Lihat data qurban</p>
              <p>✅ Lihat audit log</p>
              <p>✅ Lihat dashboard publik</p>
              <p>❌ Input transaksi (khusus bendahara)</p>
            </>
          )}
        </div>
      </section>

      {/* Logout */}
      <Button
        onClick={logout}
        variant="outline"
        className="h-12 w-full rounded-2xl border-destructive/30 font-bold text-destructive hover:bg-destructive/10"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
