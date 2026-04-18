import type { ReactNode } from "react";
import type { PublicData } from "@/lib/api";
import { formatCurrency, safeNumber } from "@/lib/format";
import { ProgressBar } from "./progressbar";
import {
  ArrowRight,
  Beef,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LogIn,
  Wallet,
} from "lucide-react";

const APP_ICON_URL = `${import.meta.env.BASE_URL}favicon.svg`;

interface HomeScreenProps {
  data: PublicData | null;
  loading: boolean;
  error: string | null;
  isRefreshing?: boolean;
  onNavigate?: (screen: "home" | "event" | "login") => void;
}

export function HomeScreen({
  data,
  loading,
  error,
  isRefreshing = false,
  onNavigate,
}: HomeScreenProps) {
  const summary = data?.summary || ({} as PublicData["summary"]);
  const qurban = data?.qurban || ({} as PublicData["qurban"]);
  const isInitialLoading = loading && !data;

  const groups = Array.isArray(qurban?.groups) ? qurban.groups : [];
  const visibleGroups = groups.slice(0, 3);

  const saldoOperasional = safeNumber(summary["Saldo Operasional"]);
  const saldoQurban =
    summary["Saldo Qurban"] !== undefined
      ? safeNumber(summary["Saldo Qurban"])
      : safeNumber(qurban.totalNominal);
  const totalPemasukan = safeNumber(summary["Total Pemasukan"]);
  const totalPengeluaran = safeNumber(summary["Total Pengeluaran"]);

  const qurbanRemaining = safeNumber(qurban.remainingNominal);
  const qurbanFilled = safeNumber(qurban.totalFilled);
  const qurbanSlots = safeNumber(qurban.totalSlots);
  const qurbanPct = safeNumber(qurban.progressPct);
  const qurbanCollected = safeNumber(qurban.totalNominal);
  const qurbanColor = qurban.progressColor || "mixed";

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-1">
      <section className="relative overflow-hidden rounded-[30px] border border-border bg-card shadow-[0_12px_32px_rgba(15,23,42,0.10)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(22,101,52,0.92) 58%, rgba(245,158,11,0.08) 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(320px circle at top right, rgba(255,248,220,0.10), transparent 74%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-white/18 pointer-events-none" />

        <div className="relative z-10 p-4 text-white sm:p-5">
          {isRefreshing && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/78">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
              Memperbarui data mushola
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[15px] font-bold tracking-tight text-white/96">
                Mushola Raudhatul Mukminin
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                Transparansi Keuangan Mushola
              </div>
            </div>

            <img
              src={APP_ICON_URL}
              alt="Icon Mushola"
              className="mt-1 h-10 w-10 shrink-0 object-contain"
            />
          </div>

          <div className="mt-4 rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/72">
                  <Wallet className="h-4 w-4 text-emerald-100" />
                  <span>Kas Operasional Mushola</span>
                </div>
                <div className="mt-2 text-[2.45rem] leading-none font-black tracking-[-0.03em] text-white">
                  {isInitialLoading ? (
                    <ValueShimmer className="h-10 w-44 bg-white/18" />
                  ) : error ? (
                    "Gagal"
                  ) : (
                    formatCurrency(saldoOperasional)
                  )}
                </div>
                <div className="mt-2 text-[11px] text-white/72">
                  Dana untuk kebutuhan harian mushola
                </div>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/16 shadow-[0_4px_14px_rgba(255,255,255,0.06)]">
                <Wallet className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(245,158,11,0.04))] p-4 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/68">
                  <Beef className="h-4 w-4 text-amber-100" />
                  <span>Dana Qurban</span>
                </div>
                <div className="mt-2 text-[2rem] leading-none font-black tracking-[-0.02em] text-white">
                  {isInitialLoading ? (
                    <ValueShimmer className="h-9 w-36 bg-white/16" />
                  ) : error ? (
                    "Gagal"
                  ) : (
                    formatCurrency(saldoQurban)
                  )}
                </div>
                <div className="mt-1 text-[11px] leading-relaxed text-white/70">
                  Dana khusus qurban dikelola terpisah dari kas operasional.
                </div>
              </div>

              <SemiGauge value={qurbanPct} />
            </div>
          </div>

          <div className="mt-2 h-px bg-white/8" />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <ActionCard
              title="Informasi Qurban"
              subtitle={
                isInitialLoading
                  ? "Menyiapkan progres qurban..."
                  : `${qurbanFilled}/${qurbanSlots || qurbanFilled} slot • ${qurbanPct}%`
              }
              onClick={() => onNavigate?.("event")}
            />
            <ActionCard
              title="Login Pengurus"
              subtitle="Bendahara & pengurus"
              onClick={() => onNavigate?.("login")}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-border bg-card p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Fokus Qurban
            </div>
            <h3 className="mt-2 text-[1.6rem] leading-tight font-black tracking-tight text-foreground">
              Progres Qurban Warga
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {isInitialLoading
                ? "Menyusun ringkasan qurban terbaru..."
                : qurbanRemaining > 0
                  ? `Sudah terkumpul ${formatCurrency(qurbanCollected)} dan masih kurang ${formatCurrency(qurbanRemaining)}.`
                  : `Dana qurban sudah terkumpul ${formatCurrency(qurbanCollected)}.`}
            </p>
          </div>

          <div className="shrink-0 rounded-[18px] bg-amber-100 px-3 py-2 text-[15px] font-extrabold text-amber-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
            {isInitialLoading ? "..." : `${qurbanPct}%`}
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar value={qurbanPct} color={qurbanColor} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <div className="text-muted-foreground">
            {isInitialLoading
              ? "Slot qurban sedang dimuat..."
              : `${qurbanFilled}/${qurbanSlots || qurbanFilled} slot terisi`}
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.("event")}
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary/8 px-4 font-bold text-primary active:scale-[0.98]"
          >
            Lihat detail
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <MiniStat
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          label="Kas Masuk"
          value={isInitialLoading ? null : formatCurrency(totalPemasukan)}
          hint="Riwayat transaksi masuk"
        />
        <MiniStat
          icon={<TrendingDown className="h-4 w-4 text-destructive" />}
          label="Kas Keluar"
          value={isInitialLoading ? null : formatCurrency(totalPengeluaran)}
          hint="Riwayat transaksi keluar"
        />
      </section>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="mb-4 rounded-[22px] border border-emerald-200/70 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(255,251,235,0.96))] px-4 py-3 shadow-[0_10px_24px_rgba(16,185,129,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                Transfer Qurban
              </div>
              <div className="mt-1 text-sm font-semibold leading-relaxed text-foreground">
                Rekening resmi qurban tersedia di halaman Event.
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("event")}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white/90 px-4 text-xs font-bold text-emerald-700 shadow-[0_8px_18px_rgba(16,185,129,0.08)] active:scale-[0.98]"
            >
              Lihat rekening
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] bg-primary/10 ring-1 ring-primary/10">
            <Beef className="h-5 w-5 text-primary" />
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Grup Qurban
            </div>
            <div className="text-[15px] font-bold tracking-tight text-foreground">
              Ringkasan grup qurban warga
            </div>
          </div>
        </div>

        {visibleGroups.length > 0 ? (
          <div className="mt-4 space-y-3">
            {visibleGroups.map((group) => (
              <QurbanGroupCard key={group.groupName} group={group} />
            ))}
          </div>
        ) : isInitialLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <CompactGroupPlaceholder key={index} />
            ))}
          </div>
        ) : (
          <div className="mt-4 text-sm text-muted-foreground">
            Warga dapat memantau kebutuhan harian mushola dan dana qurban tanpa
            tercampur.
          </div>
        )}
      </section>
    </div>
  );
}

