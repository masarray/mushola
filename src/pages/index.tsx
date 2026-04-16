import { useState, useEffect, useCallback, useRef } from 'react';
import { BottomNav, type Screen } from '@/components/dkm/bottomnav';
import { HomeScreen } from '@/components/dkm/homescreen';
import { EventScreen } from '@/components/dkm/eventscreen';
import { LoginScreen } from '@/components/dkm/loginscreen';
import { InputScreen } from '@/components/dkm/inputscreen';
import { RekapScreen } from '@/components/dkm/rekapscreen';
import { QurbanScreen } from '@/components/dkm/qurbanscreen';
import { AuditScreen } from '@/components/dkm/auditscreen';
import { AccountScreen } from '@/components/dkm/accountscreen';
import { HomeScreenSkeleton, EventScreenSkeleton } from '@/components/dkm/skeletons';
import { loadPublicData, type PublicData } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { RefreshCw } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const [screen, setScreen] = useState<Screen>('home');
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const PULL_THRESHOLD = 80;

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await loadPublicData();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // When user logs in, switch to appropriate default screen
  useEffect(() => {
    if (user) {
      setScreen(user.role === 'BENDAHARA' ? 'input' : 'rekap');
    }
  }, [user]);

  const navigate = useCallback((s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLoginSuccess = useCallback(() => {
    // Will be handled by the user effect above
  }, []);

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || refreshing) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(deltaY * 0.5, 120));
    }
  }, [isPulling, refreshing]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD && !refreshing) fetchData(true);
    setPullDistance(0);
    setIsPulling(false);
  }, [pullDistance, refreshing, fetchData]);

  const showSkeleton = loading && !data;

  // Screen title
  const screenTitles: Record<Screen, string> = {
    home: 'Dashboard Publik',
    event: 'Event Qurban',
    login: 'Login Internal',
    input: 'Input Transaksi',
    rekap: 'Rekap Keuangan',
    qurban: 'Manajemen Qurban',
    audit: 'Audit & Koreksi',
    account: 'Akun Saya',
  };

  return (
    <div
      className="min-h-screen bg-background"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance > 10 ? pullDistance : 0 }}
      >
        <RefreshCw
          className={`w-5 h-5 transition-transform duration-200 ${
            refreshing ? 'animate-spin text-primary' : ''
          } ${pullDistance >= PULL_THRESHOLD ? 'text-primary scale-110' : 'text-muted-foreground'}`}
          style={{ transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)` }}
        />
      </div>

      {refreshing && (
        <div className="flex items-center justify-center py-2 bg-dkm-green-soft">
          <RefreshCw className="w-4 h-4 text-primary animate-spin mr-2" />
          <span className="text-xs font-semibold text-primary">Memperbarui data...</span>
        </div>
      )}

      <div className="max-w-[520px] mx-auto px-4 pt-3 pb-28">
                {/* Header */}
        {!(screen === 'home' && !user) && (
          <header className="py-2 mb-4">
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
              {user ? `Panel ${user.role}` : 'Transparansi Keuangan Mushola'}
            </div>
            <h1 className="mt-1.5 font-heading text-[24px] leading-[1.1] font-bold text-foreground tracking-tight">
              {screenTitles[screen]}
            </h1>
            {user && (
              <p className="mt-1 text-xs text-muted-foreground">
                {user.name} · {user.role}
              </p>
            )}
            {!user && (
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Mushola Raudhatul Mukminin
              </p>
            )}
          </header>
        )}

        {/* Screen Content */}
        <main>
          {screen === 'home' && (
            showSkeleton ? <HomeScreenSkeleton /> : <HomeScreen data={data} loading={loading} error={error} onNavigate={navigate} />
          )}
          {screen === 'event' && (
            showSkeleton ? <EventScreenSkeleton /> : <EventScreen data={data} loading={loading} />
          )}
          {screen === 'login' && <LoginScreen onLoginSuccess={handleLoginSuccess} />}
          {screen === 'input' && <InputScreen />}
          {screen === 'rekap' && <RekapScreen />}
          {screen === 'qurban' && <QurbanScreen />}
          {screen === 'audit' && <AuditScreen />}
          {screen === 'account' && <AccountScreen />}
        </main>
      </div>

      <BottomNav active={screen} onNavigate={navigate} />
    </div>
  );
};

export default Index;
