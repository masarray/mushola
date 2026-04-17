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

interface HomeScreenProps {
  data: PublicData | null;
  loading: boolean;
  error: string | null;
  onNavigate?: (screen: "home" | "event" | "login") => void;
}

export function HomeScreen({
  data,
  loading,
  error,
  onNavigate,
}: HomeScreenProps) {
  const summary = data?.summary || ({} as PublicData["summary"]);
  const qurban = data?.qurban || ({} as PublicData["qurban"]);

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
      <section className="relative overflow-hidden rounded-[30px] border border-border bg-card shadow-[0_18px_48px_rgba(15,23,42,0.16)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(22,101,52,0.94) 56%, rgba(245,158,11,0.10) 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(420px circle at top right, rgba(255,248,220,0.14), transparent 72%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-white/18 pointer-events-none" />

        <div className="relative z-10 p-4 text-white sm:p-5">
          <div>
            <div className="text-[15px] font-bold tracking-tight text-white/96">
              Mushola Raudhatul Mukminin
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
              Transparansi Keuangan Mushola
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/18 bg-white/14 p-4 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_14px_34px_rgba(0,0,0,0.10)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/72">
                  <Wallet className="h-4 w-4 text-emerald-100" />
                  <span>Kas Operasional Mushola</span>
                </div>
                <div className="mt-2 text-[2.45rem] leading-none font-black tracking-[-0.03em] text-white">
                  {loading
                    ? "Memuat..."
                    : error
                      ? "Gagal"
                      : formatCurrency(saldoOperasional)}
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

          <div className="mt-3 rounded-[24px] border border-white/14 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(245,158,11,0.06))] p-4 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_10px_28px_rgba(0,0,0,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/68">
                  <Beef className="h-4 w-4 text-amber-100" />
                  <span>Dana Qurban</span>
                </div>
                <div className="mt-2 text-[2rem] leading-none font-black tracking-[-0.02em] text-white">
                  {loading
                    ? "Memuat..."
                    : error
                      ? "Gagal"
                      : formatCurrency(saldoQurban)}
                </div>
                <div className="mt-1 text-[11px] leading-relaxed text-white/70">
                  Dana khusus qurban dikelola terpisah dari kas operasional.
                </div>
              </div>

              <div className="shrink-0 rounded-[18px] bg-white/10 px-3 py-2 text-right ring-1 ring-white/10">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/58">
                  Progres
                </div>
                <div className="mt-1 text-[15px] font-extrabold text-white">
                  {qurbanPct}%
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <ActionCard
              title="Lihat Progres Qurban"
              subtitle={
                loading
                  ? "..."
                  : `${qurbanFilled}/${qurbanSlots || qurbanFilled} slot · ${qurbanPct}%`
              }
              onClick={() => onNavigate?.("event")}
            />
            <ActionCard
              title="Masuk Panel Pengurus"
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
              {qurbanRemaining > 0
                ? `Sudah terkumpul ${formatCurrency(qurbanCollected)} dan masih kurang ${formatCurrency(qurbanRemaining)}.`
                : `Dana qurban sudah terkumpul ${formatCurrency(qurbanCollected)}.`}
            </p>
          </div>

          <div className="shrink-0 rounded-[18px] bg-amber-100 px-3 py-2 text-[15px] font-extrabold text-amber-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
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
            onClick={() => onNavigate?.("event")}
            className="inline-flex items-center gap-1 font-bold text-primary transition-all hover:gap-1.5 hover:underline"
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
          value={loading ? "..." : formatCurrency(totalPemasukan)}
          hint="Riwayat transaksi masuk"
        />
        <MiniStat
          icon={<TrendingDown className="h-4 w-4 text-destructive" />}
          label="Kas Keluar"
          value={loading ? "..." : formatCurrency(totalPengeluaran)}
          hint="Riwayat transaksi keluar"
        />
      </section>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
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
      className={`group relative overflow-hidden rounded-[24px] p-4 text-left backdrop-blur-md transition-all duration-200 active:scale-[0.97] ${
        isQurban
          ? "border border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.10))] shadow-[0_12px_28px_rgba(0,0,0,0.14)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.12))]"
          : "border border-white/16 bg-[linear-gradient(180deg,rgba(15,23,42,0.10),rgba(255,255,255,0.05))] shadow-[0_10px_24px_rgba(0,0,0,0.10)] hover:bg-[linear-gradient(180deg,rgba(15,23,42,0.14),rgba(255,255,255,0.07))]"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/14 pointer-events-none" />

      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-[14px] ring-1 ring-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] ${
            isQurban ? "bg-white/20" : "bg-white/12"
          }`}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>

        <ArrowRight className="h-4 w-4 text-white/86 transition-transform duration-200 group-hover:translate-x-1" />
      </div>

      <div className="mt-4">
        <div className="text-[15px] leading-tight font-bold text-white">
          {title}
        </div>
        <div className="mt-1 text-[12px] leading-relaxed text-white/64">
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
  value: string;
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
      <div className="mt-3 text-[1.4rem] leading-none font-black tracking-[-0.02em] text-foreground">
        {value}
      </div>
      {hint && (
        <div className="mt-2 text-[11px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}
