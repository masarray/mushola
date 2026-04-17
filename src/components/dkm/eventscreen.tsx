import { PublicData } from "@/lib/api";
import { formatCurrency, safeNumber, getProgressColor } from "@/lib/format";
import { ProgressBar } from "./progressbar";
import {
  Beef,
  Users,
  CircleDollarSign,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface EventScreenProps {
  data: PublicData | null;
  loading: boolean;
}

type QurbanGroup = NonNullable<PublicData["qurban"]["groups"]>[number] & {
  paymentCollectedNominal?: number;
  paymentTargetNominal?: number;
  collectedNominal?: number;
  targetNominal?: number;
};

function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value || 0)))}%`;
}

function getGroupBadge(group: {
  filledSlots?: number;
  totalSlots?: number;
  paymentProgressPct?: number;
}) {
  const filled = Number(group.filledSlots || 0);
  const total = Number(group.totalSlots || 0);
  const paymentPct = Number(group.paymentProgressPct || 0);

  if (filled < total) {
    return {
      label: "Masih tersedia",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    };
  }

  if (paymentPct <= 0) {
    return {
      label: "Belum mulai bayar",
      className: "bg-amber-50 text-amber-700 border border-amber-100",
    };
  }

  if (paymentPct < 100) {
    return {
      label: "Pembayaran berjalan",
      className: "bg-sky-50 text-sky-700 border border-sky-100",
    };
  }

  return {
    label: "Selesai",
    className: "bg-muted text-muted-foreground border border-border",
  };
}

export function EventScreen({ data, loading }: EventScreenProps) {
  const qurban = data?.qurban;
  const groups = qurban?.groups || [];
  const qurbanFilled = safeNumber(qurban?.totalFilled);
  const qurbanSlots = safeNumber(qurban?.totalSlots);
  const qurbanRemaining = safeNumber(qurban?.remainingNominal);
  const qurbanCollected = safeNumber(qurban?.totalNominal);
  const qurbanPct = safeNumber(qurban?.progressPct);

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-2">
      <section className="relative overflow-hidden rounded-[30px] border border-border bg-card shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,250,248,1))]" />
        <div className="relative p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            Qurban Tahun Ini
          </div>

          <div className="mt-3 text-[2rem] leading-[1.02] font-black tracking-[-0.03em] text-foreground">
            Progress Qurban Warga
          </div>

          <p className="mt-3 max-w-[40ch] text-[14px] leading-relaxed text-muted-foreground">
            {qurbanRemaining > 0
              ? `Sudah terisi ${qurbanFilled}/${qurbanSlots} peserta qurban. Kurang ${Math.max(0, qurbanSlots - qurbanFilled)} peserta lagi. Dana qurban masih kurang ${formatCurrency(qurbanRemaining)}.`
              : `Seluruh slot sudah terpenuhi. Dana qurban terkumpul ${formatCurrency(qurbanCollected)}.`}
          </p>

          <div className="mt-5 grid grid-cols-[1fr_2fr] gap-3">
            <SummaryCard
              icon={<Users className="h-4 w-4 text-emerald-700" />}
              label="Peserta"
              value={`${qurbanFilled}/${qurbanSlots}`}
              subtext={`Yuk! ${Math.max(0, qurbanSlots - qurbanFilled)} orang lagi...`}
            />
            <SummaryCard
              icon={<CircleDollarSign className="h-4 w-4 text-amber-700" />}
              label="Dana Terkumpul"
              value={formatCurrency(qurbanCollected)}
              subtext={
                qurbanRemaining > 0
                  ? `Masih kurang ${formatCurrency(qurbanRemaining)}`
                  : "Target dana qurban tercapai"
              }
            />
          </div>

          <div className="mt-4 rounded-[24px] border border-emerald-100 bg-emerald-50/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold text-emerald-900">
                  Masih ada kesempatan ikut qurban
                </div>
                <div className="mt-1 text-sm leading-relaxed text-emerald-800/80">
                  {qurbanRemaining > 0
                    ? `Saat ini masih tersedia ${Math.max(0, qurbanSlots - qurbanFilled)} slot. Warga bisa melihat grup yang masih terbuka untuk bergabung.`
                    : "Seluruh slot sudah penuh. Silakan hubungi panitia bila ingin masuk daftar cadangan."}
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-emerald-200/70 bg-white/65 shadow-[0_10px_24px_rgba(16,185,129,0.10)] backdrop-blur-sm">
                  <Beef className="h-7 w-7 text-emerald-700" />
                </div>

                <button
                  type="button"
                  className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-[0_10px_22px_rgba(4,120,87,0.20)] transition hover:bg-emerald-800 active:scale-[0.98]"
                >
                  <span className="inline-flex items-center gap-1.5">
                    Lihat Grup
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-border bg-card p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Grup Qurban
            </div>
            <div className="mt-2 text-[1.55rem] leading-tight font-black tracking-[-0.03em] text-foreground">
              Pilihan Grup Saat Ini
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Pantau keterisian peserta dan progres pembayaran tiap grup qurban.
            </p>
          </div>

          <div className="shrink-0 rounded-[18px] bg-amber-100 px-3 py-2 text-[15px] font-extrabold text-amber-800">
            {formatPercent(qurbanPct)}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {loading ? (
            <div className="rounded-[24px] border border-border bg-card p-4 text-center text-sm text-muted-foreground shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              Memuat data grup...
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-[24px] border border-border bg-card p-4 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="text-sm font-semibold text-foreground">
                Belum ada data grup
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Data qurban akan tampil setelah backend publik terbaca.
              </div>
            </div>
          ) : (
            groups.map((group, index) => {
              const filled = safeNumber(group.filledSlots);
              const total = safeNumber(group.totalSlots);
              const paymentPct = safeNumber(group.paymentProgressPct);

              const paidAmount =
                typeof group.paymentCollectedNominal === "number"
                  ? group.paymentCollectedNominal
                  : typeof group.collectedNominal === "number"
                    ? group.collectedNominal
                    : 0;

              const targetAmount =
                typeof group.paymentTargetNominal === "number"
                  ? group.paymentTargetNominal
                  : typeof group.targetNominal === "number"
                    ? group.targetNominal
                    : 0;

              return (
                <GroupCard
                  key={group.groupName || index}
                  groupName={group.groupName || `Sapi ${index + 1}`}
                  filledSlots={filled}
                  totalSlots={total}
                  paymentProgressPct={paymentPct}
                  paidAmountLabel={
                    paidAmount > 0
                      ? formatCurrency(paidAmount)
                      : `${formatPercent(paymentPct)} pembayaran`
                  }
                  targetAmountLabel={
                    targetAmount > 0
                      ? formatCurrency(targetAmount)
                      : "target grup"
                  }
                />
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-[22px] border border-border bg-white/90 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/70">
          {icon}
        </div>
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="mt-3 text-[1.65rem] leading-tight font-black tracking-[-0.03em] text-foreground sm:text-[1.6rem]">
        {value}
      </div>
      {subtext && (
        <div className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          {subtext}
        </div>
      )}
    </div>
  );
}

function GroupCard({
  groupName,
  filledSlots,
  totalSlots,
  paymentProgressPct,
  paidAmountLabel,
  targetAmountLabel,
}: {
  groupName: string;
  filledSlots: number;
  totalSlots: number;
  paymentProgressPct: number;
  paidAmountLabel: string;
  targetAmountLabel: string;
}) {
  const occupancyPct =
    totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
  const badge = getGroupBadge({ filledSlots, totalSlots, paymentProgressPct });
  const fillColor = getProgressColor(occupancyPct);
  const paymentColor = getProgressColor(paymentProgressPct);

  return (
    <div className="rounded-[24px] border border-border bg-card p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[1rem] font-bold tracking-tight text-foreground">
            {groupName}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {filledSlots}/{totalSlots} peserta
          </div>
        </div>

        <div
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${badge.className}`}
        >
          {badge.label}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Keterisian</span>
          <span className="font-semibold text-foreground">{occupancyPct}%</span>
        </div>
        <ProgressBar value={occupancyPct} color={fillColor} />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Pembayaran</span>
          <span className="font-semibold text-foreground">
            {formatPercent(paymentProgressPct)}
          </span>
        </div>
        <ProgressBar value={paymentProgressPct} color={paymentColor} />
        <div className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          {paidAmountLabel} dari {targetAmountLabel}
        </div>
      </div>
    </div>
  );
}