function ValueShimmer({ className = "" }: { className?: string }) {
  return (
    <span
      className={`block animate-pulse rounded-full bg-muted/70 ${className}`}
    />
  );
}

function CompactGroupPlaceholder() {
  return (
    <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="h-4 w-28 animate-pulse rounded-full bg-muted/60" />
          <div className="mt-2 h-3 w-40 animate-pulse rounded-full bg-muted/40" />
        </div>
        <div className="h-3 w-16 animate-pulse rounded-full bg-muted/40" />
      </div>
      <div className="mt-3 h-2 w-full animate-pulse rounded-full bg-muted/30" />
    </div>
  );
}

function QurbanGroupCard({
  group,
}: {
  group: PublicData["qurban"]["groups"][0];
}) {
  const filledSlots = safeNumber(group.filledSlots);
  const totalSlots = safeNumber(group.totalSlots);
  const paymentPct = safeNumber(group.paymentProgressPct);
  const remainingSlots = Math.max(0, totalSlots - filledSlots);
  const fillPct =
    totalSlots > 0
      ? Math.min(100, Math.round((filledSlots / totalSlots) * 100))
      : 0;

  const joinMessage =
    remainingSlots <= 0
      ? "Kuota shohibul sudah penuh"
      : remainingSlots === 1
        ? "Tinggal 1 orang lagi"
        : `${group.groupName} masih perlu ${remainingSlots} orang lagi`;

  return (
    <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold text-foreground">
              {group.groupName || "Grup qurban"}
            </div>
            <div className="w-16 shrink-0">
              <ProgressBar
                value={fillPct}
                color={
                  fillPct >= 100 ? "green" : fillPct >= 50 ? "yellow" : "red"
                }
                thin
              />
            </div>
          </div>
          <div className="mt-1 text-xs font-medium text-muted-foreground">
            {joinMessage}
          </div>
        </div>

        <div className="text-xs font-semibold text-muted-foreground">
          {filledSlots}/{totalSlots} slot
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="w-14 shrink-0">
          <ProgressBar
            value={paymentPct}
            color={
              paymentPct >= 75 ? "green" : paymentPct >= 40 ? "yellow" : "red"
            }
            thin
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Progres pembayaran {paymentPct}%
        </div>
      </div>
    </div>
  );
}

