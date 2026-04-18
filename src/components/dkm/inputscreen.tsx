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
  ChevronDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type TransactionMode = 'HARIAN' | 'RAMADHAN';
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

export function InputScreen() {
  const { user, refreshInternal } = useAuth();
  const { toast } = useToast();
  const isBendahara = user?.role === 'BENDAHARA';

  const nominalRef = useRef<HTMLInputElement | null>(null);
  const categoryRef = useRef<HTMLInputElement | null>(null);

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
  const [showContextPicker, setShowContextPicker] = useState(false);

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

      if (saved.mode === 'HARIAN' || saved.mode === 'RAMADHAN') setMode(saved.mode);
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

  const event = mode === 'RAMADHAN' ? 'Ramadhan' : 'Operasional';
  const chipKey = `${mode}_${jenis}`;
  const chips = QUICK_CATEGORIES[chipKey] || [];
  const nominalValue = Number(nominal || 0);
  const effectiveKategori = manualMode ? manualCategory.trim() : kategori.trim();

  const canSubmit = useMemo(() => {
    return Boolean(
      isBendahara && user && effectiveKategori && nominalValue > 0 && !submitting,
    );
  }, [isBendahara, user, effectiveKategori, nominalValue, submitting]);

  if (!isBendahara) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="relative overflow-hidden rounded-[28px] border border-border bg-card p-5 shadow-card">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(22,101,52,0.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,246,241,0.98))]" />
          <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Akses Dibatasi
          </div>
          <h3 className="mt-2 text-xl font-black tracking-tight text-foreground">
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
    setShowContextPicker(false);
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

    setSubmitting(true);

    try {
      const res = await apiSubmitTransaction({
        email: user.email,
        tanggal,
        jenis,
        kategori: effectiveKategori,
        event,
        metode,
        nominal: num,
        keterangan: keterangan.trim(),
      });

      if (res.success) {
        toast({
          title: 'Transaksi berhasil disimpan',
          description:
            typeof res.result?.transactionId === 'string'
              ? res.result.transactionId
              : 'Data masuk ke rekap',
        });
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
        <div className="relative p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                <Zap className="h-3.5 w-3.5" />
                Mode Cepat
              </div>
              <h3 className="mt-3 text-xl font-black tracking-tight text-foreground">
                Input Transaksi
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pilih pemasukan atau pengeluaran, isi nominal, lalu simpan.
              </p>
            </div>

            <div className="relative min-w-[128px] text-right">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Konteks
              </div>
              <button
                type="button"
                onClick={() => setShowContextPicker((prev) => !prev)}
                className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-bold text-foreground hover:bg-muted/50"
              >
                {event}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              {showContextPicker && (
                <div className="absolute right-0 top-full z-10 mt-2 w-40 rounded-2xl border border-border bg-card p-2 text-left shadow-soft">
                  <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Pilih konteks
                  </div>
                  {([
                    ['HARIAN', 'Operasional'],
                    ['RAMADHAN', 'Ramadhan'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleContextChange(value)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                        mode === value
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <span>{label}</span>
                      {mode === value && <span className="text-xs font-bold">Aktif</span>}
                    </button>
                  ))}
                </div>
              )}
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
        <div className="relative p-4 sm:p-5 space-y-5">
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

            <div className="rounded-[24px] border bg-background p-3">
              <Input
                ref={nominalRef}
                inputMode="numeric"
                value={nominal}
                onChange={(e) => setNominal(sanitizeNumericInput(e.target.value))}
                placeholder="0"
                className="h-14 border-0 bg-transparent px-1 text-3xl font-black tracking-tight shadow-none focus-visible:ring-0"
              />
              <div className="mt-2 px-1 text-sm font-semibold text-muted-foreground min-h-[20px]">
                {nominalValue > 0 ? formatCurrency(nominalValue) : 'Masukkan nominal transaksi'}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {QUICK_AMOUNTS.map((amount) => {
                const active = Number(nominal) === amount;
                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickAmount(amount)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {formatCompactAmount(amount)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Tag className="h-4 w-4" />
              Uang Ini Untuk Apa?
            </div>
            <p className="text-sm text-muted-foreground">
              Pilih jenis transaksi yang paling sesuai.
            </p>

            <div className="flex flex-wrap gap-2">
              {chips.map((c) => {
                const active = !manualMode && kategori === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleQuickCategory(c)}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-soft'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleQuickCategory(MANUAL_CATEGORY)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  manualMode
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
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

            {!manualMode && kategori.trim() && (
              <div className="text-xs text-muted-foreground">
                Kategori terpilih:{' '}
                <span className="font-semibold text-foreground">{kategori.trim()}</span>
              </div>
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

            <div className="grid grid-cols-2 gap-2">
              {(['Cash', 'Transfer'] as const).map((m) => {
                const active = metode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetode(m)}
                    className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <FileText className="h-4 w-4" />
                Keterangan
              </div>
              <Input
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: bayar listrik bulan April"
                className="h-12 rounded-2xl bg-background"
              />
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
