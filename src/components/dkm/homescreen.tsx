import { PublicData } from "@/lib/api";
import { formatCurrency, safeNumber, getBalanceTone } from "@/lib/format";
import { ProgressBar } from "./progressbar";
import { TrendingUp, TrendingDown, Wallet, Landmark, Moon, ArrowRight } from "lucide-react";

interface HomeScreenProps {
  data: PublicData | null;
  loading: boolean;
  error: string | null;
}

export function HomeScreen({ data, loading, error }: HomeScreenProps) {
  const summary = data?.summary;
  const qurban = data?.qurban;
  const seasonal = data?.seasonal;
  const groups = qurban?.groups || [];
  const topGroup = groups[0];

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Hero Panel */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-dkm-green to-dkm-green-strong p-6 min-h-[200px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(255,247,229,0.08),transparent_50%)]" />
        <div className="relative z-10 max-w-[280px]">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground text-xs font-bold">
            Publik
          </span>
          <h2 className="mt-4 font-heading text-[28px] leading-[1.05] font-bold text-primary-foreground tracking-tight">
            Ringkas, jelas, dan mudah
          </h2>
          <p className="mt-3 text-primary-foreground/80 text-sm leading-relaxed">
            Ringkasan kas dan qurban, mudah dipantau kapan saja.
          </p>
        </div>
        <div className="absolute right-5 bottom-5 w-20 h-20">
          <img
            src={`${import.meta.env.BASE_URL}icons/mushola.svg`}
            alt="Mushola"
            className="w-full h-full opacity-80 drop-shadow-lg"
          />
        </div>
      </section>

      {/* Ringkasan Kas */}
      <section className="bg-card rounded-3xl border border-border p-5 shadow-card animate-slide-up">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="font-heading text-xl font-bold text-foreground">Ringkasan Kas</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Kondisi dana utama yang paling sering ingin diketahui warga.
            </p>
          </div>
          <span className="shrink-0 px-3 py-1.5 rounded-full bg-dkm-green-soft text-primary text-xs font-bold">
            Hari ini
          </span>
        </div>

        {/* Balance Card */}
        <div className="bg-dkm-surface rounded-2xl p-5 border border-border/50 flex items-center justify-between gap-4 shadow-soft">
          <div>
            <span className="text-xs text-muted-foreground font-medium">Saldo Kas Saat Ini</span>
            <strong className="block mt-1.5 text-3xl font-bold text-primary tracking-tight">
              {loading ? "Memuat..." : error ? "Gagal" : formatCurrency(summary?.["Saldo Kas"])}
            </strong>
          </div>
          <span className="inline-flex items-center px-3.5 py-2 rounded-full bg-dkm-green-soft text-primary font-bold text-xs">
            {loading ? "..." : error ? "Error" : getBalanceTone(summary?.["Saldo Kas"])}
          </span>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <SummaryCard
            icon={TrendingUp}
            label="Pemasukan"
            value={loading ? "Memuat..." : formatCurrency(summary?.["Total Pemasukan"])}
            variant="positive"
          />
          <SummaryCard
            icon={TrendingDown}
            label="Pengeluaran"
            value={loading ? "Memuat..." : formatCurrency(summary?.["Total Pengeluaran"])}
            variant="negative"
          />
          <SummaryCard
            icon={Wallet}
            label="Saldo Operasional"
            value={loading ? "Memuat..." : formatCurrency(summary?.["Saldo Operasional"])}
            variant="neutral"
          />
          <SummaryCard
            icon={Moon}
            label="Saldo Ramadhan"
            value={loading ? "Memuat..." : formatCurrency(summary?.["Saldo Ramadhan"])}
            variant="neutral"
          />
        </div>
      </section>

      {/* Fokus Musim */}
      <section className="bg-card rounded-3xl border border-border p-5 shadow-card animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="font-heading text-xl font-bold text-foreground">Fokus Musim Ini</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Qurban tampil sebagai prioritas utama saat musimnya aktif.
            </p>
          </div>
          <span className="shrink-0 px-3 py-1.5 rounded-full bg-dkm-gold-soft text-dkm-gold-text text-xs font-bold">
            Qurban
          </span>
        </div>

        {/* Event Progress Card */}
        <div className="bg-dkm-surface rounded-2xl p-5 border border-border/50 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Dana Terkumpul</span>
              <strong className="block mt-1.5 text-2xl font-bold text-foreground tracking-tight">
                {loading ? "Memuat..." : formatCurrency(qurban?.totalNominal)}
              </strong>
            </div>
            <span className="text-xl font-bold text-foreground">
              {loading ? "0%" : `${safeNumber(qurban?.progressPct)}%`}
            </span>
          </div>
          <ProgressBar
            value={safeNumber(qurban?.progressPct)}
            color={qurban?.progressColor}
            className="mt-4"
          />
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>
              {loading
                ? "Mengambil data..."
                : safeNumber(qurban?.remainingNominal) > 0
                ? `Masih butuh ${formatCurrency(qurban?.remainingNominal)}`
                : "Target qurban sudah tercapai"}
            </span>
            <span>
              {loading
                ? "..."
                : `Slot ${safeNumber(qurban?.totalFilled)}/${safeNumber(qurban?.totalSlots)}`}
            </span>
          </div>
        </div>

        {/* Highlights */}
        <div className="flex flex-col gap-3 mt-4">
          <div className="bg-dkm-surface rounded-2xl p-4 border border-border/50 flex items-start justify-between gap-3">
            <div className="flex-1">
              <strong className="text-sm font-semibold text-foreground">
                {topGroup ? topGroup.groupName || "Grup utama" : "Grup utama belum tersedia"}
              </strong>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {topGroup
                  ? `${safeNumber(topGroup.filledSlots)} dari ${safeNumber(topGroup.totalSlots)} slot terisi, progres pembayaran ${safeNumber(topGroup.paymentProgressPct)}%.`
                  : "Data grup qurban akan tampil otomatis dari backend publik."}
              </p>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-full bg-dkm-gold-soft text-dkm-gold-text text-[11px] font-bold">
              {topGroup?.status || "Musiman"}
            </span>
          </div>

          <SeasonalNote seasonal={seasonal} />
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  variant,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  variant: "positive" | "negative" | "neutral";
}) {
  const bg = {
    positive: "bg-dkm-positive",
    negative: "bg-dkm-negative",
    neutral: "bg-dkm-surface",
  }[variant];

  const iconColor = {
    positive: "text-dkm-positive-text",
    negative: "text-dkm-negative-text",
    neutral: "text-muted-foreground",
  }[variant];

  return (
    <div className={`${bg} rounded-2xl p-4 border border-border/30`}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <strong className="block text-lg font-bold text-foreground tracking-tight leading-tight">
        {value}
      </strong>
    </div>
  );
}

function SeasonalNote({ seasonal }: { seasonal?: PublicData["seasonal"] }) {
  const heroEvent = String(seasonal?.heroEvent || "GENERAL").toUpperCase();

  let title: string;
  let text: string;

  if (heroEvent === "QURBAN") {
    title = "Qurban menjadi fokus utama";
    text = "Layar publik otomatis menonjolkan kebutuhan qurban saat musimnya aktif.";
  } else if (heroEvent === "RAMADHAN") {
    title = "Ramadhan menjadi fokus utama";
    text = "Nantinya layar publik akan memprioritaskan progres kegiatan Ramadhan.";
  } else {
    title = "Kas umum tetap mudah dipantau";
    text = "Di luar musim event utama, warga langsung melihat kondisi kas dan ringkasan penting.";
  }

  return (
    <div className="bg-dkm-surface rounded-2xl p-4 border border-border/50 flex items-center gap-3">
      <Landmark className="w-8 h-8 text-muted-foreground/50 shrink-0" />
      <div>
        <strong className="text-sm font-semibold text-foreground">{title}</strong>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
