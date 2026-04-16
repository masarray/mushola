import { useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { formatCurrency, safeNumber } from '@/lib/format';
import { ProgressBar } from './progressbar';
import {
  Wallet,
  Landmark,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock3,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export function RekapScreen() {
  const { internalData, internalLoading } = useAuth();

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

  const summary = internalData.summary || {};
  const qurban = internalData.qurban || {};
  const transactions = Array.isArray(internalData.recentTransactions)
    ? internalData.recentTransactions.slice(0, 5)
    : [];

  const saldoKas = safeNumber(summary['Saldo Kas']);
  const saldoOperasional = safeNumber(summary['Saldo Operasional']);
  const saldoQurban =
    summary['Saldo Qurban'] !== undefined
      ? safeNumber(summary['Saldo Qurban'])
      : safeNumber(qurban?.totalNominal);

  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let masuk = 0;
    let keluar = 0;

    for (const trx of transactions) {
      const tanggal = String(trx?.tanggal || '');
      const jenis = String(trx?.jenis || '').toUpperCase();
      const nominal = safeNumber(trx?.nominal);

      if (!tanggal.startsWith(today)) continue;

      if (jenis === 'PEMASUKAN') masuk += nominal;
      if (jenis === 'PENGELUARAN') keluar += nominal;
    }

    return { masuk, keluar };
  }, [transactions]);

  const qurbanRemaining = safeNumber(qurban?.remainingNominal);
  const qurbanFilled = safeNumber(qurban?.totalFilled);
  const qurbanSlots =
    safeNumber(qurban?.totalSlots) || qurbanFilled + safeNumber(qurban?.totalEmpty);
  const qurbanPct = safeNumber(qurban?.progressPct);
  const qurbanCollected = safeNumber(qurban?.totalNominal);
  const qurbanColor = qurban?.progressColor || 'mixed';

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* HERO SALDO */}
      <section className="rounded-[28px] border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Saldo Kas
              </span>
            </div>

            <div className="mt-2 text-4xl font-black tracking-tight text-foreground">
              {formatCurrency(saldoKas)}
            </div>

            <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold">
              Update hari: ini
              <span className="text-primary">+ {formatCurrency(todayStats.masuk)}</span>
              <span className="text-destructive">- {formatCurrency(todayStats.keluar)}</span>
            </div>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        </div>
      </section>

      {/* READINESS CARDS */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-[24px] border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10">
              <Landmark className="h-4 w-4 text-sky-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Saldo Operasional
            </span>
          </div>

          <div className="mt-3 text-2xl font-black tracking-tight text-foreground">
            {formatCurrency(saldoOperasional)}
          </div>

          <div className="mt-1 text-[11px] text-muted-foreground">
            Dana aman untuk kebutuhan mushola
          </div>
        </div>

        <div className="rounded-[24px] border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Saldo Qurban
            </span>
          </div>

          <div className="mt-3 text-2xl font-black tracking-tight text-foreground">
            {formatCurrency(saldoQurban)}
          </div>

          <div className="mt-1 text-[11px] text-muted-foreground">
            Dana khusus qurban yang sudah terkumpul
          </div>
        </div>
      </section>

      {/* QURBAN ALERT */}
      <section className="rounded-[28px] border border-amber-200/70 bg-amber-50 p-4 shadow-card">
        <div className="flex items-start gap-3">
          <div className="pt-0.5 text-lg">🐄</div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-amber-900">
              {qurbanRemaining > 0
                ? `Qurban kurang ${formatCurrency(qurbanRemaining)}`
                : 'Dana qurban sudah siap'}
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

      {/* TRANSAKSI TERAKHIR */}
      <section className="rounded-[28px] border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-bold text-foreground">Transaksi Terakhir</h3>
        </div>

        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
        ) : (
          <div className="space-y-1">
            {transactions.map((trx: any, index: number) => {
              const isIncome = String(trx?.jenis || '').toUpperCase() === 'PEMASUKAN';
              const nominal = safeNumber(trx?.nominal);
              const kategori = String(trx?.kategori || 'Transaksi');
              const metode = String(trx?.metode || '-');
              const tanggalRaw = trx?.tanggal ? new Date(trx.tanggal) : null;
              const tanggal =
                tanggalRaw && !Number.isNaN(tanggalRaw.getTime())
                  ? tanggalRaw.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                  : '-';
              const detail = String(trx?.keterangan || trx?.deskripsi || '').trim();

              return (
                <div
                  key={trx?.id || trx?.trxId || `${kategori}-${index}`}
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
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {tanggal} · {metode}
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
