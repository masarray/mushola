import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { apiSubmitCorrection } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck, Clock, AlertTriangle, FileWarning,
  Loader2, Send, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Tab = 'corrections' | 'logs';

export function AuditScreen() {
  const { user, internalData, refreshInternal } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('corrections');

  // Correction modal
  const [showModal, setShowModal] = useState(false);
  const [corrRefId, setCorrRefId] = useState('');
  const [corrOldValue, setCorrOldValue] = useState(0);
  const [corrNewValue, setCorrNewValue] = useState('');
  const [corrReason, setCorrReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const corrections = internalData?.recentCorrections || [];
  const auditLogs = internalData?.auditLogs || [];
  const transactions = internalData?.recentTransactions || [];

  const openCorrectionModal = useCallback((refId: string, oldNominal: number) => {
    setCorrRefId(refId);
    setCorrOldValue(oldNominal);
    setCorrNewValue('');
    setCorrReason('');
    setShowModal(true);
  }, []);

  const handleSubmitCorrection = useCallback(async () => {
    if (!user) return;
    const newVal = Number(corrNewValue);
    if (isNaN(newVal) || newVal < 0) return toast({ title: 'Nilai baru tidak valid', variant: 'destructive' });
    if (!corrReason.trim()) return toast({ title: 'Alasan wajib diisi', variant: 'destructive' });

    setSubmitting(true);
    try {
      const res = await apiSubmitCorrection({
        email: user.email,
        refId: corrRefId,
        nilaiSeharusnya: newVal,
        alasan: corrReason.trim(),
      });
      if (res.success) {
        toast({ title: 'Koreksi berhasil disimpan ✓' });
        setShowModal(false);
        refreshInternal();
      } else {
        toast({ title: res.message || 'Gagal menyimpan', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: err.message || 'Gagal menyimpan', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [user, corrRefId, corrNewValue, corrReason, toast, refreshInternal]);

  // Only NORMAL transactions can be corrected
  const correctableTransactions = transactions.filter(t => t.status === 'NORMAL');

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-2xl p-1">
        {([
          { key: 'corrections' as Tab, label: '⚠️ Koreksi' },
          { key: 'logs' as Tab, label: '📜 Audit Log' },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              tab === t.key ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Corrections Tab */}
      {tab === 'corrections' && (
        <>
          {/* Correctable Transactions */}
          {correctableTransactions.length > 0 && (
            <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
              <h3 className="font-heading text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-amber-500" />
                Koreksi Transaksi
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Klik tombol "Koreksi" pada transaksi yang perlu diperbaiki.
              </p>
              <div className="space-y-2">
                {correctableTransactions.slice(0, 10).map((trx) => (
                  <div key={trx.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{trx.kategori}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {trx.id} · {formatCurrency(trx.nominal)}
                      </p>
                    </div>
                    <button
                      onClick={() => openCorrectionModal(trx.id, Number(trx.nominal))}
                      className="px-3 py-1.5 text-[11px] font-bold bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                    >
                      Koreksi
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Corrections */}
          <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
            <h3 className="font-heading text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Riwayat Koreksi
            </h3>
            {corrections.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada koreksi</p>
            ) : (
              <div className="space-y-3">
                {corrections.map((c) => (
                  <div key={c.id} className="py-2 border-b border-border/30 last:border-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{c.kategori}</p>
                      <span className="text-xs font-bold text-amber-600">{formatCurrency(c.nominal)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(c.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      {c.refId && ` · Ref: ${c.refId}`}
                    </p>
                    {c.correctionReason && (
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{c.correctionReason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Audit Logs Tab */}
      {tab === 'logs' && (
        <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
          <h3 className="font-heading text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Audit Log
          </h3>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Belum ada audit log</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.logId} className="py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-muted/60 rounded-full text-foreground">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(log.waktu).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{log.nama || log.email}
                  </p>
                  {log.transactionId && (
                    <p className="text-[10px] text-muted-foreground/60">{log.transactionId}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Correction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-3xl border border-border p-6 w-full max-w-md shadow-elevated animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold text-foreground">Koreksi Transaksi</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-muted/30 rounded-xl p-3 mb-4 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Ref ID</span>
                <span className="font-bold font-mono text-foreground">{corrRefId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Nilai Lama</span>
                <span className="font-bold text-foreground">{formatCurrency(corrOldValue)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Nilai Seharusnya
                </label>
                <Input
                  type="number"
                  value={corrNewValue}
                  onChange={(e) => setCorrNewValue(e.target.value)}
                  placeholder="0"
                  className="rounded-xl h-11 bg-background"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Alasan Koreksi
                </label>
                <Input
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                  placeholder="Alasan koreksi..."
                  className="rounded-xl h-11 bg-background"
                />
              </div>
            </div>

            <Button
              onClick={handleSubmitCorrection}
              disabled={submitting}
              className="w-full mt-4 h-12 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600
                         text-white font-bold text-sm shadow-soft transition-all duration-200 active:scale-[0.98]"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
              ) : (
                <><Send className="w-4 h-4" /> Simpan Koreksi</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
