import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { apiSubmitTransaction, getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Send,
  CalendarDays,
  Tag,
  CreditCard,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  CheckCircle2,
  Zap,
  Wallet,
  X,
  Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type TransactionMode = 'HARIAN' | 'RAMADHAN' | 'QURBAN';
type TransactionType = 'PEMASUKAN' | 'PENGELUARAN';

const MANUAL_CATEGORY = '__LAINNYA__';

const QUICK_CATEGORIES: Record<string, string[]> = {
  HARIAN_PEMASUKAN: ['Kencleng Keliling', 'Infaq Transfer', 'Donasi Warga'],
  HARIAN_PENGELUARAN: ['Token Listrik', 'Petugas Kebersihan', 'Kegiatan Mushola'],
  RAMADHAN_PEMASUKAN: ['Kencleng Tarawih', 'Infaq Ramadhan', 'Donasi Ramadhan'],
  RAMADHAN_PENGELUARAN: [
    'Honor Imam Kultum Tarawih',
    'Buka Puasa Bersama',
    'Lomba Ramadhan Anak TPA',
    'Halal Bihalal',
  ],
  QURBAN_PEMASUKAN: ['Tambahan Biaya Potong Qurban', 'Donasi Qurban', 'Subsidi Qurban'],
  QURBAN_PENGELUARAN: [
    'Pembelian Sapi',
    'Upah Jagal',
    'Perlengkapan',
    'Tenaga Bantu',
    'Konsumsi',
  ],
};

const CONTEXT_OPTIONS = [
  ['HARIAN', 'Operasional'],
  ['RAMADHAN', 'Ramadhan'],
  ['QURBAN', 'Qurban'],
] as const satisfies readonly [TransactionMode, string][];

const METHOD_OPTIONS = ['Cash', 'Transfer'] as const;

const KETERANGAN_PLACEHOLDERS: Record<string, string> = {
  'Pembelian Sapi': 'Contoh: sapi #2',
  'Upah Jagal': 'Contoh: Jagal Juleha',
  Perlengkapan: 'Contoh: plastik, tali',
  'Tenaga Bantu': 'Contoh: Bang Ari',
  Konsumsi: 'Contoh: konsumsi panitia qurban',
};

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];
const STORAGE_KEY = 'dkm_input_preferences_v1';

function formatCompactAmount(value: number) {
  if (value >= 1000000) return `${value / 1000000}jt`;
  if (value >= 1000) return `${value / 1000}rb`;
  return `${value}`;
}

function sanitizeNumericInput(value: string) {
  return value.replace(/[^\d]/g, '');
}

