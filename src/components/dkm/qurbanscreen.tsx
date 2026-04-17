import { useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  apiSubmitQurbanPayment,
  getErrorMessage,
  QurbanGroup,
  QurbanPayment,
  QurbanRow,
} from '@/lib/api';
import { formatCurrency, safeNumber } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type PayMethod = 'Cash' | 'Transfer';

type ViewTab = 'select' | 'history';

function onlyDigits(value: string) {
  return value.replace(/[^\d]/g, '');
}

function formatQuickLabel(value: number, isPas = false) {
  if (isPas) return 'Pas';
  if (value >= 1000000) {
    const jt = value / 1000000;
    return Number.isInteger(jt) ? `${jt}jt` : `${jt.toFixed(1)}jt`;
  }
  if (value >= 1000) return `${value / 1000}rb`;
  return `${value}`;
}

function calcRemaining(targetBayar: number, totalBayar: number, sisaBayar?: number) {
  const fallback = Math.max(0, safeNumber(targetBayar) - safeNumber(totalBayar));
  const apiSisa = Math.max(0, safeNumber(sisaBayar));
  return fallback > 0 ? fallback : apiSisa;
}

function calcSmartStatus(targetBayar: number, totalBayar: number, sisaBayar?: number) {
  const paid = safeNumber(totalBayar);
  const remaining = calcRemaining(targetBayar, totalBayar, sisaBayar);

  if (paid <= 0) return 'Belum';
  if (remaining <= 0) return 'Lunas';
  return 'DP';
}

function buildQuickAmounts(remaining: number) {
  if (remaining <= 0) return [];

  let candidates: number[] = [];

  if (remaining <= 200000) {
    candidates = [50000, 100000];
  } else if (remaining <= 500000) {
    candidates = [100000, 250000];
  } else if (remaining <= 1000000) {
    candidates = [100000, 250000, 500000];
  } else if (remaining <= 2000000) {
    candidates = [100000, 500000, 1000000];
  } else {
    candidates = [500000, 1000000, 2000000];
  }

  const filtered = candidates.filter((v) => v > 0 && v < remaining);
  return [...new Set([...filtered, remaining])];
}

