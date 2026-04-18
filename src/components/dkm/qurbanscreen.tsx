import { useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  apiSubmitQurbanPayment,
  getErrorMessage,
  QurbanGroup,
  QurbanPayment,
  QurbanRow,
} from "@/lib/api";
import { formatCurrency, safeNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Copy,
  Loader2,
  Phone,
  PiggyBank,
  ReceiptText,
  Send,
  Users,
  Wallet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProgressBar } from "@/components/dkm/progressbar";

type PayMethod = "Cash" | "Transfer";
type ViewTab = "select" | "history";

type NormalizedRow = QurbanRow & {
  targetBayarSmart: number;
  totalBayarSmart: number;
  sisaBayarSmart: number;
  statusBayarSmart: "Belum" | "DP" | "Lunas";
  progressPct: number;
};

const QURBAN_ACCOUNT = {
  bank: "BSI",
  name: "Muhammad Rifqi Syauqi",
  number: "7126194832",
  phone: "085646230887",
} as const;

function onlyDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function formatQuickLabel(value: number, isPas = false) {
  if (isPas) return "Pas";
  if (value >= 1000000) {
    const jt = value / 1000000;
    return Number.isInteger(jt) ? `${jt}jt` : `${jt.toFixed(1)}jt`;
  }
  if (value >= 1000) return `${value / 1000}rb`;
  return `${value}`;
}

function calcRemaining(
  targetBayar: number,
  totalBayar: number,
  sisaBayar?: number,
) {
  const fallback = Math.max(
    0,
    safeNumber(targetBayar) - safeNumber(totalBayar),
  );
  const apiSisa = Math.max(0, safeNumber(sisaBayar));
  return fallback > 0 ? fallback : apiSisa;
}

function calcSmartStatus(
  targetBayar: number,
  totalBayar: number,
  sisaBayar?: number,
): "Belum" | "DP" | "Lunas" {
  const paid = safeNumber(totalBayar);
  const remaining = calcRemaining(targetBayar, totalBayar, sisaBayar);

  if (paid <= 0) return "Belum";
  if (remaining <= 0) return "Lunas";
  return "DP";
}

function buildQuickAmounts(remaining: number) {
  if (remaining <= 0) return [];

  let candidates: number[] = [];

  if (remaining <= 200000) {
    candidates = [50000, 100000];
  } else if (remaining <= 500000) {
    candidates = [100000, 250000];
  } else if (remaining <= 1000000) {
    candidates = [100000, 250000, 500000];
  } else if (remaining <= 2000000) {
    candidates = [100000, 500000, 1000000];
  } else {
    candidates = [500000, 1000000, 2000000];
  }

  const filtered = candidates.filter((v) => v > 0 && v < remaining);
  return [...new Set([...filtered, remaining])];
}

function getStatusTone(status: "Belum" | "DP" | "Lunas") {
  if (status === "Lunas")
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  if (status === "DP")
    return "bg-amber-50 text-amber-700 border border-amber-100";
  return "bg-muted text-muted-foreground border border-border";
}

function getGroupAggregate(
  group: QurbanGroup | undefined,
  rows: NormalizedRow[],
) {
  const totalSlots = safeNumber(group?.totalSlots) || rows.length;
  const filledSlots = safeNumber(group?.filledSlots) || rows.length;
  const targetNominal =
    safeNumber(group?.paymentTargetNominal) ||
    safeNumber(group?.targetNominal) ||
    rows.reduce((sum, row) => sum + row.targetBayarSmart, 0);
  const collectedNominal =
    safeNumber(group?.paymentCollectedNominal) ||
    safeNumber(group?.collectedNominal) ||
    rows.reduce((sum, row) => sum + row.totalBayarSmart, 0);
  const remainingNominal = Math.max(0, targetNominal - collectedNominal);
  const lunasCount =
    safeNumber(group?.lunasCount) ||
    rows.filter((row) => row.statusBayarSmart === "Lunas").length;
  const dpCount =
    safeNumber(group?.dpCount) ||
    rows.filter((row) => row.statusBayarSmart === "DP").length;
  const belumCount =
    safeNumber(group?.belumCount) ||
    rows.filter((row) => row.statusBayarSmart === "Belum").length;
  const paymentProgressPct =
    safeNumber(group?.paymentProgressPct) ||
    (targetNominal > 0
      ? Math.round((collectedNominal / targetNominal) * 100)
      : 0);
  const occupancyPct =
    totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  return {
    totalSlots,
    filledSlots,
    targetNominal,
    collectedNominal,
    remainingNominal,
    lunasCount,
    dpCount,
    belumCount,
    paymentProgressPct,
    occupancyPct,
  };
}

