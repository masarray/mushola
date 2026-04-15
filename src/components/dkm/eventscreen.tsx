import { PublicData } from "@/lib/api";
import { formatCurrency, safeNumber, getProgressColor } from "@/lib/format";
import { ProgressBar } from "./ProgressBar";
import { Users, CircleDollarSign, Layers, BarChart3 } from "lucide-react";

interface EventScreenProps {
  data: PublicData | null;
  loading: boolean;
}

export function EventScreen({ data, loading }: EventScreenProps) {
  const qurban = data?.qurban;
  const groups = qurban?.groups || [];

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
        <div className="mb-5">
          <h3 className="font-heading text-xl font-bold text-foreground">Progress Qurban</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Ringkasan grup dan kebutuhan dana yang paling relevan saat ini.
          </p>
        </div>

        {/* Metric Strip */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={Layers} label="Total Sapi" value={String(safeNumber(qurban?.totalGroups))} loading={loading} />
          <MetricCard icon={Users} label="Slot Terisi" value={String(safeNumber(qurban?.totalFilled))} loading={loading} />
          <MetricCard icon={BarChart3} label="Sisa Slot" value={String(safeNumber(qurban?.totalEmpty))} loading={loading} />
          <MetricCard icon={CircleDollarSign} label="Dana Terkumpul" value={formatCurrency(qurban?.totalNominal)} loading={loading} />
        </div>

        {/* Group List */}
        <div className="flex flex-col gap-3 mt-5">
          {loading ? (
            <div className="bg-dkm-surface rounded-2xl p-5 border border-border/50 text-center">
              <p className="text-sm text-muted-foreground">Memuat data grup...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-dkm-surface rounded-2xl p-5 border border-border/50 text-center">
              <p className="text-sm font-semibold text-foreground">Belum ada data grup</p>
              <p className="mt-1 text-xs text-muted-foreground">Data qurban akan tampil setelah backend publik terbaca.</p>
            </div>
          ) : (
            groups.map((group, i) => (
              <GroupCard key={i} group={group} index={i} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="bg-dkm-surface rounded-2xl p-4 border border-border/30 shadow-card">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <strong className="block text-xl font-bold text-foreground tracking-tight">
        {loading ? "..." : value}
      </strong>
    </div>
  );
}

function GroupCard({ group, index }: { group: PublicData["qurban"]["groups"][0]; index: number }) {
  const fillColor = getProgressColor(safeNumber(group.fillPct));
  const paymentColor = group.paymentProgressColor || getProgressColor(safeNumber(group.paymentProgressPct));

  return (
    <div
      className="bg-dkm-surface rounded-2xl p-4 border border-border/50 shadow-card animate-slide-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-center justify-between mb-3">
        <strong className="text-sm font-semibold text-foreground">
          {group.groupName || "-"}
        </strong>
        <span className="text-xs text-muted-foreground font-medium">
          {safeNumber(group.filledSlots)}/{safeNumber(group.totalSlots)} peserta
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
        <span>Keterisian</span>
        <span className="font-semibold">{safeNumber(group.fillPct)}%</span>
      </div>
      <ProgressBar value={safeNumber(group.fillPct)} color={fillColor} thin />

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 mt-3">
        <span>Pembayaran</span>
        <span className="font-semibold">{safeNumber(group.paymentProgressPct)}%</span>
      </div>
      <ProgressBar value={safeNumber(group.paymentProgressPct)} color={paymentColor} thin />
    </div>
  );
}