export function QurbanScreen() {
  const { user, internalData, refreshInternal } = useAuth();
  const { toast } = useToast();
  const nominalRef = useRef<HTMLInputElement | null>(null);

  const [view, setView] = useState<ViewTab>('select');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedShohibulId, setSelectedShohibulId] = useState('');
  const [nominal, setNominal] = useState('');
  const [metode, setMetode] = useState<PayMethod>('Cash');
  const [submitting, setSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const rows = useMemo(
    () =>
      Array.isArray(internalData?.qurbanRows) ? internalData.qurbanRows : [],
    [internalData?.qurbanRows],
  );
  const groups = useMemo(
    () =>
      Array.isArray(internalData?.qurban?.groups) ? internalData.qurban.groups : [],
    [internalData?.qurban?.groups],
  );
  const qurbanPayments = useMemo(
    () =>
      Array.isArray(internalData?.qurbanPayments) ? internalData.qurbanPayments : [],
    [internalData?.qurbanPayments],
  );

  const normalizedRows = useMemo(() => {
    return rows.map((r: QurbanRow) => {
      const target = safeNumber(r.targetBayar);
      const paid = safeNumber(r.totalBayar);
      const remaining = calcRemaining(target, paid, r.sisaBayar);
      const status = calcSmartStatus(target, paid, r.sisaBayar);

      return {
        ...r,
        targetBayarSmart: target,
        totalBayarSmart: paid,
        sisaBayarSmart: remaining,
        statusBayarSmart: status,
      };
    });
  }, [rows]);

  const effectiveSelectedGroup = selectedGroup || groups?.[0]?.groupName || '';

  const filteredRows = useMemo(() => {
    if (!effectiveSelectedGroup) return normalizedRows;
    return normalizedRows.filter((r) => r.grup === effectiveSelectedGroup);
  }, [normalizedRows, effectiveSelectedGroup]);

  const selected = useMemo(() => {
    return normalizedRows.find((r) => r.shohibulId === selectedShohibulId) || null;
  }, [normalizedRows, selectedShohibulId]);

  const quickAmounts = useMemo(() => {
    if (!selected) return [];
    return buildQuickAmounts(selected.sisaBayarSmart);
  }, [selected]);
    if (!internalData) {
    return (
      <div className="rounded-[28px] border border-border bg-card p-5 shadow-card">
        <div className="text-sm text-muted-foreground">Memuat data qurban...</div>
      </div>
    );
  }

  async function handleSubmit() {
    if (!user || !selected) return;

    const parsed = Number(nominal || '0');
    if (!parsed || parsed <= 0) {
      toast({
        title: 'Nominal belum diisi',
        description: 'Masukkan nominal pembayaran dulu.',
        variant: 'destructive',
      });
      nominalRef.current?.focus();
      return;
    }

    if (selected.sisaBayarSmart > 0 && parsed > selected.sisaBayarSmart) {
      toast({
        title: 'Nominal melebihi sisa bayar',
        description: `Maksimal ${formatCurrency(selected.sisaBayarSmart)} untuk ${selected.nama}.`,
        variant: 'destructive',
      });
      nominalRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await apiSubmitQurbanPayment({
        email: user.email,
        tanggal: today,
        shohibulId: selected.shohibulId,
        nominalBayar: parsed,
        metode,
        keterangan: '',
      });

      if (res.success) {
        toast({
          title: 'Pembayaran berhasil disimpan',
          description:
            typeof res.result?.paymentId === 'string'
              ? res.result.paymentId
              : 'Data masuk ke riwayat pembayaran.',
        });

        setNominal('');
        setJustSaved(true);
        await refreshInternal();

        setTimeout(() => {
          setJustSaved(false);
          nominalRef.current?.focus();
        }, 1400);
      } else {
        toast({
          title: res.message || 'Gagal menyimpan pembayaran',
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      toast({
        title: getErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleSelectShohibul(shohibulId: string, groupName: string) {
    setSelectedGroup(groupName);
    setSelectedShohibulId(shohibulId);
    setNominal('');
    setView('select');

    setTimeout(() => {
      nominalRef.current?.focus();
    }, 120);
  }

  function handleBackToList() {
    setSelectedShohibulId('');
    setNominal('');
    setJustSaved(false);
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {!selected ? (
        <>
          {/* Group chips */}
          <section className="rounded-[28px] border border-border bg-card p-4 shadow-card">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {groups.map((g: QurbanGroup) => {
                const active = effectiveSelectedGroup === g.groupName;
                return (
                  <button
                    key={g.groupName}
                    type="button"
                    onClick={() => setSelectedGroup(g.groupName)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-soft'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {g.groupName}
                  </button>
                );
              })}
            </div>
          </section>

          {/* List shohibul */}
          <section className="rounded-[28px] border border-border bg-card p-4 shadow-card">
            <div className="space-y-2">
              {filteredRows.map((r) => {
                const isLunas = r.statusBayarSmart === 'Lunas';
                const isDp = r.statusBayarSmart === 'DP';

                return (
                  <button
                    key={r.shohibulId}
                    type="button"
                    onClick={() => handleSelectShohibul(r.shohibulId, r.grup)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-foreground">
                          {r.nama}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isLunas
                                ? 'bg-primary/10 text-primary'
                                : isDp
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {r.statusBayarSmart}
                          </span>

                          <span className="text-xs font-semibold text-destructive">
                            Kurang {formatCurrency(r.sisaBayarSmart)}
                          </span>
                        </div>

                        <div className="mt-1 text-[11px] text-muted-foreground">
                          Sudah bayar {formatCurrency(r.totalBayarSmart)} / {formatCurrency(r.targetBayarSmart)}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-sm font-bold text-foreground">
                          {formatCurrency(r.sisaBayarSmart)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">kurang</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Optional history */}
          {qurbanPayments.length > 0 && view === 'history' && (
            <section className="rounded-[28px] border border-border bg-card p-4 shadow-card">
              <div className="space-y-3">
                {qurbanPayments.map((p: QurbanPayment) => (
                  <div
                    key={p.paymentId}
                    className="flex items-start justify-between gap-3 border-b border-border/40 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">{p.namaShohibul}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {p.grup} · {p.metode}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-primary">
                      +{formatCurrency(safeNumber(p.nominalBayar))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          {/* Back */}
          <button
            type="button"
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 text-sm font-bold text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Ganti Shohibul
          </button>

          {/* Smart summary card */}
          <section className="rounded-[28px] border border-border bg-card p-5 shadow-card">
            <div className="space-y-4">
              <div>
                <div className="text-xl font-black tracking-tight text-foreground">
                  {selected.nama}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold text-muted-foreground">
                    🐄 {selected.grup}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      selected.statusBayarSmart === 'Lunas'
                        ? 'bg-primary/10 text-primary'
                        : selected.statusBayarSmart === 'DP'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {selected.statusBayarSmart}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-muted/35 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Target
                  </div>
                  <div className="mt-1 text-sm font-bold text-foreground">
                    {formatCurrency(selected.targetBayarSmart)}
                  </div>
                </div>

                <div className="rounded-2xl bg-primary/5 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Sudah
                  </div>
                  <div className="mt-1 text-sm font-bold text-primary">
                    {formatCurrency(selected.totalBayarSmart)}
                  </div>
                </div>

                <div className="rounded-2xl bg-destructive/5 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Kurang
                  </div>
                  <div className="mt-1 text-sm font-bold text-destructive">
                    {formatCurrency(selected.sisaBayarSmart)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick amount */}
          {selected.sisaBayarSmart > 0 && quickAmounts.length > 0 && (
            <section className="rounded-[28px] border border-border bg-card p-4 shadow-card">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {quickAmounts.map((amount) => {
                  const isPas = amount === selected.sisaBayarSmart;
                  const active = Number(nominal || '0') === amount;

                  return (
                    <button
                      key={`${amount}-${isPas ? 'pas' : 'chip'}`}
                      type="button"
                      onClick={() => setNominal(String(amount))}
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                        active
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : isPas
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {formatQuickLabel(amount, isPas)}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Nominal input */}
          <section className="rounded-[28px] border border-border bg-card p-4 shadow-card space-y-4">
            <div className="rounded-[24px] border border-primary/25 bg-background p-3">
              <Input
                ref={nominalRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                enterKeyHint="done"
                value={nominal}
                onChange={(e) => setNominal(onlyDigits(e.target.value))}
                placeholder="0"
                className="h-16 border-0 bg-transparent px-1 text-4xl font-black tracking-tight text-foreground shadow-none focus-visible:ring-0"
              />
              <div className="mt-1 px-1 text-sm font-semibold text-muted-foreground">
                {Number(nominal || '0') > 0
                  ? formatCurrency(Number(nominal))
                  : 'Masukkan nominal pembayaran'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(['Cash', 'Transfer'] as PayMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetode(m)}
                  className={`h-14 rounded-2xl text-base font-bold transition-all ${
                    metode === m
                      ? 'bg-primary text-primary-foreground shadow-soft'
                      : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {justSaved && (
              <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Pembayaran tersimpan. Siap input berikutnya.
              </div>
            )}

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selected.sisaBayarSmart <= 0}
              className="h-14 w-full rounded-full text-base font-bold shadow-soft"
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

            {selected.sisaBayarSmart <= 0 && (
              <div className="text-center text-sm font-semibold text-primary">
                Shohibul ini sudah lunas.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
