import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { apiSubmitTransaction } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Send, CalendarDays, Tag, CreditCard, FileText,
  ArrowUpCircle, ArrowDownCircle, Loader2, Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type TransactionMode = 'HARIAN' | 'RAMADHAN' | 'QURBAN';

const QUICK_CATEGORIES: Record<string, string[]> = {
  HARIAN_PEMASUKAN: ['Kencleng Keliling', 'Infaq Transfer'],
  HARIAN_PENGELUARAN: ['Token Listrik', 'Petugas Kebersihan'],
  RAMADHAN_PEMASUKAN: ['Kencleng Tarawih', 'Infaq Ramadhan'],
  RAMADHAN_PENGELUARAN: ['Honor Imam Kultum Tarawih', 'Buka Puasa Bersama', 'Lomba Ramadhan Anak TPA', 'Halal Bihalal'],
};

export function InputScreen() {
  const { user, refreshInternal } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<TransactionMode>('HARIAN');
  const [jenis, setJenis] = useState<'PEMASUKAN' | 'PENGELUARAN'>('PEMASUKAN');
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split('T')[0]);
  const [kategori, setKategori] = useState('');
  const [metode, setMetode] = useState('Cash');
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const event = mode === 'RAMADHAN' ? 'Ramadhan' : 'Operasional';
  const chipKey = `${mode}_${jenis}`;
  const chips = QUICK_CATEGORIES[chipKey] || [];

  const resetForm = () => {
    setTanggal(new Date().toISOString().split('T')[0]);
    setKategori('');
    setMetode('Cash');
    setNominal('');
    setKeterangan('');
  };

  const handleSubmit = useCallback(async () => {
    if (!user) return;
    if (!kategori.trim()) return toast({ title: 'Kategori wajib diisi', variant: 'destructive' });
    const num = Number(nominal);
    if (!num || num <= 0) return toast({ title: 'Nominal harus lebih dari 0', variant: 'destructive' });

    setSubmitting(true);
    try {
      const res = await apiSubmitTransaction({
        email: user.email,
        tanggal,
        jenis,
        kategori: kategori.trim(),
        event,
        metode,
        nominal: num,
        keterangan: keterangan.trim(),
      });
      if (res.success) {
        toast({ title: 'Transaksi berhasil disimpan ✓', description: res.result?.transactionId });
        resetForm();
        refreshInternal();
      } else {
        toast({ title: res.message || 'Gagal menyimpan', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: err.message || 'Gagal menyimpan', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [user, kategori, nominal, tanggal, jenis, event, metode, keterangan, toast, refreshInternal]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Mode Tabs */}
      <div className="flex gap-2 bg-muted/50 rounded-2xl p-1">
        {(['HARIAN', 'RAMADHAN'] as TransactionMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              mode === m
                ? 'bg-card text-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m === 'HARIAN' ? '📋 Harian' : '🌙 Ramadhan'}
          </button>
        ))}
      </div>

      {/* Jenis Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setJenis('PEMASUKAN')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all duration-200 border-2 ${
            jenis === 'PEMASUKAN'
              ? 'border-primary bg-dkm-green-soft text-primary'
              : 'border-border bg-card text-muted-foreground'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          Pemasukan
        </button>
        <button
          onClick={() => setJenis('PENGELUARAN')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all duration-200 border-2 ${
            jenis === 'PENGELUARAN'
              ? 'border-destructive bg-destructive/10 text-destructive'
              : 'border-border bg-card text-muted-foreground'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          Pengeluaran
        </button>
      </div>

      {/* Form Card */}
      <section className="bg-card rounded-3xl border border-border p-5 shadow-card space-y-4">
        {/* Quick Chips */}
        {chips.length > 0 && (
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Kategori Cepat
            </label>
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c}
                  onClick={() => setKategori(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    kategori === c
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tanggal */}
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" /> Tanggal
          </label>
          <Input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="rounded-xl h-11 bg-background"
          />
        </div>

        {/* Kategori */}
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" /> Kategori
          </label>
          <Input
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            placeholder="Nama kategori..."
            className="rounded-xl h-11 bg-background"
          />
        </div>

        {/* Metode */}
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Metode
          </label>
          <div className="flex gap-2">
            {['Cash', 'Transfer'].map((m) => (
              <button
                key={m}
                onClick={() => setMetode(m)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  metode === m
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Nominal */}
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            💰 Nominal
          </label>
          <Input
            type="number"
            value={nominal}
            onChange={(e) => setNominal(e.target.value)}
            placeholder="0"
            className="rounded-xl h-12 bg-background text-lg font-bold"
          />
          {Number(nominal) > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(nominal)}</p>
          )}
        </div>

        {/* Keterangan */}
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Keterangan (opsional)
          </label>
          <Input
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Catatan tambahan..."
            className="rounded-xl h-11 bg-background"
          />
        </div>

        {/* Event badge */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2.5 py-1 rounded-full bg-muted/50 font-semibold">{event}</span>
          <span className="px-2.5 py-1 rounded-full bg-muted/50 font-semibold">{jenis}</span>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-12 rounded-2xl bg-gradient-to-b from-primary to-dkm-green-strong
                     text-primary-foreground font-bold text-sm shadow-soft
                     transition-all duration-200 active:scale-[0.98]"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
          ) : (
            <><Send className="w-4 h-4" /> Simpan Transaksi</>
          )}
        </Button>
      </section>
    </div>
  );
}
