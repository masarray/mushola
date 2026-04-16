import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { apiSubmitQurbanPayment } from '@/lib/api';
import { formatCurrency, safeNumber } from '@/lib/format';
import { ProgressBar } from './progressbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Send,
  Loader2,
  UserCheck,
  Clock,
  CheckCircle2,
  CreditCard,
  Wallet,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Tab = 'overview' | 'payment' | 'history';

const STORAGE_KEY = 'dkm_qurban_preferences_v2';

function sanitizeNumericInput(value: string) {
  return value.replace(/[^\d]/g, '');
}

function formatCompactAmount(value: number) {
  if (value >= 1000000) return `${value / 1000000}jt`;
  if (value >= 1000) return `${value / 1000}rb`;
  return `${value}`;
}

export function QurbanScreen() {
  const { user, internalData, refreshInternal } = useAuth();
  const { toast } = useToast();

  const nominalRef = useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = useState<Tab>('payment');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedShohibulId, setSelectedShohibulId] = useState('');
  const [payTanggal, setPayTanggal] = useState(() => new Date().toISOString().split('T')[0]);
  const [payNominal, setPayNominal] = useState('');
  const [payMetode, setPayMetode] = useState<'Cash' | 'Transfer'>('Cash');
  const [payKeterangan, setPayKeterangan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const qurban = internalData?.qurban;
  const groups = qurban?.groups || [];
  const qurbanPayments = internalData?.qurbanPayments || [];
  const qurbanRows = internalData?.qurbanRows || [];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        selectedGroup?: string;
        payMetode?: 'Cash' | 'Transfer';
      };

      if (typeof saved.selectedGroup === 'string') {
        setSelectedGroup(saved.selectedGroup);
      }
      if (saved.payMetode === 'Cash' || saved.payMetode === 'Transfer') {
        setPayMetode(saved.payMetode);
      }
    } catch {
      // ignore invalid storage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedGroup,
          payMetode,
        }),
      );
    } catch {
      // ignore storage failure
    }
  }, [selectedGroup, payMetode]);

  useEffect(() => {
    if (!selectedGroup && groups.length > 0) {
      setSelectedGroup(groups[0].groupName);
    }
  }, [groups, selectedGroup]);

  const groupRows = useMemo(() => {
    if (!selectedGroup) return qurbanRows;
    return qurbanRows.filter((row) => row.grup === selectedGroup);
  }, [qurbanRows, selectedGroup]);

  const selectedShohibul = useMemo(() => {
    return qurbanRows.find((row) => row.shohibulId === selectedShohibulId) || null;
  }, [qurbanRows, selectedShohibulId]);

  const quickAmounts = useMemo(() => {
    if (!selectedShohibul) return [];
    const sisa = Math.max(0, safeNumber(selectedShohibul.sisaBayar));
    if (sisa <= 0) return [];

    const values = [100000, 500000, 1000000, sisa]
      .map((v) => Math.min(v, sisa))
      .filter((v) => v > 0);

    return Array.from(new Set(values));
  }, [selectedShohibul]);

  const canSubmit = Boolean(
    user &&
      selectedShohibulId &&
      Number(payNominal || 0) > 0 &&
      !submitting
  );

  const selectShohibul = useCallback((shohibulId: string, groupName?: string) => {
    if (groupName) setSelectedGroup(groupName);
    setSelectedShohibulId(shohibulId);
    setTab('payment');

    window.setTimeout(() => {
      nominalRef.current?.focus();
    }, 120);
  }, []);

  const resetPaymentFormSmart = useCallback(() => {
    setPayTanggal(new Date().toISOString().split('T')[0]);
    setPayNominal('');
    setPayKeterangan('');
    setJustSaved(true);

    window.setTimeout(() => {
      setJustSaved(false);
      nominalRef.current?.focus();
    }, 1400);
  }, []);

  const handlePaymentSubmit = useCallback(async () => {
    if (!user || !selectedShohibulId) return;

    const num = Number(payNominal);
    if (!num || num <= 0) {
      toast({ title: 'Nominal wajib diisi', variant: 'destructive' });
      nominalRef.current?.focus();
      return;
    }

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
        toast({
          title: 'Pembayaran qurban berhasil',
          description: res.result?.paymentId || 'Data masuk ke riwayat pembayaran',
        });

        await refreshInternal();
        resetPaymentFormSmart();
      } else {
        toast({
          title: res.message || 'Gagal menyimpan',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: err?.message || 'Gagal menyimpan',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    user,
    selectedShohibulId,
    payTanggal,
    payNominal,
    payMetode,
    payKeterangan,
    toast,
    refreshInternal,
    resetPaymentFormSmart,
  ]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-2xl p-1">
        {([
          { key: 'overview' as Tab, label: '📊 Ringkasan' },
          { key: 'payment' as Tab, label: '💳 Bayar Cepat' },
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
              {safeNumber(qurban.remainingNominal) > 0 &&
                ` · Kurang ${formatCurrency(qurban.remainingNominal)}`}
            </p>
          </section>

          <section className="space-y-3">
            {groups.map((g) => (
              <div
                key={g.groupName}
                className="bg-card rounded-2xl border border-border p-4 shadow-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    {g.groupName}
                  </h4>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      g.status === 'PENUH'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {g.filledSlots}/{g.totalSlots}
                  </span>
                </div>

                <ProgressBar
                  value={safeNumber(g.paymentProgressPct)}
                  color={g.paymentProgressColor}
                />

                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {formatCurrency(g.collectedNominal)} / {formatCurrency(g.targetNominal)}
                  {' · '}
                  {g.lunasCount || 0} lunas, {g.dpCount || 0} DP, {g.belumCount || 0} belum
                </p>
              </div>
            ))}
          </section>

          {qurbanRows.length > 0 && (
            <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
              <h3 className="font-heading text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-muted-foreground" />
                Daftar Shohibul ({qurbanRows.length})
              </h3>

              <div className="space-y-2">
                {qurbanRows.map((r) => {
                  const status = (r.statusBayar || 'Belum').toLowerCase();
                  const sisa = Math.max(0, safeNumber(r.sisaBayar));

                  return (
                    <button
                      key={r.shohibulId}
                      type="button"
                      onClick={() => selectShohibul(r.shohibulId, r.grup)}
                      className="w-full text-left flex items-center justify-between gap-3 py-3 border-b border-border/30 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{r.nama}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground font-semibold">
                            {r.grup}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              status.includes('lunas')
                                ? 'bg-primary/10 text-primary'
                                : status.includes('dp')
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-muted/60 text-muted-foreground'
                            }`}
                          >
                            {r.statusBayar || 'Belum'}
                          </span>
                          {sisa > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold">
                              Sisa {formatCurrency(sisa)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-foreground">{formatCurrency(r.totalBayar)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          / {formatCurrency(r.targetBayar)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* Payment Tab */}
      {tab === 'payment' && (
        <>
          {/* Group pills */}
          <section className="bg-card rounded-3xl border border-border p-4 shadow-card">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
              <Users className="h-4 w-4" />
              Grup Sapi
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {groups.map((g) => {
                const active = selectedGroup === g.groupName;
                return (
                  <button
                    key={g.groupName}
                    type="button"
                    onClick={() => {
                      setSelectedGroup(g.groupName);
                      setSelectedShohibulId('');
                    }}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {g.groupName}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Shohibul workspace */}
          <section className="bg-card rounded-3xl border border-border p-5 shadow-card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                  <Zap className="h-3.5 w-3.5" />
                  Bayar Cepat
                </div>
                <h3 className="mt-3 font-heading text-base font-bold text-foreground">
                  Pilih Shohibul
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Klik nama lalu isi nominal pembayaran.
                </p>
              </div>

              <div className="rounded-2xl border bg-background px-3 py-2 text-right min-w-[88px]">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Grup
                </div>
                <div className="mt-1 text-sm font-bold text-foreground">
                  {selectedGroup || '-'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {groupRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground text-center">
                  Belum ada shohibul di grup ini.
                </div>
              ) : (
                groupRows.map((row) => {
                  const active = selectedShohibulId === row.shohibulId;
                  const status = (row.statusBayar || 'Belum').toLowerCase();
                  const sisa = Math.max(0, safeNumber(row.sisaBayar));

                  return (
                    <button
                      key={row.shohibulId}
                      type="button"
                      onClick={() => selectShohibul(row.shohibulId)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? 'border-primary bg-primary/5 shadow-soft'
                          : 'border-border bg-background hover:bg-muted/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground break-words">{row.nama}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                status.includes('lunas')
                                  ? 'bg-primary/10 text-primary'
                                  : status.includes('dp')
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-muted/60 text-muted-foreground'
                              }`}
                            >
                              {row.statusBayar || 'Belum'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground font-semibold">
                              Target {formatCurrency(row.targetBayar)}
                            </span>
                            {sisa > 0 ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold">
                                Sisa {formatCurrency(sisa)}
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                Lunas
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">{formatCurrency(row.totalBayar)}</p>
                          <p className="text-[10px] text-muted-foreground">terbayar</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Payment panel */}
          <section className="bg-card rounded-3xl border border-border p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Panel Pembayaran
            </div>

            {!selectedShohibul ? (
              <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground text-center">
                Pilih salah satu shohibul dulu untuk mulai bayar cepat.
              </div>
            ) : (
              <>
                <div className="rounded-2xl bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground break-words">
                        {selectedShohibul.nama}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedShohibul.grup}</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground font-bold uppercase tracking-wide">
                      {selectedShohibul.statusBayar || 'Belum'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="rounded-xl bg-background p-3">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">
                        Target
                      </div>
                      <div className="mt-1 text-sm font-bold text-foreground">
                        {formatCurrency(selectedShohibul.targetBayar)}
                      </div>
                    </div>
                    <div className="rounded-xl bg-background p-3">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">
                        Sudah
                      </div>
                      <div className="mt-1 text-sm font-bold text-primary">
                        {formatCurrency(selectedShohibul.totalBayar)}
                      </div>
                    </div>
                    <div className="rounded-xl bg-background p-3">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">
                        Sisa
                      </div>
                      <div className="mt-1 text-sm font-bold text-destructive">
                        {formatCurrency(Math.max(0, safeNumber(selectedShohibul.sisaBayar)))}
                      </div>
                    </div>
                  </div>
                </div>

                {quickAmounts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      Nominal Cepat
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {quickAmounts.map((amount, idx) => {
                        const active = Number(payNominal || 0) === amount;
                        const isLast = idx === quickAmounts.length - 1;

                        return (
                          <button
                            key={`${amount}-${idx}`}
                            type="button"
                            onClick={() => setPayNominal(String(amount))}
                            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                              active
                                ? 'bg-primary text-primary-foreground'
                                : isLast
                                  ? 'bg-destructive/10 text-destructive hover:bg-destructive/15'
                                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {isLast ? `Pas ${formatCompactAmount(amount)}` : formatCompactAmount(amount)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <Wallet className="h-4 w-4" />
                    Nominal Bayar
                  </div>

                  <div className="rounded-[22px] border bg-background p-3">
                    <Input
                      ref={nominalRef}
                      inputMode="numeric"
                      value={payNominal}
                      onChange={(e) => setPayNominal(sanitizeNumericInput(e.target.value))}
                      placeholder="0"
                      className="h-14 border-0 bg-transparent px-1 text-3xl font-black tracking-tight shadow-none focus-visible:ring-0"
                    />
                    <div className="mt-2 px-1 text-sm font-semibold text-muted-foreground min-h-[20px]">
                      {Number(payNominal || 0) > 0
                        ? formatCurrency(Number(payNominal))
                        : 'Masukkan nominal pembayaran'}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Metode
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Cash', 'Transfer'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPayMetode(m)}
                          className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                            payMetode === m
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted/50 text-muted-foreground'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Tanggal
                    </div>
                    <Input
                      type="date"
                      value={payTanggal}
                      onChange={(e) => setPayTanggal(e.target.value)}
                      className="rounded-2xl h-12 bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Keterangan
                  </div>
                  <Input
                    value={payKeterangan}
                    onChange={(e) => setPayKeterangan(e.target.value)}
                    placeholder="Opsional"
                    className="rounded-2xl h-12 bg-background"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {selectedShohibul.grup}
                  </span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                    {payMetode}
                  </span>
                </div>

                {justSaved && (
                  <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    Pembayaran tersimpan. Siap input berikutnya.
                  </div>
                )}

                <Button
                  onClick={handlePaymentSubmit}
                  disabled={!canSubmit}
                  className="w-full h-14 rounded-full text-base font-bold shadow-soft"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Simpan Pembayaran
                    </>
                  )}
                </Button>
              </>
            )}
          </section>
        </>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
          <h3 className="font-heading text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Riwayat Pembayaran
          </h3>

          {qurbanPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Belum ada pembayaran
            </p>
          ) : (
            <div className="space-y-3">
              {qurbanPayments.map((p) => (
                <div
                  key={p.paymentId}
                  className="flex items-start justify-between gap-3 py-2 border-b border-border/30 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{p.namaShohibul}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.grup} ·{' '}
                      {new Date(p.tanggal).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      · {p.metode}
                    </p>
                    {p.keterangan && (
                      <p className="text-[10px] text-muted-foreground/70">{p.keterangan}</p>
                    )}
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
