import { useState, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { apiSubmitQurbanPayment } from '@/lib/api';
import { formatCurrency, safeNumber } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function sanitize(value: string) {
  return value.replace(/[^\d]/g, '');
}

export function QurbanScreen() {
  const { user, internalData, refreshInternal } = useAuth();
  const { toast } = useToast();

  const nominalRef = useRef<HTMLInputElement | null>(null);

  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [nominal, setNominal] = useState('');
  const [metode, setMetode] = useState<'Cash' | 'Transfer'>('Cash');
  const [submitting, setSubmitting] = useState(false);

  const rows = internalData?.qurbanRows || [];
  const groups = internalData?.qurban?.groups || [];

  const groupRows = useMemo(() => {
    if (!selectedGroup) return rows;
    return rows.filter(r => r.grup === selectedGroup);
  }, [rows, selectedGroup]);

  const selected = rows.find(r => r.shohibulId === selectedId);

  const sisa = Math.max(0, safeNumber(selected?.sisaBayar));

  const quick = [100000, 500000, 1000000, sisa]
    .map(v => Math.min(v, sisa))
    .filter(v => v > 0);

  // =========================
  // SUBMIT
  // =========================
  async function handleSubmit() {
    if (!user || !selectedId) return;

    const num = Number(nominal);
    if (!num) return;

    setSubmitting(true);
    try {
      const res = await apiSubmitQurbanPayment({
        email: user.email,
        tanggal: new Date().toISOString().split('T')[0],
        shohibulId: selectedId,
        nominalBayar: num,
        metode,
        keterangan: '',
      });

      if (res.success) {
        toast({ title: 'Berhasil disimpan' });
        setNominal('');
        await refreshInternal();
      } else {
        toast({ title: 'Gagal', variant: 'destructive' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  // =========================
  // MODE 1 — SELECT
  // =========================
  if (!selectedId) {
    return (
      <div className="space-y-4">

        {/* GROUP */}
        <div className="flex gap-2 overflow-x-auto">
          {groups.map(g => (
            <button
              key={g.groupName}
              onClick={() => setSelectedGroup(g.groupName)}
              className={`px-4 py-2 rounded-full text-xs font-bold ${
                selectedGroup === g.groupName
                  ? 'bg-primary text-white'
                  : 'bg-muted'
              }`}
            >
              {g.groupName}
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className="space-y-2">
          {groupRows.map(r => {
            const sisa = Math.max(0, safeNumber(r.sisaBayar));

            return (
              <button
                key={r.shohibulId}
                onClick={() => {
                  setSelectedId(r.shohibulId);
                  setTimeout(() => nominalRef.current?.focus(), 100);
                }}
                className="w-full text-left p-4 rounded-2xl border bg-white"
              >
                <div className="flex justify-between">
                  <div>
                    <div className="font-bold text-sm">{r.nama}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.statusBayar} · Sisa {formatCurrency(sisa)}
                    </div>
                  </div>

                  <div className="text-sm font-bold">
                    {formatCurrency(r.totalBayar)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================
  // MODE 2 — QUICK PAY
  // =========================
  return (
    <div className="space-y-4">

      {/* HEADER */}
      <button
        onClick={() => setSelectedId('')}
        className="flex items-center gap-2 text-sm font-bold"
      >
        <ArrowLeft className="w-4 h-4" />
        Ganti Shohibul
      </button>

      <div className="p-4 rounded-2xl border bg-white space-y-2">
        <div className="font-bold">{selected?.nama}</div>

        <div className="text-xs text-muted-foreground">
          🐄 {selected?.grup} · {selected?.statusBayar}
        </div>

        <div className="text-sm text-destructive font-bold">
          Sisa {formatCurrency(sisa)}
        </div>
      </div>

      {/* QUICK AMOUNT */}
      <div className="flex gap-2 overflow-x-auto">
        {quick.map(v => (
          <button
            key={v}
            onClick={() => setNominal(String(v))}
            className="px-4 py-2 rounded-full text-xs bg-muted"
          >
            {v === sisa ? 'Pas' : `${v / 1000}rb`}
          </button>
        ))}
      </div>

      {/* NOMINAL */}
      <div className="p-4 rounded-2xl border">
        <Input
          ref={nominalRef}
          value={nominal}
          onChange={e => setNominal(sanitize(e.target.value))}
          placeholder="0"
          className="text-3xl font-bold"
        />
      </div>

      {/* METODE */}
      <div className="flex gap-2">
        {['Cash', 'Transfer'].map(m => (
          <button
            key={m}
            onClick={() => setMetode(m as any)}
            className={`flex-1 py-3 rounded-xl font-bold ${
              metode === m ? 'bg-primary text-white' : 'bg-muted'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* SUBMIT */}
      <Button onClick={handleSubmit} disabled={submitting} className="h-14">
        {submitting ? <Loader2 className="animate-spin" /> : <Send />}
        Simpan
      </Button>
    </div>
  );
}
