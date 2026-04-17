import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { PublicData, Transaction } from '@/lib/api';
import { formatCurrency, safeNumber } from '@/lib/format';
import { ProgressBar } from './progressbar';
import {
  Wallet,
  Beef,
  Landmark,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock3,
  Loader2,
  AlertCircle,
} from 'lucide-react';

type RekapFilter = 'OPERASIONAL' | 'QURBAN' | 'SEMUA';

type TransactionWithBucket = Transaction & { bucket: RekapFilter; deskripsi?: string };

function inferBucket(trx: Transaction): RekapFilter {
  const event = String(trx?.event || '').toUpperCase();
  const kategori = String(trx?.kategori || '').toUpperCase();
  const detail = String(trx?.keterangan || '').toUpperCase();

  if (
    event.includes('QURBAN') ||
    kategori.includes('QURBAN') ||
    kategori.includes('SHOHIBUL') ||
    detail.includes('QURBAN')
  ) {
    return 'QURBAN';
  }

  return 'OPERASIONAL';
}

export function RekapScreen() {
  const { internalData, internalLoading } = useAuth();
  const [filter, setFilter] = useState<RekapFilter>('OPERASIONAL');

  const summary: PublicData['summary'] = internalData?.summary ?? {};
  const qurban: PublicData['qurban'] = internalData?.qurban ?? {};
  const transactions: Transaction[] = useMemo(
    () =>
      Array.isArray(internalData?.recentTransactions)
        ? internalData.recentTransactions
        : [],
    [internalData?.recentTransactions],
  );

  const saldoKas = safeNumber(summary['Saldo Kas']);
  const saldoOperasional = safeNumber(summary['Saldo Operasional']);
  const saldoQurban =
    summary['Saldo Qurban'] !== undefined
      ? safeNumber(summary['Saldo Qurban'])
      : safeNumber(qurban.totalNominal);

  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let masuk = 0;
    let keluar = 0;

    for (const trx of transactions) {
      const tanggal = String(trx.tanggal || '');
      const jenis = String(trx.jenis || '').toUpperCase();
      const nominal = safeNumber(trx.nominal);

      if (!tanggal.startsWith(today)) continue;

      if (jenis === 'PEMASUKAN') masuk += nominal;
      if (jenis === 'PENGELUARAN') keluar += nominal;
    }

    return { masuk, keluar };
  }, [transactions]);

  const qurbanRemaining = safeNumber(qurban.remainingNominal);
  const qurbanFilled = safeNumber(qurban.totalFilled);
  const qurbanSlots =
    safeNumber(qurban.totalSlots) || qurbanFilled + safeNumber(qurban.totalEmpty);
  const qurbanPct = safeNumber(qurban.progressPct);
  const qurbanCollected = safeNumber(qurban.totalNominal);
  const qurbanColor = qurban.progressColor || 'mixed';

  const filteredTransactions = useMemo(() => {
    const rows: TransactionWithBucket[] = transactions.map((trx) => ({
      ...trx,
      bucket: inferBucket(trx),
    }));

    if (filter === 'SEMUA') return rows.slice(0, 5);
    return rows.filter((trx) => trx.bucket === filter).slice(0, 5);
  }, [transactions, filter]);

  const insight = useMemo(() => {
    const selisihHariIni = todayStats.masuk - todayStats.keluar;

    if (selisihHariIni < 0) {
      return `Hari ini defisit ${formatCurrency(Math.abs(selisihHariIni))}`;
    }

    if (selisihHariIni > 0) {
      return `Hari ini surplus ${formatCurrency(selisihHariIni)}`;
    }

    return 'Belum ada pergerakan kas hari ini';
  }, [todayStats]);

  const healthNote = useMemo(() => {
    if (saldoOperasional <= 0) return 'Kas operasional habis';
    if (saldoOperasional < 1000000) return 'Kas operasional mulai menipis';
    return 'Kas operasional masih aman';
  }, [saldoOperasional]);

  if (internalLoading && !internalData) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!internalData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-fade-in">
        <AlertCircle className="mb-3 h-10 w-10 opacity-40" />
        <p className="text-sm">Data internal belum tersedia</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <section className="rounded-[28px] border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Kas Operasional
              </span>
            </div>

            <div className="mt-2 text-4xl font-black tracking-tight text-foreground">
              {formatCurrency(saldoOperasional)}
            </div>

            <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold">
              <span className="text-muted-foreground">Pergerakan hari ini</span>
              <span className="text-primary">+ {formatCurrency(todayStats.masuk)}</span>
              <span className="text-destructive">- {formatCurrency(todayStats.keluar)}</span>
            </div>

            <div className="mt-3 text-sm font-semibold text-foreground">{insight}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{healthNote}</div>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <SummaryCard
          icon={<Beef className="h-4 w-4 text-amber-600" />}
          label="Dana Qurban Terkumpul"
          value={formatCurrency(saldoQurban)}
          caption="Dana khusus qurban yang sudah terkumpul"
          tone="warm"
          emphasis="primary"
        />
        <SummaryCard
          icon={<Landmark className="h-4 w-4 text-sky-600" />}
          label="Total Dana Tercatat"
          value={formatCurrency(saldoKas)}
          caption="Gabungan operasional dan qurban"
          tone="neutral"
          emphasis="secondary"
        />
      </section>

      <section className="rounded-[28px] border border-amber-200/70 bg-amber-50 p-4 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <Beef className="h-4 w-4 text-amber-700" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-amber-900">
              {qurbanRemaining > 0
                ? `Qurban kurang ${formatCurrency(qurbanRemaining)}`
                : 'Kebutuhan qurban sudah terpenuhi'}
            </div>

            <div className="mt-1 text-xs text-amber-700">
              {qurbanFilled}/{qurbanSlots} slot · {qurbanPct}% tercapai
            </div>

            <div className="mt-3">
              <ProgressBar value={qurbanPct} color={qurbanColor} />
            </div>

            <div className="mt-2 text-xs text-amber-700">
              {formatCurrency(qurbanCollected)} terkumpul
              {qurbanRemaining > 0 && <> · kurang {formatCurrency(qurbanRemaining)}</>}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-base font-bold text-foreground">Transaksi Terakhir</h3>
          </div>

          <div className="flex rounded-2xl bg-muted/50 p-1.5">
            {([
              ['OPERASIONAL', 'Operasional'],
              ['QURBAN', 'Qurban'],
              ['SEMUA', 'Semua'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-xl px-3.5 py-2 text-[11px] font-bold transition-all ${
                  filter === value
                    ? 'bg-card text-foreground shadow-soft'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada transaksi pada filter ini</p>
        ) : (
          <div className="space-y-1">
            {filteredTransactions.map((trx, index: number) => {
              const isIncome = String(trx.jenis || '').toUpperCase() === 'PEMASUKAN';
              const nominal = safeNumber(trx.nominal);
              const kategori = String(trx.kategori || 'Transaksi');
              const metode = String(trx.metode || '-');
              const tanggalRaw = trx.tanggal ? new Date(trx.tanggal) : null;
              const tanggal =
                tanggalRaw && !Number.isNaN(tanggalRaw.getTime())
                  ? tanggalRaw.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                  : '-';
              const detail = String(trx.keterangan || trx.deskripsi || '').trim();

              return (
                <div
                  key={trx.id || `${kategori}-${index}`}
                  className="flex items-start justify-between gap-3 border-b border-border/40 py-3 last:border-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        isIncome ? 'bg-dkm-green-soft' : 'bg-destructive/10'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpCircle className="h-4 w-4 text-primary" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-foreground">
                        {kategori}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{tanggal} · {metode}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold ${
                            trx.bucket === 'QURBAN'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {trx.bucket === 'QURBAN' ? 'Qurban' : 'Operasional'}
                        </span>
                      </div>
                      {detail && (
                        <div className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
                          {detail}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`shrink-0 text-sm font-bold ${
                      isIncome ? 'text-primary' : 'text-destructive'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(nominal)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  caption,
  tone,
  emphasis,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption: string;
  tone: 'warm' | 'neutral';
  emphasis: 'primary' | 'secondary';
}) {
  return (
    <div
      className={`rounded-[24px] border p-4 shadow-card ${
        tone === 'warm'
          ? 'border-amber-200/60 bg-amber-50'
          : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${
            tone === 'warm' ? 'bg-amber-100' : 'bg-sky-500/10'
          }`}
        >
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>

      <div
        className={`mt-3 tracking-tight ${
          emphasis === 'primary'
            ? 'text-2xl font-black text-foreground'
            : 'text-lg font-semibold text-foreground/74'
        }`}
      >
        {value}
      </div>

      <div className="mt-1 text-[11px] text-muted-foreground">{caption}</div>
    </div>
  );
}
