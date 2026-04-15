import { useAuth } from '@/lib/auth';
import { formatCurrency, safeNumber } from '@/lib/format';
import { ProgressBar } from './ProgressBar';
import {
  Wallet, TrendingUp, TrendingDown, BarChart3, Clock,
  ArrowUpCircle, ArrowDownCircle, AlertCircle, Loader2
} from 'lucide-react';

export function RekapScreen() {
  const { internalData, internalLoading } = useAuth();

  if (internalLoading && !internalData) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!internalData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-fade-in">
        <AlertCircle className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm">Data internal belum tersedia</p>
      </div>
    );
  }

  const summary = internalData.summary;
  const transactions = internalData.recentTransactions || [];

  const summaryCards = [
    { label: 'Saldo Kas', value: summary['Saldo Kas'], icon: Wallet, accent: 'text-primary' },
    { label: 'Total Pemasukan', value: summary['Total Pemasukan'], icon: TrendingUp, accent: 'text-emerald-500' },
    { label: 'Total Pengeluaran', value: summary['Total Pengeluaran'], icon: TrendingDown, accent: 'text-red-400' },
    { label: 'Saldo Operasional', value: summary['Saldo Operasional'], icon: BarChart3, accent: 'text-blue-400' },
    { label: 'Saldo Ramadhan', value: summary['Saldo Ramadhan'], icon: BarChart3, accent: 'text-amber-400' },
  ];

  if (summary['Saldo Qurban'] !== undefined) {
    summaryCards.push({ label: 'Saldo Qurban', value: summary['Saldo Qurban'], icon: BarChart3, accent: 'text-emerald-400' });
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-card rounded-2xl border border-border p-4 shadow-card"
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-4 h-4 ${card.accent}`} />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {card.label}
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Qurban Progress (if available) */}
      {internalData.qurban && (
        <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
          <h3 className="font-heading text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            🐄 Progres Qurban
          </h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {safeNumber(internalData.qurban.totalFilled)} / {safeNumber(internalData.qurban.totalSlots)} slot terisi
            </span>
            <span className="text-xs font-bold text-primary">
              {safeNumber(internalData.qurban.progressPct)}%
            </span>
          </div>
          <ProgressBar
            value={safeNumber(internalData.qurban.progressPct)}
            color={internalData.qurban.progressColor}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {formatCurrency(internalData.qurban.totalNominal)} terkumpul
            {safeNumber(internalData.qurban.remainingNominal) > 0 &&
              ` · Kurang ${formatCurrency(internalData.qurban.remainingNominal)}`}
          </p>
        </section>
      )}

      {/* Recent Transactions */}
      <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
        <h3 className="font-heading text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Transaksi Terakhir
        </h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Belum ada transaksi</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((trx) => {
              const isIncome = trx.jenis === 'PEMASUKAN';
              return (
                <div
                  key={trx.id}
                  className="flex items-start justify-between gap-3 py-2.5 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome ? 'bg-dkm-green-soft' : 'bg-destructive/10'
                    }`}>
                      {isIncome
                        ? <ArrowUpCircle className="w-4 h-4 text-primary" />
                        : <ArrowDownCircle className="w-4 h-4 text-destructive" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{trx.kategori}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(trx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        {' · '}{trx.event} · {trx.metode}
                        {trx.status === 'KOREKSI' && (
                          <span className="ml-1 text-amber-500 font-semibold">• KOREKSI</span>
                        )}
                      </p>
                      {trx.keterangan && (
                        <p className="text-[10px] text-muted-foreground/70 truncate">{trx.keterangan}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm font-bold whitespace-nowrap ${
                    isIncome ? 'text-primary' : 'text-destructive'
                  }`}>
                    {isIncome ? '+' : '-'}{formatCurrency(trx.nominal)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