function createClientRequestId(prefix: string) {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

export function InputScreen() {
  const { user, refreshInternal } = useAuth();
  const { toast } = useToast();
  const isBendahara = user?.role === 'BENDAHARA';

  const nominalRef = useRef<HTMLInputElement | null>(null);
  const categoryRef = useRef<HTMLInputElement | null>(null);
  const pendingSubmitRef = useRef<{ fingerprint: string; clientRequestId: string } | null>(null);

  const [mode, setMode] = useState<TransactionMode>('HARIAN');
  const [jenis, setJenis] = useState<TransactionType>('PEMASUKAN');
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split('T')[0]);
  const [kategori, setKategori] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [metode, setMetode] = useState<'Cash' | 'Transfer'>('Cash');
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        mode?: TransactionMode;
        jenis?: TransactionType;
        metode?: 'Cash' | 'Transfer';
        kategori?: string;
      };

      if (saved.mode === 'HARIAN' || saved.mode === 'RAMADHAN' || saved.mode === 'QURBAN') {
        setMode(saved.mode);
      }
      if (saved.jenis === 'PEMASUKAN' || saved.jenis === 'PENGELUARAN') setJenis(saved.jenis);
      if (saved.metode === 'Cash' || saved.metode === 'Transfer') setMetode(saved.metode);
      if (typeof saved.kategori === 'string') setKategori(saved.kategori);
    } catch {
      // ignore invalid localStorage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode,
          jenis,
          metode,
          kategori: kategori.trim(),
        }),
      );
    } catch {
      // ignore storage failure
    }
  }, [mode, jenis, metode, kategori]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      nominalRef.current?.focus();
    }, 150);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!manualMode) return;
    const timer = window.setTimeout(() => {
      categoryRef.current?.focus();
    }, 60);

    return () => window.clearTimeout(timer);
  }, [manualMode]);

  const event =
    mode === 'RAMADHAN' ? 'Ramadhan' : mode === 'QURBAN' ? 'Qurban' : 'Operasional';
  const chipKey = `${mode}_${jenis}`;
  const chips = QUICK_CATEGORIES[chipKey] || [];
  const nominalValue = Number(nominal || 0);
  const effectiveKategori = manualMode ? manualCategory.trim() : kategori.trim();
  const isQurbanContext = mode === 'QURBAN';
  const qurbanImpactNote =
    jenis === 'PENGELUARAN'
      ? 'Saldo Qurban berkurang.'
      : 'Saldo Qurban bertambah.';
  const contextIndex = CONTEXT_OPTIONS.findIndex(([value]) => value === mode);
  const methodIndex = METHOD_OPTIONS.findIndex((value) => value === metode);
  const keteranganPlaceholder =
    KETERANGAN_PLACEHOLDERS[effectiveKategori] ||
    (isQurbanContext
      ? 'Contoh: detail transaksi qurban'
      : 'Contoh: bayar listrik bulan April');

  const canSubmit = useMemo(() => {
    return Boolean(
      isBendahara && user && effectiveKategori && nominalValue > 0 && !submitting,
    );
  }, [isBendahara, user, effectiveKategori, nominalValue, submitting]);

  if (!isBendahara) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="relative overflow-hidden rounded-[28px] border border-border bg-card p-[clamp(1rem,4vw,1.25rem)] shadow-card">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(22,101,52,0.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,246,241,0.98))]" />
          <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Akses Dibatasi
          </div>
          <h3 className="mt-2 text-[clamp(1.05rem,4.8vw,1.25rem)] font-black tracking-tight text-foreground">
            Form input hanya untuk bendahara
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Pengurus tetap bisa memantau rekap dan progres qurban, tetapi tidak bisa
            membuat transaksi operasional maupun input pembayaran qurban.
          </p>
          </div>
        </div>
      </div>
    );
  }

  const resetFormSmart = useCallback(() => {
    setTanggal(new Date().toISOString().split('T')[0]);
    setNominal('');
    setKeterangan('');
    setJustSaved(true);

    window.setTimeout(() => {
      setJustSaved(false);
      nominalRef.current?.focus();
    }, 1400);
  }, []);

  const handleQuickAmount = useCallback((amount: number) => {
    setNominal(String(amount));
  }, []);

  const handleQuickCategory = useCallback((value: string) => {
    if (value === MANUAL_CATEGORY) {
      setKategori('');
      setManualCategory('');
      setManualMode(true);
      return;
    }

    setManualMode(false);
    setManualCategory('');
    setKategori(value);
    window.setTimeout(() => {
      nominalRef.current?.focus();
    }, 50);
  }, []);

  const clearNominal = useCallback(() => {
    setNominal('');
    nominalRef.current?.focus();
  }, []);

  const handleContextChange = useCallback((value: TransactionMode) => {
    setMode(value);
    setKategori('');
    setManualCategory('');
    setManualMode(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user) return;

    if (!effectiveKategori) {
      toast({ title: 'Jenis transaksi wajib diisi', variant: 'destructive' });
      if (manualMode) categoryRef.current?.focus();
      return;
    }

    const num = Number(nominal);
    if (!num || num <= 0) {
      toast({ title: 'Nominal harus lebih dari 0', variant: 'destructive' });
      nominalRef.current?.focus();
      return;
    }

    const submitFingerprint = JSON.stringify({
      email: user.email,
      tanggal,
      jenis,
      kategori: effectiveKategori,
      event,
      metode,
      nominal: num,
      keterangan: keterangan.trim(),
    });
    const pending =
      pendingSubmitRef.current?.fingerprint === submitFingerprint
        ? pendingSubmitRef.current
        : {
            fingerprint: submitFingerprint,
            clientRequestId: createClientRequestId('TRX'),
          };
    pendingSubmitRef.current = pending;

    setSubmitting(true);

    try {
      const res = await apiSubmitTransaction({
        email: user.email,
        clientRequestId: pending.clientRequestId,
        tanggal,
        jenis,
        kategori: effectiveKategori,
        event,
        metode,
        nominal: num,
        keterangan: keterangan.trim(),
      });

      if (res.success) {
        const transactionId =
          typeof res.result?.transactionId === 'string'
            ? res.result.transactionId
            : 'Data masuk ke rekap';
        const isDuplicate = res.result?.duplicate === true;
        const duplicateSummary = [
          transactionId,
          effectiveKategori,
          formatCurrency(num),
          keterangan.trim(),
        ]
          .filter(Boolean)
          .join(' • ');

        toast({
          title: isDuplicate ? 'Transaksi ini sudah tersimpan' : 'Transaksi berhasil disimpan',
          description: isDuplicate ? duplicateSummary : transactionId,
        });
        pendingSubmitRef.current = null;
        resetFormSmart();
        refreshInternal();
      } else {
        toast({
          title: res.message || 'Gagal menyimpan',
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
  }, [
    user,
    effectiveKategori,
    nominal,
    tanggal,
    jenis,
    event,
    metode,
    keterangan,
    toast,
    refreshInternal,
    resetFormSmart,
    manualMode,
  ]);

  return (
    <div className="space-y-4 pb-4">
      <div className="relative overflow-hidden rounded-[28px] border bg-card/90 backdrop-blur-sm shadow-soft">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(22,101,52,0.10),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,246,241,0.95))]" />
        <div className="relative space-y-4 p-[clamp(1rem,4vw,1.25rem)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                <Zap className="h-3.5 w-3.5" />
                Mode Cepat
              </div>
              <h3 className="mt-3 text-[clamp(1.1rem,4.8vw,1.25rem)] font-black tracking-tight text-foreground">
                Input Transaksi
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pilih pemasukan atau pengeluaran, isi nominal, lalu simpan.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-muted/50 px-3 py-2 text-xs font-bold text-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              {event}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Konteks Saldo
            </div>
            <div className="relative rounded-full border border-border/70 bg-muted/55 p-1 shadow-inner">
              <div
                className={`absolute bottom-1 top-1 rounded-full shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition-all duration-300 ease-out ${
                  isQurbanContext
                    ? 'bg-gradient-to-b from-amber-500 to-amber-600'
                    : 'bg-gradient-to-b from-primary to-dkm-green-strong'
                }`}
                style={{
                  width: 'calc((100% - 0.5rem) / 3)',
                  transform: `translateX(${Math.max(0, contextIndex) * 100}%)`,
                }}
              />
              <div className="relative grid grid-cols-3">
                {CONTEXT_OPTIONS.map(([value, label]) => {
                const active = mode === value;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleContextChange(value)}
                    className={`relative z-10 min-h-[42px] rounded-full px-2 py-2 text-xs font-black transition-all duration-300 active:scale-[0.97] ${
                      active
                        ? 'text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setJenis('PEMASUKAN')}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all duration-200 ${
                jenis === 'PEMASUKAN'
                  ? 'border-primary bg-dkm-green-soft text-primary'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Pemasukan
            </button>

            <button
              type="button"
              onClick={() => setJenis('PENGELUARAN')}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all duration-200 ${
                jenis === 'PENGELUARAN'
                  ? 'border-destructive bg-destructive/10 text-destructive'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Pengeluaran
            </button>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[28px] border bg-card shadow-soft">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.06),transparent_28%)] pointer-events-none" />
        <div className="relative space-y-5 p-[clamp(1rem,4vw,1.25rem)]">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Nominal
              </div>

              {nominalValue > 0 && (
                <button
                  type="button"
                  onClick={clearNominal}
                  className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>

            <div className="rounded-[22px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,246,241,0.86))] px-4 py-3 shadow-inner">
              <Input
                ref={nominalRef}
                inputMode="numeric"
                value={nominal}
                onChange={(e) => setNominal(sanitizeNumericInput(e.target.value))}
                placeholder="0"
                className="mobile-money h-12 border-0 bg-transparent px-0 text-[clamp(1.75rem,7.4vw,2.1rem)] font-black tracking-tight shadow-none focus-visible:ring-0"
              />
              <div className="mt-1 min-h-[19px] text-sm font-semibold text-muted-foreground">
                {nominalValue > 0 ? formatCurrency(nominalValue) : 'Masukkan nominal transaksi'}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {QUICK_AMOUNTS.map((amount) => {
                const active = Number(nominal) === amount;
                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickAmount(amount)}
                    className={`min-h-9 rounded-full border px-1 text-xs font-black transition-all duration-200 active:scale-[0.97] ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground shadow-[0_10px_22px_rgba(22,101,52,0.16)]'
                        : 'border-transparent bg-muted/55 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {formatCompactAmount(amount)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <Tag className="h-4 w-4" />
                {isQurbanContext ? 'Pos Qurban' : 'Kategori'}
              </div>
              {isQurbanContext && (
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {qurbanImpactNote}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {chips.map((c) => {
                const active = !manualMode && kategori === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleQuickCategory(c)}
                    className={`min-h-10 rounded-full border px-3 text-xs font-black transition-all duration-200 active:scale-[0.98] ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground shadow-[0_10px_22px_rgba(22,101,52,0.16)]'
                        : 'border-transparent bg-muted/55 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleQuickCategory(MANUAL_CATEGORY)}
                className={`min-h-10 rounded-full border px-3 text-xs font-black transition-all duration-200 active:scale-[0.98] ${
                  manualMode
                    ? 'border-primary bg-primary text-primary-foreground shadow-[0_10px_22px_rgba(22,101,52,0.16)]'
                    : 'border-transparent bg-muted/55 text-muted-foreground hover:bg-muted'
                }`}
              >
                Lainnya
              </button>
            </div>

            {manualMode && (
              <Input
                ref={categoryRef}
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                placeholder="Tulis kategori lain"
                className="h-12 rounded-2xl bg-background"
              />
            )}

            {manualMode && manualCategory.trim() && (
              <div className="text-xs text-muted-foreground">
                Kategori manual:{' '}
                <span className="font-semibold text-foreground">{manualCategory.trim()}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Metode
            </div>

            <div className="relative rounded-full border border-border/70 bg-muted/55 p-1 shadow-inner">
              <div
                className="absolute bottom-1 top-1 rounded-full bg-gradient-to-b from-primary to-dkm-green-strong shadow-[0_10px_24px_rgba(22,101,52,0.18)] transition-all duration-300 ease-out"
                style={{
                  width: 'calc((100% - 0.25rem) / 2)',
                  transform: `translateX(${Math.max(0, methodIndex) * 100}%)`,
                }}
              />
              <div className="relative grid grid-cols-2">
              {METHOD_OPTIONS.map((m) => {
                const active = metode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setMetode(m)}
                    className={`relative z-10 min-h-[42px] rounded-full px-4 py-2 text-sm font-black transition-all duration-300 active:scale-[0.97] ${
                      active
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Tanggal
              </div>
              <Input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="h-12 rounded-2xl bg-background"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Keterangan
                </div>
                <span className="rounded-full bg-muted/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Opsional
                </span>
              </div>
              <div className="rounded-[22px] border bg-background p-3 transition-colors focus-within:border-primary/35 focus-within:bg-card">
                <Input
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder={keteranganPlaceholder}
                  className="h-11 border-0 bg-transparent px-1 text-[15px] font-semibold shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {event}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                jenis === 'PEMASUKAN'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {jenis}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {metode}
            </span>
          </div>

          {justSaved && (
            <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Transaksi tersimpan. Siap input berikutnya.
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-14 w-full rounded-full bg-primary text-base font-bold shadow-[0_10px_24px_rgba(22,101,52,0.22)] transition-all active:scale-[0.98] disabled:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Simpan Transaksi
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border bg-card/70 px-4 py-3 text-sm text-muted-foreground">
        Pilih kategori yang paling mendekati. Jika perlu penjelasan lebih rinci,
        tulis di keterangan.
      </div>
    </div>
  );
}
