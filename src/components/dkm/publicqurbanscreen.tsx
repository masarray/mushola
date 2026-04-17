import type { PublicData } from "@/lib/api";
import { formatCurrency, getProgressColor, safeNumber } from "@/lib/format";
import { ProgressBar } from "./progressbar";
import {
  BadgeCheck,
  Beef,
  Building2,
  CircleDollarSign,
  Copy,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PublicQurbanScreenProps {
  data: PublicData | null;
  loading: boolean;
  isRefreshing?: boolean;
}

function clampPct(value: number) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function getGroupStatusChip(group: {
  filledSlots?: number;
  totalSlots?: number;
  paymentProgressPct?: number;
}) {
  const filled = safeNumber(group.filledSlots);
  const total = safeNumber(group.totalSlots);
  const paymentPct = safeNumber(group.paymentProgressPct);

  if (paymentPct >= 100) {
    return {
      icon: "●",
      label: "Selesai",
      className: "border border-emerald-100 bg-emerald-50 text-emerald-700",
    };
  }

  if (paymentPct > 0 || filled > 0) {
    return {
      icon: "◐",
      label: "Berjalan",
      className: "border border-amber-100 bg-amber-50 text-amber-700",
    };
  }

  if (total > 0) {
    return {
      icon: "○",
      label: "Terbuka",
      className: "border border-slate-200 bg-slate-50 text-slate-600",
    };
  }

  return {
    icon: "○",
    label: "Info",
    className: "border border-slate-200 bg-slate-50 text-slate-600",
  };
}

function SummaryTile({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-white/90 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </div>
      </div>

      <div className="mt-3 text-[1.45rem] font-black leading-none tracking-[-0.03em] text-foreground">
        {value}
      </div>
      <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {helper}
      </div>
    </div>
  );
}

export function PublicQurbanScreen({
  data,
  loading,
  isRefreshing = false,
}: PublicQurbanScreenProps) {
  const { toast } = useToast();

  const qurban = data?.qurban;
  const groups = Array.isArray(qurban?.groups) ? qurban.groups : [];

  const isInitialLoading = loading && !data;

  const qurbanFilled = safeNumber(qurban?.totalFilled);
  const qurbanSlots = safeNumber(qurban?.totalSlots);
  const qurbanPct = clampPct(safeNumber(qurban?.progressPct));
  const qurbanCollected = safeNumber(qurban?.totalNominal);
  const qurbanRemaining = safeNumber(qurban?.remainingNominal);
  const qurbanTotalGroups = safeNumber(qurban?.totalGroups) || groups.length;
  const qurbanColor = getProgressColor(qurbanPct);

  const qurbanAccountNumber = "7126194832";
  const qurbanAccountName = "Muhammad Rifqi Syauqi";
  const qurbanAccountBank = "BSI";
  const qurbanConfirmPhone = "085646230887";

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(qurbanAccountNumber);
      toast({
        title: "Nomor rekening berhasil disalin",
        description: `${qurbanAccountBank} ${qurbanAccountNumber}`,
      });
    } catch {
      toast({
        title: "Gagal menyalin nomor rekening",
        description: "Silakan salin manual nomor rekening qurban.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-2">
      <section className="relative overflow-hidden rounded-[30px] border border-border bg-card shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.10),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,250,248,1))]" />

        <div className="relative p-5">
          {isRefreshing && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 shadow-[0_8px_18px_rgba(16,185,129,0.08)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Menyinkronkan data qurban
            </div>
          )}

          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            Info Qurban Warga
          </div>

          <div className="mt-3 text-[2rem] leading-[1.02] font-black tracking-[-0.03em] text-foreground">
            Ringkasan Grup Qurban
          </div>

          <p className="mt-3 max-w-[42ch] text-[14px] leading-relaxed text-muted-foreground">
            {isInitialLoading
              ? "Mengambil ringkasan qurban terbaru..."
              : qurbanRemaining > 0
                ? `Saat ini ${qurbanFilled}/${qurbanSlots} slot sudah terisi. Dana qurban masih dalam proses pemenuhan sebesar ${formatCurrency(qurbanRemaining)}.`
                : `Seluruh slot qurban sudah terisi dan dana qurban telah mencapai ${formatCurrency(qurbanCollected)}.`}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <SummaryTile
              icon={<Users className="h-4 w-4 text-emerald-700" />}
              label="Peserta"
              value={
                isInitialLoading ? "..." : `${qurbanFilled}/${qurbanSlots}`
              }
              helper="Jumlah slot terisi saat ini"
            />
            <SummaryTile
              icon={<CircleDollarSign className="h-4 w-4 text-amber-700" />}
              label="Dana"
              value={isInitialLoading ? "..." : formatCurrency(qurbanCollected)}
              helper={
                qurbanRemaining > 0
                  ? `Progres menuju target`
                  : "Target qurban tercapai"
              }
            />
          </div>

          <div className="mt-4 rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold text-emerald-900">
                  Progress dana qurban bersama
                </div>
                <div className="mt-1 text-sm leading-relaxed text-emerald-800/80">
                  Tampilan ini untuk membantu warga melihat progres umum qurban
                  tanpa membuka data internal panitia.
                </div>
              </div>

              <div className="shrink-0 rounded-[18px] bg-white px-3 py-2 text-[15px] font-extrabold text-emerald-800 shadow-[0_8px_18px_rgba(16,185,129,0.10)]">
                {isInitialLoading ? "..." : `${qurbanPct}%`}
              </div>
            </div>

            <div className="mt-4">
              <ProgressBar value={qurbanPct} color={qurbanColor} />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <div className="text-emerald-900/80">
                {isInitialLoading
                  ? "Menyiapkan progres..."
                  : `${qurbanTotalGroups} grup · ${qurbanFilled}/${qurbanSlots} slot`}
              </div>
              <div className="text-emerald-900/80">
                {qurbanRemaining > 0
                  ? `Sisa target ${formatCurrency(qurbanRemaining)}`
                  : "Sudah terpenuhi"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-border bg-card p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Grup Sapi
            </div>
            <h3 className="mt-2 text-[1.45rem] leading-tight font-black tracking-tight text-foreground">
              Status tiap grup qurban
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Label dibuat tetap halus agar informatif tanpa terasa seperti
              papan penilaian warga.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <Beef className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {isInitialLoading &&
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-[24px] border border-border bg-white/80 p-4"
              >
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-2 w-full animate-pulse rounded bg-muted" />
                <div className="mt-3 flex gap-2">
                  <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                  <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
            ))}

          {!isInitialLoading && groups.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-border bg-muted/20 p-5 text-sm leading-relaxed text-muted-foreground">
              Data grup qurban belum tersedia saat ini.
            </div>
          )}

          {!isInitialLoading &&
            groups.map((group, idx) => {
              const groupName = group.groupName || `Sapi ${idx + 1}`;
              const filled = safeNumber(group.filledSlots);
              const total = safeNumber(group.totalSlots);
              const paymentPct = clampPct(safeNumber(group.paymentProgressPct));
              const collected =
                safeNumber(group.paymentCollectedNominal) ||
                safeNumber(group.collectedNominal);
              const target =
                safeNumber(group.paymentTargetNominal) ||
                safeNumber(group.targetNominal);
              const remaining = Math.max(0, target - collected);
              const chip = getGroupStatusChip(group);

              return (
                <article
                  key={`${groupName}-${idx}`}
                  className="rounded-[24px] border border-border bg-white/90 p-4 shadow-[0_12px_24px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-base font-black tracking-tight text-foreground">
                        {groupName}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {filled}/{total || filled} slot terisi
                      </div>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${chip.className}`}
                    >
                      <span className="text-[10px] leading-none">
                        {chip.icon}
                      </span>
                      <span>{chip.label}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <ProgressBar
                      value={paymentPct}
                      color={getProgressColor(paymentPct)}
                      thin
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                      🐄 {groupName}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                      👥 {filled}/{total || filled} slot
                    </span>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                      ✨ {paymentPct}%
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-muted/30 px-3 py-3">
                      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        Terkumpul
                      </div>
                      <div className="mt-1 font-black tracking-tight text-foreground">
                        {formatCurrency(collected)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-muted/30 px-3 py-3">
                      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        Sisa Target
                      </div>
                      <div className="mt-1 font-black tracking-tight text-foreground">
                        {formatCurrency(remaining)}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </section>

      <section className="rounded-[30px] border border-border bg-card p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
        <div className="mb-5 rounded-[28px] border border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(255,251,235,0.98))] p-5 shadow-[0_14px_32px_rgba(16,185,129,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                <BadgeCheck className="h-3.5 w-3.5" />
                Rekening Resmi Qurban
              </div>
              <div className="mt-3 text-[1.35rem] font-black leading-tight tracking-[-0.03em] text-foreground">
                Transfer Pembayaran Qurban
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Warga yang ingin transfer dapat memakai rekening resmi berikut.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/90 shadow-[0_10px_18px_rgba(16,185,129,0.10)]">
              <Building2 className="h-5 w-5 text-emerald-700" />
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-emerald-100 bg-white/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {qurbanAccountBank} a.n. {qurbanAccountName}
            </div>
            <div className="mt-2 text-[1.85rem] font-black leading-none tracking-[0.02em] text-foreground sm:text-[2.2rem]">
              {qurbanAccountNumber}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCopyAccountNumber}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(4,120,87,0.18)] transition hover:bg-emerald-800 active:scale-[0.98]"
              >
                <Copy className="h-4 w-4" />
                Salin Nomor Rekening
              </button>

              <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                <Phone className="h-4 w-4" />
                Konfirmasi ke {qurbanConfirmPhone}
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Setelah transfer, mohon konfirmasi ke {qurbanConfirmPhone} agar
              pembayaran cepat dicatat.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-dashed border-border bg-card/70 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.03)]">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Tahap Berikutnya
        </div>
        <h3 className="mt-2 text-[1.2rem] font-black tracking-tight text-foreground">
          Daftar nama shohibul publik
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Section nama per warga belum diaktifkan karena data publik saat ini
          belum mengirim daftar shohibul dari backend. Begitu API publik
          menambahkan{" "}
          <span className="font-semibold text-foreground">qurbanRows</span>,
          screen ini bisa langsung ditingkatkan menjadi list nama + chip status
          yang halus.
        </p>
      </section>
    </div>
  );
}
