import { useEffect, useMemo, useState } from "react";
import type { PublicData, QurbanRow } from "@/lib/api";
import { apiGetShohibulList } from "@/lib/api";
import { getProgressColor, safeNumber } from "@/lib/format";
import { ProgressBar } from "./progressbar";
import { Beef, Sparkles, UserRound, Users } from "lucide-react";

interface PublicQurbanScreenProps {
  data: PublicData | null;
  loading: boolean;
  isRefreshing?: boolean;
  initialSelectedGroup?: string;
}

type PublicShohibulCard = {
  nama: string;
  grup: string;
  statusLabel: "Terdaftar" | "Dalam Proses" | "Lunas";
  progressPct: number;
  sapiNumber: string;
};

const PUBLIC_QURBAN_ROWS_CACHE_KEY = "dkm_public_qurban_rows_cache_v1";
const PUBLIC_QURBAN_ROWS_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type PublicQurbanRowsCache = {
  savedAt: number;
  rows: QurbanRow[];
};

function clampPct(value: number) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function parseSapiNumber(groupName: string) {
  const match = groupName.match(/(\d+)/);
  return match?.[1] || "?";
}

function deriveStatus(row: QurbanRow): PublicShohibulCard["statusLabel"] {
  const paid = safeNumber(row.totalBayar);
  const target = safeNumber(row.targetBayar);
  const remaining = Math.max(0, safeNumber(row.sisaBayar) || target - paid);

  if (paid <= 0) return "Terdaftar";
  if (remaining <= 0) return "Lunas";
  return "Dalam Proses";
}