function SemiGauge({ value, label = "" }: { value: number; label?: string }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value || 0)));
  const angle = (safeValue / 100) * 180;

  let progressColor = "#ef4444";
  if (safeValue >= 67) {
    progressColor = "#22c55e";
  } else if (safeValue >= 34) {
    progressColor = "#f59e0b";
  }

  return (
    <div className="flex w-[88px] shrink-0 flex-col items-center rounded-[16px] bg-white/6 px-2.5 py-2 ring-0 outline-none">
      <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/52">
        {label}
      </div>

      <div className="relative mt-1.5 h-[42px] w-[78px] overflow-hidden">
        <div
          className="absolute left-1/2 top-[4px] h-[64px] w-[64px] -translate-x-1/2 rounded-full border-[5px] border-white/14"
          style={{
            clipPath: "inset(0 0 50% 0)",
            opacity: 0.25,
          }}
        />

        <div
          className="absolute left-1/2 top-[4px] h-[64px] w-[64px] -translate-x-1/2 rounded-full border-[5px] border-transparent"
          style={{
            clipPath: "inset(0 0 50% 0)",
            borderTopColor: progressColor,
            borderRightColor: progressColor,
            transform: `translateX(-50%) rotate(${Math.max(-180, angle - 180)}deg)`,
            transformOrigin: "50% 50%",
            filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.10))",
          }}
        />

        <div className="absolute inset-x-0 bottom-[1px] flex items-center justify-center">
          <div className="text-[13px] font-extrabold leading-none text-white/96">
            {safeValue}%
          </div>
        </div>
      </div>
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
  const isQurban = title.toLowerCase().includes("qurban");
  const Icon = isQurban ? BarChart3 : LogIn;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-[24px] p-4 text-left transition-all duration-200 active:scale-[0.96] ${
        isQurban
          ? "border border-white/28 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.12))] shadow-[0_14px_30px_rgba(0,0,0,0.18)] active:bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.10))]"
          : "border border-white/22 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(15,23,42,0.06))] shadow-[0_14px_30px_rgba(0,0,0,0.14)] active:bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(15,23,42,0.05))]"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/18 pointer-events-none" />

      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-[14px] ring-0 ring-white/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] ${
            isQurban ? "bg-white/24" : "bg-white/16"
          }`}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>

        <ArrowRight className="h-4 w-4 text-white/86" />
      </div>

      <div className="mt-4">
        <div className="text-[15px] leading-tight font-extrabold text-white">
          {title}
        </div>
        <div className="mt-1 text-[12px] leading-relaxed text-white/72">
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
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
  hint?: string;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-card p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
      </div>
      {value ? (
        <div className="mt-3 text-[1.4rem] leading-none font-black tracking-[-0.02em] text-foreground">
          {value}
        </div>
      ) : (
        <div className="mt-3 h-7 w-28 animate-pulse rounded-full bg-muted/55" />
      )}
      {hint && (
        <div className="mt-2 text-[11px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}
