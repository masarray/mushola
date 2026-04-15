import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { User, Mail, Shield, LogOut } from 'lucide-react';

export function AccountScreen() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Profile Card */}
      <section className="bg-card rounded-3xl border border-border p-6 shadow-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-dkm-green-strong flex items-center justify-center">
            <User className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">{user.name}</h3>
            <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
              {user.role}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 py-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
              <p className="text-sm font-medium text-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Role</p>
              <p className="text-sm font-medium text-foreground">{user.role}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Permissions */}
      <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
        <h4 className="text-sm font-bold text-foreground mb-3">Akses Panel</h4>
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
        className="w-full h-12 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 font-bold"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}
