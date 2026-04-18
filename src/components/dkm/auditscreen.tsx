import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  apiGetTransactionDetail,
  apiReviseTransaction,
  getErrorMessage,
  type TransactionDetail,
} from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ShieldCheck, Clock, FileWarning, Loader2, PencilLine, Send, X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Tab = 'revisions' | 'logs';

type RevisionForm = {
  tanggal: string;
  kategori: string;
  event: string;
  metode: string;
  nominal: string;
  keterangan: string;
  reason: string;
};

const EMPTY_FORM: RevisionForm = {
  tanggal: '',
  kategori: '',
  event: '',
  metode: '',
  nominal: '',
  keterangan: '',
  reason: '',
};

const EVENT_OPTIONS = ['Operasional', 'Ramadhan', 'Qurban'] as const;
const METODE_OPTIONS = ['Cash', 'Transfer'] as const;

export function AuditScreen() {
  const { user, internalData, refreshInternal } = useAuth();
  const { toast } = useToast();
  const isBendahara = user?.role === 'BENDAHARA';
  const [tab, setTab] = useState<Tab>('revisions');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetail | null>(null);
  const [form, setForm] = useState<RevisionForm>(EMPTY_FORM);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const auditLogs = internalData?.auditLogs || [];
  const transactions = internalData?.recentTransactions || [];
  const masterKategori = internalData?.masterKategori || [];
  const revisableTransactions = transactions.filter((t) => t.status === 'NORMAL');

  const kategoriOptions = useMemo(() => {
    const selectedEvent = form.event || selectedTransaction?.event || '';
    const filtered = masterKategori.filter((item) => {
      if (!selectedEvent) return true;
      return item.eventDefault === selectedEvent;
    });

    return filtered.map((item) => item.kategori);
  }, [masterKategori, form.event, selectedTransaction?.event]);

  const changedFields = useMemo(() => {
    if (!selectedTransaction) return [];

    const pairs = [
      { field: 'tanggal', label: 'Tanggal', before: selectedTransaction.tanggal?.slice(0, 10) || '', after: form.tanggal },
      { field: 'kategori', label: 'Kategori', before: selectedTransaction.kategori || '', after: form.kategori },
      { field: 'event', label: 'Event', before: selectedTransaction.event || '', after: form.event },
      { field: 'metode', label: 'Metode', before: selectedTransaction.metode || '', after: form.metode },
      { field: 'nominal', label: 'Nominal', before: String(Number(selectedTransaction.nominal || 0)), after: String(Number(form.nominal || 0)) },
      { field: 'keterangan', label: 'Keterangan', before: selectedTransaction.keterangan || '', after: form.keterangan },
    ];

    return pairs.filter((item) => item.before !== item.after);
  }, [selectedTransaction, form]);

  const openRevisionModal = useCallback(async (transactionId: string) => {
    if (!user || !isBendahara) return;

    setLoadingDetail(true);
    setShowRevisionModal(true);
    setSelectedTransaction(null);
    setForm(EMPTY_FORM);

    try {
      const res = await apiGetTransactionDetail({
        email: user.email,
        transactionId,
      });

      if (!res.success || !res.transaction) {
        toast({ title: res.message || 'Gagal memuat detail transaksi', variant: 'destructive' });
        setShowRevisionModal(false);
        return;
      }

      const trx = res.transaction;
      setSelectedTransaction(trx);
      const fallbackEvent = trx.event || 'Operasional';
      const kategoriForEvent = masterKategori
        .filter((item) => item.eventDefault === fallbackEvent)
        .map((item) => item.kategori);
      setForm({
        tanggal: trx.tanggal?.slice(0, 10) || '',
        kategori: trx.kategori || '',
        event: fallbackEvent,
        metode: trx.metode || 'Cash',
        nominal: String(Number(trx.nominal || 0)),
        keterangan: trx.keterangan || '',
        reason: '',
      });
      if (trx.kategori && kategoriForEvent.length > 0 && kategoriForEvent.indexOf(trx.kategori) === -1) {
        setForm((prev) => ({ ...prev, kategori: kategoriForEvent[0] || prev.kategori }));
      }
    } catch (err: unknown) {
      toast({ title: getErrorMessage(err), variant: 'destructive' });
      setShowRevisionModal(false);
    } finally {
      setLoadingDetail(false);
    }
  }, [user, isBendahara, toast, masterKategori]);

  const handleEventChange = useCallback((value: string) => {
    setForm((prev) => {
      const filtered = masterKategori.filter((item) => item.eventDefault === value).map((item) => item.kategori);
      const nextKategori = filtered.indexOf(prev.kategori) >= 0 ? prev.kategori : (filtered[0] || '');
      return {
        ...prev,
        event: value,
        kategori: nextKategori,
      };
    });
  }, [masterKategori]);

  const handleSubmitRevision = useCallback(async () => {
    if (!user || !isBendahara || !selectedTransaction) return;
    if (!form.reason.trim()) {
      toast({ title: 'Alasan revisi wajib diisi', variant: 'destructive' });
      return;
    }
    if (changedFields.length === 0) {
      toast({ title: 'Belum ada perubahan yang direvisi', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiReviseTransaction({
        email: user.email,
        transactionId: selectedTransaction.id,
        tanggal: form.tanggal,
        kategori: form.kategori,
        event: form.event,
        metode: form.metode,
        nominal: Number(form.nominal),
        keterangan: form.keterangan,
        reason: form.reason.trim(),
      });

      if (!res.success) {
        toast({ title: res.message || 'Gagal menyimpan revisi', variant: 'destructive' });
        return;
      }

      toast({ title: `Revisi ${selectedTransaction.id} berhasil disimpan` });
      setShowRevisionModal(false);
      setSelectedTransaction(null);
      setForm(EMPTY_FORM);
      await refreshInternal();
    } catch (err: unknown) {
      toast({ title: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [user, isBendahara, selectedTransaction, form, changedFields.length, toast, refreshInternal]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex gap-1 rounded-2xl bg-muted/50 p-1">
        {([
          { key: 'revisions' as Tab, label: 'Revisi' },
          { key: 'logs' as Tab, label: 'Audit Log' },
        ]).map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 ${
              tab === item.key ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'revisions' && (
        <section className="rounded-3xl border border-border bg-card p-[clamp(1rem,4vw,1.25rem)] shadow-card">
          <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-bold text-foreground">
            <FileWarning className="h-4 w-4 text-amber-500" />
            Workspace Revisi Transaksi
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            {isBendahara
              ? 'Pilih transaksi normal, buka detailnya, lalu revisi field yang diperbolehkan. Sistem akan mencatat before dan after pada TRX ID yang sama.'
              : 'Mode pengurus hanya dapat melihat audit log. Workspace revisi hanya untuk bendahara.'}
          </p>

          <div className="space-y-2">
            {revisableTransactions.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada transaksi yang bisa direvisi</p>
            )}

            {revisableTransactions.slice(0, 12).map((trx) => (
              <div key={trx.id} className="flex items-center justify-between gap-3 border-b border-border/30 py-2 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{trx.kategori}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {trx.id} · {trx.event} · {formatCurrency(Number(trx.nominal || 0))}
                  </p>
                </div>
                <button
                  onClick={() => openRevisionModal(trx.id)}
                  disabled={!isBendahara}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                    isBendahara
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'cursor-not-allowed bg-muted text-muted-foreground'
                  }`}
                >
                  {isBendahara ? 'Revisi' : 'Terkunci'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'logs' && (
        <section className="rounded-3xl border border-border bg-card p-[clamp(1rem,4vw,1.25rem)] shadow-card">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-sm font-bold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Audit Log
          </h3>
          {auditLogs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Belum ada audit log</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.logId} className="border-b border-border/30 py-2 last:border-0">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-foreground">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    <Clock className="mr-1 inline h-3 w-3" />
                    {new Date(log.waktu).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {log.nama || log.email}
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

      {showRevisionModal && isBendahara && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-elevated animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-foreground">Revisi Transaksi</h3>
              <button onClick={() => setShowRevisionModal(false)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/50">
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingDetail && (
              <div className="space-y-4 py-2">
                <div className="rounded-xl bg-muted/25 p-3">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 animate-pulse">
                    Menyiapkan form revisi...
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28 justify-self-end" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className={idx === 5 ? 'sm:col-span-2' : ''}>
                      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 animate-pulse">
                        {idx === 0 && 'Memuat tanggal'}
                        {idx === 1 && 'Memuat nominal'}
                        {idx === 2 && 'Memuat kategori'}
                        {idx === 3 && 'Menyiapkan event'}
                        {idx === 4 && 'Menyiapkan metode'}
                        {idx === 5 && 'Memuat keterangan'}
                      </div>
                      <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
              </div>
            )}

            {!loadingDetail && selectedTransaction && (
              <>
                <div className="mb-4 rounded-xl bg-muted/30 p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">TRX ID</span>
                    <span className="font-mono font-bold text-foreground">{selectedTransaction.id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Jenis</span>
                    <span className="font-bold text-foreground">{selectedTransaction.jenis}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tanggal</label>
                    <Input type="date" value={form.tanggal} onChange={(e) => setForm((prev) => ({ ...prev, tanggal: e.target.value }))} className="h-11 rounded-xl bg-background" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nominal</label>
                    <Input type="number" inputMode="numeric" value={form.nominal} onChange={(e) => setForm((prev) => ({ ...prev, nominal: e.target.value.replace(/\D/g, '') }))} className="h-11 rounded-xl bg-background" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Kategori</label>
                    <Select value={form.kategori} onValueChange={(value) => setForm((prev) => ({ ...prev, kategori: value }))}>
                      <SelectTrigger className="h-11 rounded-xl bg-background">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {kategoriOptions.map((item) => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Event</label>
                    <Select value={form.event} onValueChange={handleEventChange}>
                      <SelectTrigger className="h-11 rounded-xl bg-background">
                        <SelectValue placeholder="Pilih event" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_OPTIONS.map((item) => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Metode</label>
                    <Select value={form.metode} onValueChange={(value) => setForm((prev) => ({ ...prev, metode: value }))}>
                      <SelectTrigger className="h-11 rounded-xl bg-background">
                        <SelectValue placeholder="Pilih metode" />
                      </SelectTrigger>
                      <SelectContent>
                        {METODE_OPTIONS.map((item) => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Keterangan</label>
                    <Input value={form.keterangan} onChange={(e) => setForm((prev) => ({ ...prev, keterangan: e.target.value }))} className="h-11 rounded-xl bg-background" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Alasan Revisi</label>
                    <Input value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} placeholder="Wajib diisi" className="h-11 rounded-xl bg-background" />
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <PencilLine className="h-3.5 w-3.5" />
                    Changed Fields
                  </div>
                  {changedFields.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Belum ada perubahan.</p>
                  ) : (
                    <div className="space-y-2">
                      {changedFields.map((item) => (
                        <div key={item.field} className="text-xs">
                          <div className="font-semibold text-foreground">{item.label}</div>
                          <div className="text-muted-foreground">Before: {item.field === 'nominal' ? formatCurrency(Number(item.before || 0)) : item.before || '-'}</div>
                          <div className="text-foreground">After: {item.field === 'nominal' ? formatCurrency(Number(item.after || 0)) : item.after || '-'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSubmitRevision}
                  disabled={submitting || changedFields.length === 0}
                  className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 text-sm font-bold text-white shadow-soft transition-all duration-200 active:scale-[0.98]"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan revisi...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Simpan Revisi</>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
