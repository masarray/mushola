const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycby9PRznogJcmuzsJ7NaiSX4i4m--zW1CAiOMigPF0MTvj3ydWxNZEdkIx9YKAGXhwmK/exec';

/* ── Types ── */
export interface QurbanGroup {
  groupName?: string;
  filledSlots?: number;
  totalSlots?: number;
  fillPct?: number;
  paymentProgressPct?: number;
  paymentProgressColor?: string;
  status?: string;
  collectedNominal?: number;
  targetNominal?: number;
  remainingNominal?: number;
  lunasCount?: number;
  dpCount?: number;
  belumCount?: number;
  paymentCollectedNominal?: number;
  paymentTargetNominal?: number;
}

export interface PublicData {
  config?: Record<string, unknown>;
  summary: {
    'Saldo Kas'?: number;
    'Total Pemasukan'?: number;
    'Total Pengeluaran'?: number;
    'Saldo Operasional'?: number;
    'Saldo Ramadhan'?: number;
    'Saldo Qurban'?: number;
  };
  qurban: {
    totalNominal?: number;
    progressPct?: number;
    progressColor?: string;
    remainingNominal?: number;
    totalFilled?: number;
    totalSlots?: number;
    totalGroups?: number;
    totalEmpty?: number;
    groups?: QurbanGroup[];
  };
  seasonal: {
    heroEvent: string;
    ramadhanMode?: string;
    qurbanMode?: string;
  };
}

export interface DkmUser {
  userId: string;
  email: string;
  name: string;
  role: 'BENDAHARA' | 'PENGURUS';
}

export interface Transaction {
  id: string;
  tanggal: string;
  jenis: 'PEMASUKAN' | 'PENGELUARAN';
  kategori: string;
  event: string;
  metode: string;
  nominal: number;
  keterangan: string;
  status: 'NORMAL' | 'KOREKSI';
  refId?: string;
  correctionReason?: string;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return 'Terjadi kesalahan. Coba lagi.';
}

export interface QurbanRow {
  shohibulId: string;
  no: number;
  nama: string;
  grup: string;
  noHp: string;
  targetBayar: number;
  totalBayar: number;
  sisaBayar: number;
  statusBayar: string;
  isActive: boolean;
}

export interface QurbanPayment {
  paymentId: string;
  tanggal: string;
  shohibulId: string;
  namaShohibul: string;
  grup: string;
  nominalBayar: number;
  metode: string;
  keterangan: string;
  inputByEmail: string;
  inputByName: string;
  createdAt: string;
  linkedTransactionId: string;
}

export interface AuditLog {
  logId: string;
  waktu: string;
  email: string;
  nama: string;
  role: string;
  action: string;
  transactionId: string;
  detail: string;
}

export interface InternalData {
  success: boolean;
  user: DkmUser;
  summary: PublicData['summary'];
  qurban: PublicData['qurban'];
  qurbanRows: QurbanRow[];
  qurbanPayments: QurbanPayment[];
  recentTransactions: Transaction[];
  recentCorrections: Transaction[];
  auditLogs: AuditLog[];
}

/* ── JSONP loader ── */
export function loadJsonp<T = unknown>(url: string, timeoutMs = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const callbackName = `dkmJsonp_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');
    const joiner = url.includes('?') ? '&' : '?';
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let finished = false;

    function cleanup() {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      try { delete (window as unknown)[callbackName]; } catch { (window as unknown)[callbackName] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    (window as unknown)[callbackName] = (payload: T) => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error('Gagal memuat data dari server'));
    };

    timeoutHandle = setTimeout(() => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error('Request timeout — coba lagi nanti'));
    }, timeoutMs);

    script.src = `${url}${joiner}callback=${callbackName}`;
    document.body.appendChild(script);
  });
}

/* ── Public API ── */
export async function loadPublicData(): Promise<PublicData> {
  return loadJsonp<PublicData>(`${APPS_SCRIPT_URL}?api=public`);
}

/* ── Auth API ── */
export async function apiLogin(email: string): Promise<{ success: boolean; user?: DkmUser; message?: string }> {
  return loadJsonp(`${APPS_SCRIPT_URL}?api=login&email=${encodeURIComponent(email)}`);
}

/* ── Internal Dashboard ── */
export async function loadInternalData(email: string): Promise<InternalData> {
  return loadJsonp<InternalData>(`${APPS_SCRIPT_URL}?api=internal&email=${encodeURIComponent(email)}`);
}

/* ── Transaction Submit ── */
export async function apiSubmitTransaction(payload: {
  email: string;
  tanggal: string;
  jenis: string;
  kategori: string;
  event: string;
  metode: string;
  nominal: number;
  keterangan: string;
}): Promise<{ success: boolean; result?: Record<string, unknown>; message?: string }> {
  const params = new URLSearchParams({
    api: 'submit_transaction',
    email: payload.email,
    tanggal: payload.tanggal,
    jenis: payload.jenis,
    kategori: payload.kategori,
    event: payload.event,
    metode: payload.metode,
    nominal: String(payload.nominal),
    keterangan: payload.keterangan,
  });
  return loadJsonp(`${APPS_SCRIPT_URL}?${params.toString()}`);
}

/* ── Correction Submit ── */
export async function apiSubmitCorrection(payload: {
  email: string;
  refId: string;
  nilaiSeharusnya: number;
  alasan: string;
}): Promise<{ success: boolean; result?: Record<string, unknown>; message?: string }> {
  const params = new URLSearchParams({
    api: 'submit_correction',
    email: payload.email,
    refId: payload.refId,
    nilaiSeharusnya: String(payload.nilaiSeharusnya),
    alasan: payload.alasan,
  });
  return loadJsonp(`${APPS_SCRIPT_URL}?${params.toString()}`);
}

/* ── Shohibul List ── */
export async function apiGetShohibulList(groupName: string): Promise<{ success: boolean; rows: QurbanRow[] }> {
  return loadJsonp(`${APPS_SCRIPT_URL}?api=shohibul_list&group=${encodeURIComponent(groupName)}`);
}

/* ── Shohibul Detail ── */
export async function apiGetShohibulDetail(shohibulId: string): Promise<{ success: boolean; row: QurbanRow }> {
  return loadJsonp(`${APPS_SCRIPT_URL}?api=shohibul_detail&id=${encodeURIComponent(shohibulId)}`);
}

/* ── Qurban Payment Submit ── */
export async function apiSubmitQurbanPayment(payload: {
  email: string;
  tanggal: string;
  shohibulId: string;
  nominalBayar: number;
  metode: string;
  keterangan: string;
}): Promise<{ success: boolean; result?: Record<string, unknown>; message?: string }> {
  const params = new URLSearchParams({
    api: 'submit_qurban_payment',
    email: payload.email,
    tanggal: payload.tanggal,
    shohibulId: payload.shohibulId,
    nominalBayar: String(payload.nominalBayar),
    metode: payload.metode,
    keterangan: payload.keterangan,
  });
  return loadJsonp(`${APPS_SCRIPT_URL}?${params.toString()}`);
}