function GroupMetric({
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
    <div className="rounded-[22px] border border-border/80 bg-white/80 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          {icon}
        </div>
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="mt-3 text-[1.35rem] font-black leading-none tracking-[-0.03em] text-foreground">
        {value}
      </div>
      <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {helper}
      </div>
    </div>
  );
}

function ProgressStrip({ value, tone }: { value: number; tone: string }) {
  const color =
    tone === "bg-emerald-500"
      ? "green"
      : tone === "bg-amber-500"
        ? "yellow"
        : "red";

  return <ProgressBar value={Number(value) || 0} color={color} thin />;
}

export function QurbanScreen() {
  const { user, internalData, refreshInternal, internalLoading } = useAuth();
  const { toast } = useToast();
  const isBendahara = user?.role === "BENDAHARA";
  const nominalRef = useRef<HTMLInputElement | null>(null);

  const [view, setView] = useState<ViewTab>("select");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedShohibulId, setSelectedShohibulId] = useState("");
  const [nominal, setNominal] = useState("");
  const [metode, setMetode] = useState<PayMethod>("Cash");
  const [submitting, setSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const rows = useMemo(
    () =>
      Array.isArray(internalData?.qurbanRows) ? internalData.qurbanRows : [],
    [internalData?.qurbanRows],
  );
  const groups = useMemo(
    () =>
      Array.isArray(internalData?.qurban?.groups)
        ? internalData.qurban.groups
        : [],
    [internalData?.qurban?.groups],
  );
  const qurbanPayments = useMemo(
    () =>
      Array.isArray(internalData?.qurbanPayments)
        ? internalData.qurbanPayments
        : [],
    [internalData?.qurbanPayments],
  );

  const normalizedRows = useMemo<NormalizedRow[]>(() => {
    return rows.map((row: QurbanRow) => {
      const target = safeNumber(row.targetBayar);
      const paid = safeNumber(row.totalBayar);
      const remaining = calcRemaining(target, paid, row.sisaBayar);
      const status = calcSmartStatus(target, paid, row.sisaBayar);
      const progressPct = target > 0 ? Math.round((paid / target) * 100) : 0;

      return {
        ...row,
        targetBayarSmart: target,
        totalBayarSmart: paid,
        sisaBayarSmart: remaining,
        statusBayarSmart: status,
        progressPct,
      };
    });
  }, [rows]);

  const effectiveSelectedGroup = selectedGroup || groups[0]?.groupName || "";

  const filteredRows = useMemo(() => {
    if (!effectiveSelectedGroup) return normalizedRows;
    return normalizedRows.filter((row) => row.grup === effectiveSelectedGroup);
  }, [normalizedRows, effectiveSelectedGroup]);

  const selectedGroupMeta = useMemo(
    () => groups.find((group) => group.groupName === effectiveSelectedGroup),
    [groups, effectiveSelectedGroup],
  );

  const selectedGroupAggregate = useMemo(
    () => getGroupAggregate(selectedGroupMeta, filteredRows),
    [selectedGroupMeta, filteredRows],
  );

  const selected = useMemo(
    () =>
      normalizedRows.find((row) => row.shohibulId === selectedShohibulId) ||
      null,
    [normalizedRows, selectedShohibulId],
  );

  const quickAmounts = useMemo(() => {
    if (!selected) return [];
    return buildQuickAmounts(selected.sisaBayarSmart);
  }, [selected]);

  const latestPayments = useMemo(
    () => qurbanPayments.slice(0, 8),
    [qurbanPayments],
  );

  if (!internalData) {
    return (
      <div className="rounded-[28px] border border-border bg-card p-5 shadow-card">
        <div className="text-sm text-muted-foreground">
          {internalLoading
            ? "Memuat workspace qurban..."
            : "Data qurban belum tersedia."}
        </div>
      </div>
    );
  }

  async function handleSubmit() {
    if (!user || !selected || !isBendahara) return;

    const parsed = Number(nominal || "0");
    if (!parsed || parsed <= 0) {
      toast({
        title: "Nominal belum diisi",
        description: "Masukkan nominal pembayaran dulu.",
        variant: "destructive",
      });
      nominalRef.current?.focus();
      return;
    }

    if (selected.sisaBayarSmart > 0 && parsed > selected.sisaBayarSmart) {
      toast({
        title: "Nominal melebihi sisa bayar",
        description: `Maksimal ${formatCurrency(selected.sisaBayarSmart)} untuk ${selected.nama}.`,
        variant: "destructive",
      });
      nominalRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await apiSubmitQurbanPayment({
        email: user.email,
        tanggal: today,
        shohibulId: selected.shohibulId,
        nominalBayar: parsed,
        metode,
        keterangan: "",
      });

      if (res.success) {
        toast({
          title: "Pembayaran berhasil disimpan",
          description:
            typeof res.result?.paymentId === "string"
              ? res.result.paymentId
              : "Data masuk ke riwayat pembayaran.",
        });

        setNominal("");
        setJustSaved(true);
        await refreshInternal();

        setTimeout(() => {
          setJustSaved(false);
          nominalRef.current?.focus();
        }, 1400);
      } else {
        toast({
          title: res.message || "Gagal menyimpan pembayaran",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      toast({
        title: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyAccountNumber() {
    try {
      await navigator.clipboard.writeText(QURBAN_ACCOUNT.number);
      toast({
        title: "Nomor rekening berhasil disalin",
        description: `${QURBAN_ACCOUNT.bank} ${QURBAN_ACCOUNT.number}`,
      });
    } catch {
      toast({
        title: "Gagal menyalin nomor rekening",
        description: "Silakan salin manual nomor rekening qurban.",
        variant: "destructive",
      });
    }
  }

  function handleSelectShohibul(shohibulId: string, groupName: string) {
    if (!isBendahara) return;
    setSelectedGroup(groupName);
    setSelectedShohibulId(shohibulId);
    setNominal("");
    setView("select");

    setTimeout(() => {
      nominalRef.current?.focus();
    }, 120);
  }

  function handleBackToList() {
    setSelectedShohibulId("");
    setNominal("");
    setJustSaved(false);
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {!selected ? (
        <>
          <section className="relative overflow-hidden rounded-[30px] border border-border bg-card shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(29,91,61,0.11),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,248,244,0.98))]" />
            <div className="relative p-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                <BadgeCheck className="h-3.5 w-3.5" />
                Workspace Qurban
              </div>

              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[1.8rem] font-black leading-[1.05] tracking-[-0.03em] text-foreground">
                    Pantau Shohibul dan Pembayaran
                  </h2>
                  <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
                    Halaman ini dibuat supaya pengurus cepat melihat grup aktif,
                    status DP, rekening transfer, dan progres setiap shohibul
                    dalam satu tempat.
                  </p>
                </div>

                <div className="shrink-0 rounded-[20px] bg-amber-100 px-3 py-2 text-sm font-black text-amber-800 shadow-[0_10px_20px_rgba(245,158,11,0.12)]">
                  {selectedGroupAggregate.paymentProgressPct}%
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <GroupMetric
                  icon={<Users className="h-4 w-4" />}
                  label="Peserta Aktif"
                  value={`${selectedGroupAggregate.filledSlots}/${selectedGroupAggregate.totalSlots}`}
                  helper={`${selectedGroupAggregate.occupancyPct}% slot grup ${effectiveSelectedGroup || "qurban"} sudah terisi`}
                />
                <GroupMetric
                  icon={<PiggyBank className="h-4 w-4" />}
                  label="Dana Masuk"
                  value={formatCurrency(
                    selectedGroupAggregate.collectedNominal,
                  )}
                  helper={
                    selectedGroupAggregate.remainingNominal > 0
                      ? `Masih kurang ${formatCurrency(selectedGroupAggregate.remainingNominal)}`
                      : "Target dana grup sudah terpenuhi"
                  }
                />
              </div>
            </div>
          </section>

          <section className="sticky top-3 z-10 rounded-[28px] border border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(255,251,235,0.98))] p-4 shadow-[0_16px_34px_rgba(16,185,129,0.10)] backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                  Transfer Qurban
                </div>
                <div className="mt-1 text-base font-black leading-tight text-foreground">
                  {QURBAN_ACCOUNT.bank} a.n. {QURBAN_ACCOUNT.name}
                </div>
                <div className="mt-1 text-xl font-black tracking-[0.04em] text-foreground">
                  {QURBAN_ACCOUNT.number}
                </div>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-emerald-700" />
                  Konfirmasi ke {QURBAN_ACCOUNT.phone} (Pak Rifqi)
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyAccountNumber}
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(4,120,87,0.18)] transition hover:bg-emerald-800 active:scale-[0.98]"
              >
                <Copy className="h-4 w-4" />
                Salin
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border border-border bg-card p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Grup Aktif
                </div>
                <div className="mt-1 text-lg font-black tracking-tight text-foreground">
                  {effectiveSelectedGroup || "Semua Grup"}
                </div>
              </div>

              <div className="inline-flex rounded-full border border-border bg-muted/35 p-1">
                <button
                  type="button"
                  onClick={() => setView("select")}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    view === "select"
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground"
                  }`}
                >
                  Daftar Shohibul
                </button>
                <button
                  type="button"
                  onClick={() => setView("history")}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    view === "history"
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground"
                  }`}
                >
                  Riwayat Bayar
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
              {groups.map((group: QurbanGroup, index) => {
                const groupName = group.groupName || `Sapi ${index + 1}`;
                const active = effectiveSelectedGroup === groupName;
                return (
                  <button
                    key={groupName}
                    type="button"
                    onClick={() => {
                      setSelectedGroup(groupName);
                      setSelectedShohibulId("");
                    }}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {groupName}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-muted/35 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Lunas
                </div>
                <div className="mt-1 text-lg font-black text-emerald-700">
                  {selectedGroupAggregate.lunasCount}
                </div>
              </div>
              <div className="rounded-2xl bg-muted/35 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  DP
                </div>
                <div className="mt-1 text-lg font-black text-amber-700">
                  {selectedGroupAggregate.dpCount}
                </div>
              </div>
              <div className="rounded-2xl bg-muted/35 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Belum
                </div>
                <div className="mt-1 text-lg font-black text-foreground">
                  {selectedGroupAggregate.belumCount}
                </div>
              </div>
              <div className="rounded-2xl bg-muted/35 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Progres Dana
                </div>
                <div className="mt-1 text-lg font-black text-primary">
                  {selectedGroupAggregate.paymentProgressPct}%
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Keterisian slot</span>
                  <span>{selectedGroupAggregate.occupancyPct}%</span>
                </div>
                <ProgressStrip
                  value={selectedGroupAggregate.occupancyPct}
                  tone="bg-emerald-500"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Pembayaran grup</span>
                  <span>{selectedGroupAggregate.paymentProgressPct}%</span>
                </div>
                <ProgressStrip
                  value={selectedGroupAggregate.paymentProgressPct}
                  tone="bg-amber-500"
                />
              </div>
            </div>

            {!isBendahara && (
              <div className="mt-4 rounded-2xl border border-border bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
                Mode pengurus hanya untuk memantau progres. Aksi menuju daftar nama shohibul dan form input pembayaran dikunci untuk bendahara saja.
              </div>
            )}
          </section>

          {view === "history" ? (
            <section className="rounded-[28px] border border-border bg-card p-4 shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                  <ReceiptText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground">
                    Riwayat Pembayaran Terbaru
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Memudahkan panitia mengecek input yang baru masuk.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {latestPayments.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-background px-4 py-5 text-sm text-muted-foreground">
                    Belum ada riwayat pembayaran.
                  </div>
                ) : (
                  latestPayments.map((payment: QurbanPayment) => (
                    <div
                      key={payment.paymentId}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-foreground">
                          {payment.namaShohibul}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {payment.grup} • {payment.metode} • {payment.tanggal}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-black text-primary">
                          +{formatCurrency(safeNumber(payment.nominalBayar))}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          masuk
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : (
            <section className="rounded-[28px] border border-border bg-card p-4 shadow-card">
              <div className="space-y-3">
                {filteredRows.map((row) => (
                  <button
                    key={row.shohibulId}
                    type="button"
                    onClick={() => handleSelectShohibul(row.shohibulId, row.grup)}
                    disabled={!isBendahara}
                    className={`w-full rounded-[24px] border border-border bg-background px-4 py-4 text-left transition-all ${
                      isBendahara
                        ? "hover:border-primary/40 hover:bg-primary/5"
                        : "cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[1.05rem] font-black leading-tight text-foreground">
                          {row.nama}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusTone(
                              row.statusBayarSmart,
                            )}`}
                          >
                            {row.statusBayarSmart}
                          </span>
                          <span className="text-sm font-bold text-destructive">
                            Kurang {formatCurrency(row.sisaBayarSmart)}
                          </span>
                        </div>

                        <div className="mt-3">
                          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                            <span>
                              Sudah bayar {formatCurrency(row.totalBayarSmart)}
                            </span>
                            <span>
                              {Math.max(0, Math.min(100, row.progressPct))}%
                            </span>
                          </div>
                          <ProgressStrip
                            value={row.progressPct}
                            tone={
                              row.statusBayarSmart === "Lunas"
                                ? "bg-emerald-500"
                                : row.statusBayarSmart === "DP"
                                  ? "bg-amber-500"
                                  : "bg-primary"
                            }
                          />
                        </div>

                        <div className="mt-2 text-[11px] text-muted-foreground">
                          Target {formatCurrency(row.targetBayarSmart)}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-lg font-black leading-none text-foreground">
                          {formatCurrency(row.sisaBayarSmart)}
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          sisa
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 text-sm font-bold text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke daftar shohibul
          </button>

          <section className="rounded-[28px] border border-border bg-card p-5 shadow-card">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-black tracking-tight text-foreground">
                    {selected.nama}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold text-muted-foreground">
                      {selected.grup}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${getStatusTone(
                        selected.statusBayarSmart,
                      )}`}
                    >
                      {selected.statusBayarSmart}
                    </span>
                  </div>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-muted/35 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Target
                  </div>
                  <div className="mt-1 text-sm font-bold text-foreground">
                    {formatCurrency(selected.targetBayarSmart)}
                  </div>
                </div>

                <div className="rounded-2xl bg-primary/5 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Sudah
                  </div>
                  <div className="mt-1 text-sm font-bold text-primary">
                    {formatCurrency(selected.totalBayarSmart)}
                  </div>
                </div>

                <div className="rounded-2xl bg-destructive/5 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Kurang
                  </div>
                  <div className="mt-1 text-sm font-bold text-destructive">
                    {formatCurrency(selected.sisaBayarSmart)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {selected.sisaBayarSmart > 0 && quickAmounts.length > 0 && (
            <section className="rounded-[28px] border border-border bg-card p-4 shadow-card">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {quickAmounts.map((amount) => {
                  const isPas = amount === selected.sisaBayarSmart;
                  const active = Number(nominal || "0") === amount;

                  return (
                    <button
                      key={`${amount}-${isPas ? "pas" : "chip"}`}
                      type="button"
                      onClick={() => setNominal(String(amount))}
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                        active
                          ? "bg-primary text-primary-foreground shadow-soft"
                          : isPas
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {formatQuickLabel(amount, isPas)}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="rounded-[28px] border border-border bg-card p-4 shadow-card space-y-4">
            <div className="rounded-[24px] border border-primary/25 bg-background p-3">
              <Input
                ref={nominalRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                enterKeyHint="done"
                value={nominal}
                onChange={(e) => setNominal(onlyDigits(e.target.value))}
                placeholder="0"
                className="h-16 border-0 bg-transparent px-1 text-4xl font-black tracking-tight text-foreground shadow-none focus-visible:ring-0"
              />
              <div className="mt-1 px-1 text-sm font-semibold text-muted-foreground">
                {Number(nominal || "0") > 0
                  ? formatCurrency(Number(nominal))
                  : "Masukkan nominal pembayaran"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(["Cash", "Transfer"] as PayMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setMetode(method)}
                  className={`h-14 rounded-2xl text-base font-bold transition-all ${
                    metode === method
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                    Rekening Transfer
                  </div>
                  <div className="mt-1 text-sm font-black text-foreground">
                    {QURBAN_ACCOUNT.bank} a.n. {QURBAN_ACCOUNT.name}
                  </div>
                  <div className="mt-1 text-lg font-black tracking-[0.04em] text-foreground">
                    {QURBAN_ACCOUNT.number}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Konfirmasi transfer ke {QURBAN_ACCOUNT.phone} (Pak Rifqi).
                  </div>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
            </div>

            {justSaved && (
              <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Pembayaran tersimpan. Siap input berikutnya.
              </div>
            )}

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selected.sisaBayarSmart <= 0}
              className="h-14 w-full rounded-full text-base font-bold shadow-soft"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Simpan Pembayaran
                </>
              )}
            </Button>

            {selected.sisaBayarSmart <= 0 && (
              <div className="text-center text-sm font-semibold text-primary">
                Shohibul ini sudah lunas.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
