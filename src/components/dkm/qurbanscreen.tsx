import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { apiGetShohibulList, apiSubmitQurbanPayment, type QurbanRow } from '@/lib/api';
import { formatCurrency, safeNumber } from '@/lib/format';
import { ProgressBar } from './ProgressBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users, CreditCard, Send, Loader2, AlertCircle,
  ChevronDown, UserCheck, Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Tab = 'overview' | 'payment' | 'history';

export function QurbanScreen() {
  const { user, internalData, refreshInternal } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('overview');

  // Payment form state
  const [selectedGroup, setSelectedGroup] = useState('');
  const [shohibulList, setShohibulList] = useState<QurbanRow[]>([]);
  const [loadingShohibul, setLoadingShohibul] = useState(false);
  const [selectedShohibulId, setSelectedShohibulId] = useState('');
  const [selectedShohibul, setSelectedShohibul] = useState<QurbanRow | null>(null);
  const [payTanggal, setPayTanggal] = useState(() => new Date().toISOString().split('T')[0]);
  const [payNominal, setPayNominal] = useState('');
  const [payMetode, setPayMetode] = useState('Cash');
  const [payKeterangan, setPayKeterangan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const qurban = internalData?.qurban;
  const groups = qurban?.groups || [];
  const qurbanPayments = internalData?.qurbanPayments || [];
  const qurbanRows = internalData?.qurbanRows || [];

  const handleGroupChange = useCallback(async (groupName: string) => {
    setSelectedGroup(groupName);
    setSelectedShohibulId('');
    setSelectedShohibul(null);
    setShohibulList([]);
    if (!groupName) return;

    setLoadingShohibul(true);
    try {
      const res = await apiGetShohibulList(groupName);
      if (res.success) setShohibulList(res.rows || []);
    } catch { /* ignore */ }
    setLoadingShohibul(false);
  }, []);

  const handleShohibulChange = useCallback((id: string) => {
    setSelectedShohibulId(id);
    const found = shohibulList.find(s => s.shohibulId === id);
    setSelectedShohibul(found || null);
  }, [shohibulList]);

  const handlePaymentSubmit = useCallback(async () => {
    if (!user || !selectedShohibulId) return;
    const num = Number(payNominal);
    if (!num || num <= 0) return toast({ title: 'Nominal wajib diisi', variant: 'destructive' });

    setSubmitting(true);
    try {
      const res = await apiSubmitQurbanPayment({
        email: user.email,
        tanggal: payTanggal,
        shohibulId: selectedShohibulId,
        nominalBayar: num,
        metode: payMetode,
        keterangan: payKeterangan.trim(),
      });
      if (res.success) {
        toast({ title: 'Pembayaran qurban berhasil ✓', description: res.result?.paymentId });
        setPayNominal('');
        setPayKeterangan('');
        setSelectedShohibulId('');
        setSelectedShohibul(null);
        refreshInternal();
      } else {
        toast({ title: res.message || 'Gagal menyimpan', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: err.message || 'Gagal menyimpan', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [user, selectedShohibulId, payTanggal, payNominal, payMetode, payKeterangan, toast, refreshInternal]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-2xl p-1">
        {([
          { key: 'overview' as Tab, label: '📊 Ringkasan' },
          { key: 'payment' as Tab, label: '💳 Bayar' },
          { key: 'history' as Tab, label: '📋 Riwayat' },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              tab === t.key
                ? 'bg-card text-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && qurban && (
        <>
          {/* Summary */}
          <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-sm font-bold text-foreground">🐄 Progres Qurban</h3>
              <span className="text-xs font-bold text-primary">{safeNumber(qurban.progressPct)}%</span>
            </div>
            <ProgressBar value={safeNumber(qurban.progressPct)} color={qurban.progressColor} />
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{safeNumber(qurban.totalGroups)}</p>
                <p className="text-[10px] text-muted-foreground">Grup</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{safeNumber(qurban.totalFilled)}</p>
                <p className="text-[10px] text-muted-foreground">Terisi</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-500">{safeNumber(qurban.totalEmpty)}</p>
                <p className="text-[10px] text-muted-foreground">Kosong</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              {formatCurrency(qurban.totalNominal)} terkumpul
              {safeNumber(qurban.remainingNominal) > 0 && ` · Kurang ${formatCurrency(qurban.remainingNominal)}`}
            </p>
          </section>

          {/* Groups */}
          <section className="space-y-3">
            {groups.map((g) => (
              <div key={g.groupName} className="bg-card rounded-2xl border border-border p-4 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    {g.groupName}
                  </h4>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    g.status === 'PENUH' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {g.filledSlots}/{g.totalSlots}
                  </span>
                </div>
                <ProgressBar value={safeNumber(g.paymentProgressPct)} color={g.paymentProgressColor} />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {formatCurrency(g.collectedNominal)} / {formatCurrency(g.targetNominal)}
                  {' · '}{g.lunasCount || 0} lunas, {g.dpCount || 0} DP, {g.belumCount || 0} belum
                </p>
              </div>
            ))}
          </section>

          {/* Shohibul Table */}
          {qurbanRows.length > 0 && (
            <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
              <h3 className="font-heading text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-muted-foreground" />
                Daftar Shohibul ({qurbanRows.length})
              </h3>
              <div className="space-y-2">
                {qurbanRows.map((r) => {
                  const status = (r.statusBayar || 'Belum').toLowerCase();
                  return (
                    <div key={r.shohibulId} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{r.nama}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground font-semibold">{r.grup}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            status.includes('lunas') ? 'bg-primary/10 text-primary' :
                            status.includes('dp') ? 'bg-amber-100 text-amber-700' :
                            'bg-muted/60 text-muted-foreground'
                          }`}>
                            {r.statusBayar || 'Belum'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-foreground">{formatCurrency(r.totalBayar)}</p>
                        <p className="text-[10px] text-muted-foreground">/ {formatCurrency(r.targetBayar)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* Payment Tab */}
      {tab === 'payment' && (
        <section className="bg-card rounded-3xl border border-border p-5 shadow-card space-y-4">
          <h3 className="font-heading text-sm font-bold text-foreground">💳 Bayar Qurban</h3>

          {/* Grup Select */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Grup Sapi
            </label>
            <div className="relative">
              <select
                value={selectedGroup}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="w-full h-11 rounded-xl bg-background border border-input px-3 text-sm appearance-none pr-8"
              >
                <option value="">Pilih grup...</option>
                {groups.map((g) => (
                  <option key={g.groupName} value={g.groupName}>{g.groupName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Shohibul Select */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Nama Shohibul
            </label>
            <div className="relative">
              <select
                value={selectedShohibulId}
                onChange={(e) => handleShohibulChange(e.target.value)}
                disabled={!selectedGroup || loadingShohibul}
                className="w-full h-11 rounded-xl bg-background border border-input px-3 text-sm appearance-none pr-8 disabled:opacity-50"
              >
                <option value="">
                  {loadingShohibul ? 'Memuat...' : 'Pilih shohibul...'}
                </option>
                {shohibulList.map((s) => (
                  <option key={s.shohibulId} value={s.shohibulId}>
                    {s.nama} ({s.statusBayar || 'Belum'})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Shohibul Info */}
          {selectedShohibul && (
            <div className="bg-muted/30 rounded-xl p-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Target</span>
                <span className="font-bold text-foreground">{formatCurrency(selectedShohibul.targetBayar)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Sudah Bayar</span>
                <span className="font-bold text-primary">{formatCurrency(selectedShohibul.totalBayar)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Sisa</span>
                <span className="font-bold text-amber-600">{formatCurrency(selectedShohibul.sisaBayar)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Status</span>
                <span className="font-bold">{selectedShohibul.statusBayar || 'Belum'}</span>
              </div>
            </div>
          )}

          {/* Payment Fields */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Tanggal</label>
            <Input type="date" value={payTanggal} onChange={(e) => setPayTanggal(e.target.value)} className="rounded-xl h-11 bg-background" />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Metode</label>
            <div className="flex gap-2">
              {['Cash', 'Transfer'].map((m) => (
                <button
                  key={m}
                  onClick={() => setPayMetode(m)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    payMetode === m ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">💰 Nominal</label>
            <Input
              type="number"
              value={payNominal}
              onChange={(e) => setPayNominal(e.target.value)}
              placeholder="0"
              className="rounded-xl h-12 bg-background text-lg font-bold"
            />
            {Number(payNominal) > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(payNominal)}</p>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Keterangan (opsional)</label>
            <Input
              value={payKeterangan}
              onChange={(e) => setPayKeterangan(e.target.value)}
              placeholder="Catatan..."
              className="rounded-xl h-11 bg-background"
            />
          </div>

          <Button
            onClick={handlePaymentSubmit}
            disabled={submitting || !selectedShohibulId}
            className="w-full h-12 rounded-2xl bg-gradient-to-b from-primary to-dkm-green-strong
                       text-primary-foreground font-bold text-sm shadow-soft
                       transition-all duration-200 active:scale-[0.98]"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
            ) : (
              <><Send className="w-4 h-4" /> Simpan Pembayaran</>
            )}
          </Button>
        </section>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
          <h3 className="font-heading text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Riwayat Pembayaran
          </h3>
          {qurbanPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Belum ada pembayaran</p>
          ) : (
            <div className="space-y-3">
              {qurbanPayments.map((p) => (
                <div key={p.paymentId} className="flex items-start justify-between gap-3 py-2 border-b border-border/30 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{p.namaShohibul}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.grup} · {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      {' · '}{p.metode}
                    </p>
                    {p.keterangan && <p className="text-[10px] text-muted-foreground/70">{p.keterangan}</p>}
                  </div>
                  <span className="text-sm font-bold text-primary whitespace-nowrap">
                    +{formatCurrency(p.nominalBayar)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