function getStatusChip(status: PublicShohibulCard["statusLabel"]) {
  if (status === "Lunas") {
    return "border border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (status === "Dalam Proses") {
    return "border border-amber-100 bg-amber-50 text-amber-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-600";
}

function PillSkeleton() {
  return <div className="h-10 w-24 animate-pulse rounded-full bg-muted/50" />;
}

function CardSkeleton() {
  return (
    <div className="rounded-[24px] border border-border bg-white/90 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="h-11 w-11 animate-pulse rounded-2xl bg-muted/45" />
          <div className="min-w-0 flex-1">
            <div className="h-5 w-40 animate-pulse rounded-full bg-muted/60" />
            <div className="mt-2 h-6 w-24 animate-pulse rounded-full bg-muted/45" />
          </div>
        </div>
        <div className="h-5 w-12 animate-pulse rounded-full bg-muted/35" />
      </div>
      <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-muted/35" />
    </div>
  );
}

export function PublicQurbanScreen({
  data,
  loading,
  isRefreshing = false,
  initialSelectedGroup,
}: PublicQurbanScreenProps) {
  const [publicRows, setPublicRows] = useState<QurbanRow[]>(
    Array.isArray(data?.qurbanRows) ? data.qurbanRows : [],
  );
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsLoadError, setRowsLoadError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState("");

  const groups = useMemo(
    () => (Array.isArray(data?.qurban?.groups) ? data.qurban.groups : []),
    [data?.qurban?.groups],
  );

  useEffect(() => {
    if (!selectedGroup && groups.length > 0) {
      setSelectedGroup(initialSelectedGroup || groups[0]?.groupName || "");
    }
  }, [groups, selectedGroup, initialSelectedGroup]);

  useEffect(() => {
    if (initialSelectedGroup) {
      setSelectedGroup(initialSelectedGroup);
    }
  }, [initialSelectedGroup]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PUBLIC_QURBAN_ROWS_CACHE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as PublicQurbanRowsCache;
      if (
        parsed &&
        Array.isArray(parsed.rows) &&
        typeof parsed.savedAt === "number" &&
        Date.now() - parsed.savedAt < PUBLIC_QURBAN_ROWS_CACHE_TTL_MS
      ) {
        setPublicRows(parsed.rows);
      }
    } catch {
      // Ignore invalid cache payload.
    }
  }, []);

  useEffect(() => {
    if (Array.isArray(data?.qurbanRows) && data.qurbanRows.length > 0) {
      setPublicRows(data.qurbanRows);
      try {
        localStorage.setItem(
          PUBLIC_QURBAN_ROWS_CACHE_KEY,
          JSON.stringify({
            savedAt: Date.now(),
            rows: data.qurbanRows,
          } satisfies PublicQurbanRowsCache),
        );
      } catch {
        // Ignore storage write failure.
      }
    }
  }, [data?.qurbanRows]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateRows() {
      if (!groups.length) return;
      if (Array.isArray(data?.qurbanRows) && data.qurbanRows.length > 0) return;

      if (publicRows.length === 0) {
        setRowsLoading(true);
      }
      setRowsLoadError(null);

      try {
        const results = await Promise.all(
          groups.map(async (group) => {
            const groupName = String(group.groupName || "").trim();
            if (!groupName) return [];
            const response = await apiGetShohibulList(groupName);
            return Array.isArray(response?.rows) ? response.rows : [];
          }),
        );

        if (cancelled) return;

        const merged = results.flat().filter((row) => row?.isActive !== false);
        setPublicRows(merged);
        try {
          localStorage.setItem(
            PUBLIC_QURBAN_ROWS_CACHE_KEY,
            JSON.stringify({
              savedAt: Date.now(),
              rows: merged,
            } satisfies PublicQurbanRowsCache),
          );
        } catch {
          // Ignore storage write failure.
        }
      } catch {
        if (!cancelled) {
          setRowsLoadError("Daftar warga qurban publik belum berhasil dimuat.");
        }
      } finally {
        if (!cancelled) {
          setRowsLoading(false);
        }
      }
    }

    hydrateRows();

    return () => {
      cancelled = true;
    };
  }, [groups, data?.qurbanRows, publicRows.length]);

  const cards = useMemo<PublicShohibulCard[]>(() => {
    return publicRows.map((row) => {
      const target = safeNumber(row.targetBayar);
      const paid = safeNumber(row.totalBayar);
      const progressPct = target > 0 ? clampPct((paid / target) * 100) : 0;

      return {
        nama: row.nama,
        grup: row.grup,
        statusLabel: deriveStatus(row),
        progressPct,
        sapiNumber: parseSapiNumber(row.grup),
      };
    });
  }, [publicRows]);

  const activeGroup = selectedGroup || groups[0]?.groupName || "";
  const visibleCards = useMemo(
    () => cards.filter((card) => card.grup === activeGroup),
    [cards, activeGroup],
  );

  const activeGroupMeta = groups.find((group) => group.groupName === activeGroup);
  const filledSlots = safeNumber(activeGroupMeta?.filledSlots) || visibleCards.length;
  const totalSlots = safeNumber(activeGroupMeta?.totalSlots) || visibleCards.length;
  const paymentPct = clampPct(safeNumber(activeGroupMeta?.paymentProgressPct));

  const initialShellLoading = loading && !data;

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-2">
      <section className="relative overflow-hidden rounded-[30px] border border-border bg-card p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,246,241,0.98))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/80" />
        <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Daftar Warga Qurban
            </div>
            <h2 className="mt-3 text-[1.75rem] font-black leading-[1.06] tracking-[-0.03em] text-foreground">
              Cek grup patungan qurban
            </h2>
            <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
              Warga bisa melihat masuk di grup sapi yang mana, dengan status yang
              tetap informatif dan nyaman dilihat bersama.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <Beef className="h-5 w-5" />
          </div>
        </div>

        {isRefreshing && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Menyinkronkan daftar warga
          </div>
        )}

        <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar">
          {initialShellLoading
            ? Array.from({ length: 3 }).map((_, idx) => <PillSkeleton key={idx} />)
            : groups.map((group, index) => {
                const groupName = group.groupName || `Sapi ${index + 1}`;
                const active = activeGroup === groupName;
                const sapiNumber = parseSapiNumber(groupName);

                return (
                  <button
                    key={groupName}
                    type="button"
                    onClick={() => setSelectedGroup(groupName)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Beef className="h-4 w-4" />
                    <span>Sapi {sapiNumber}</span>
                  </button>
                );
              })}
        </div>

        <div className="mt-5 rounded-[24px] border border-border bg-background/90 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Grup Aktif
              </div>
              <div className="mt-1 text-lg font-black tracking-tight text-foreground">
                {activeGroup || "Memuat grup..."}
              </div>
            </div>

            <div className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-black text-amber-800">
              {paymentPct}%
            </div>
          </div>

          <div className="mt-3 text-sm text-muted-foreground">
            {filledSlots}/{totalSlots || filledSlots} slot terisi
          </div>

          <div className="mt-3">
            <ProgressBar value={paymentPct} color={getProgressColor(paymentPct)} thin />
          </div>
        </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[30px] border border-border bg-card p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.05),transparent_30%)] pointer-events-none" />
        <div className="relative">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Shohibul
            </div>
            <div className="text-[1.1rem] font-black tracking-tight text-foreground">
              Daftar warga pada {activeGroup || "grup qurban"}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {(initialShellLoading || rowsLoading) &&
            visibleCards.length === 0 &&
            Array.from({ length: 4 }).map((_, idx) => <CardSkeleton key={idx} />)}

          {!initialShellLoading && !rowsLoading && rowsLoadError && visibleCards.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-border bg-muted/20 p-5 text-sm leading-relaxed text-muted-foreground">
              {rowsLoadError}
            </div>
          )}

          {!initialShellLoading && !rowsLoading && !rowsLoadError && visibleCards.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-border bg-muted/20 p-5 text-sm leading-relaxed text-muted-foreground">
              Belum ada data warga untuk grup ini.
            </div>
          )}

          {visibleCards.map((card, idx) => (
            <article
              key={`${card.grup}-${card.nama}-${idx}`}
              className="rounded-[24px] border border-border bg-white/90 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-[1rem] font-black leading-tight text-foreground">
                      {card.nama}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                        Sapi {card.sapiNumber}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusChip(
                          card.statusLabel,
                        )}`}
                      >
                        {card.statusLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-sm font-black text-foreground">{card.progressPct}%</div>
                  <div className="text-[11px] text-muted-foreground">progres</div>
                </div>
              </div>

              <div className="mt-4">
                <ProgressBar
                  value={card.progressPct}
                  color={getProgressColor(card.progressPct)}
                  thin
                />
              </div>
            </article>
          ))}
        </div>
        </div>
      </section>
    </div>
  );
}
