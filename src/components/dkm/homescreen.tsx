import type { PublicData } from '@/lib/api';
import { formatCurrency, safeNumber } from '@/lib/format';
import { ProgressBar } from './progressbar';
import { ArrowRight, Landmark, TrendingUp, TrendingDown, ShieldCheck, BarChart3, LogIn } from 'lucide-react';

interface HomeScreenProps {
  data: PublicData | null;
  loading: boolean;
  error: string | null;
  onNavigate?: (screen: 'home' | 'event' | 'login') => void;
}

export function HomeScreen({ data, loading, error, onNavigate }: HomeScreenProps) {
  // 1. Berikan default value yang lengkap agar TS tidak bingung
  const summary = data?.summary || ({} as PublicData['summary']);
  
  // 2. Paksa qurban menggunakan tipe data dari PublicData['qurban']
  const qurban = data?.qurban || ({} as PublicData['qurban']);
  
  const seasonal = data?.seasonal;
  const groups = qurban.groups || [];
  const topGroup = groups;

  // 3. Ambil data summary dengan safeNumber
  const saldoKas = safeNumber(summary['Saldo Kas']);
  const totalPemasukan = safeNumber(summary['Total Pemasukan']);
  const totalPengeluaran = safeNumber(summary['Total Pengeluaran']);

  // 4. Ambil data qurban (ini akan menghilangkan error merah di screenshot Anda)
  const heroEvent = String(seasonal?.heroEvent || 'GENERAL').toUpperCase();
  const qurbanRemaining = safeNumber(qurban.remainingNominal);
  const qurbanFilled = safeNumber(qurban.totalFilled);
  const qurbanSlots = safeNumber(qurban.totalSlots);
  const qurbanPct = safeNumber(qurban.progressPct);
  const qurbanCollected = safeNumber(qurban.totalNominal);
  const qurbanColor = qurban.progressColor || 'mixed';



  const heroTitle =
    heroEvent === 'QURBAN'
      ? 'Transparansi qurban warga'
      : 'Transparansi keuangan mushola';

  const heroSubtitle =
    heroEvent === 'QURBAN'
      ? qurbanRemaining > 0
        ? `Dana qurban masih kurang ${formatCurrency(qurbanRemaining)} dan progres terus kami tampilkan terbuka.`
        : 'Dana qurban sudah siap dan progresnya terbuka untuk dipantau warga.'
      : 'Warga bisa memantau kondisi kas dan perkembangan dana penting kapan saja.';

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* HERO TRUST */}

    <section className="relative overflow-hidden rounded-[28px] border border-border bg-card shadow-card">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(22,163,74,0.10),transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(22,101,52,0.92)_55%,rgba(245,158,11,0.18))]" />

  <div className="relative p-4 text-white">
    {/* Header ringkas */}
    <div>
      <div className="text-sm font-bold text-white/95">
        Mushola Raudhatul Mukminin
      </div>
      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/65">
        Dashboard Keuangan
      </div>
    </div>

    {/* Saldo utama */}
    <div className="mt-4 rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">
            Saldo Kas Saat Ini
          </div>
          <div className="mt-2 text-4xl font-black tracking-tight text-white">
            {loading ? 'Memuat...' : error ? 'Gagal' : formatCurrency(saldoKas)}
          </div>
          <div className="mt-1 text-[11px] text-white/70">
            Update publik hari ini
          </div>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <Landmark className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>

    {/* CTA */}
    <div className="mt-3 grid grid-cols-2 gap-3">
      <ActionCard
        title="Lihat Progres Qurban"
        subtitle={
          loading
            ? '...'
            : `${qurbanFilled}/${qurbanSlots || qurbanFilled} slot · ${qurbanPct}%`
        }
        onClick={() => onNavigate?.('event')}
      />
      <ActionCard
        title="Masuk Panel Internal"
        subtitle="Bendahara & pengurus"
        onClick={() => onNavigate?.('login')}
      />
    </div>
  </div>
</section>

      {/* STORY CARD */}
      <section className="rounded-[28px] border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Fokus Qurban
            </div>
          <h3 className="mt-2 text-xl font-black tracking-tight text-foreground">
  Progres Qurban Warga
</h3>
          <p className="mt-2 text-sm text-muted-foreground">
  {qurbanRemaining > 0
    ? `Sudah terkumpul ${formatCurrency(qurbanCollected)} dan masih kurang ${formatCurrency(qurbanRemaining)}.`
    : `Dana qurban sudah terkumpul ${formatCurrency(qurbanCollected)}.`}
</p>
          </div>

          <div className="shrink-0 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
            {qurbanPct}%
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar value={qurbanPct} color={qurbanColor} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <div className="text-muted-foreground">
            {qurbanFilled}/{qurbanSlots || qurbanFilled} slot terisi
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('event')}
            className="inline-flex items-center gap-1 font-bold text-primary"
          >
            Lihat detail
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="grid grid-cols-2 gap-3">
        <MiniStat
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          label="Pemasukan"
          value={loading ? '...' : formatCurrency(totalPemasukan)}
        />
        <MiniStat
          icon={<TrendingDown className="h-4 w-4 text-destructive" />}
          label="Pengeluaran"
          value={loading ? '...' : formatCurrency(totalPengeluaran)}
        />
      </section>

      {/* HIGHLIGHT */}
      <section className="rounded-[28px] border border-border bg-card p-5 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Landmark className="h-5 w-5 text-primary" />
          </div>

<div className="min-w-0">
  <div className="text-sm font-bold text-foreground">
    {topGroup && topGroup.length > 0 
      ? topGroup[0].groupName || 'Grup utama' 
      : 'Kas umum tetap mudah dipantau'}
  </div>
  <div className="mt-1 text-sm text-muted-foreground">
    {topGroup && topGroup.length > 0
      ? `${safeNumber(topGroup[0].filledSlots)} dari ${safeNumber(topGroup[0].totalSlots)} slot terisi, progres pembayaran ${safeNumber(topGroup[0].paymentProgressPct)}%.`
      : 'Di luar musim event utama, warga tetap langsung melihat kondisi kas dan ringkasan penting.'}
  </div>
</div>

        </div>
      </section>
    </div>
  );
}

function ActionCard({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick?: () => void;
}) {
  const isQurban = title.toLowerCase().includes('qurban');

  const Icon = isQurban ? BarChart3 : LogIn;

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        relative
        rounded-[24px]
        border border-white/15
        bg-white/10
        p-4
        text-left
        backdrop-blur-sm

        transition-all duration-200
        active:scale-[0.97]

        hover:bg-white/15
      "
    >
      {/* ICON */}
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
          <Icon className="h-4 w-4 text-white" />
        </div>

        {/* ARROW */}
        <ArrowRight className="h-4 w-4 text-white/70 transition-transform group-hover:translate-x-1" />
      </div>

      {/* TEXT */}
      <div className="mt-3">
        <div className="text-sm font-bold text-white leading-tight">
          {title}
        </div>

        <div className="mt-1 text-xs text-white/70">
          {subtitle}
        </div>
      </div>
    </button>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-3 text-xl font-black tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}
