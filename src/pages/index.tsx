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
import {
  HomeScreenSkeleton,
  EventScreenSkeleton,
} from '@/components/dkm/skeletons';
import { getErrorMessage, loadPublicData, type PublicData } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { RefreshCw } from 'lucide-react';

const APP_ICON_URL = `${import.meta.env.BASE_URL}icon.svg`;

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
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling || refreshing) return;
      const deltaY = e.touches[0].clientY - touchStartY.current;
      if (deltaY > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(deltaY * 0.5, 120));
      }
    },
    [isPulling, refreshing],
  );

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
          className={`h-5 w-5 transition-transform duration-200 ${
            refreshing ? 'animate-spin text-primary' : ''
          } ${
            pullDistance >= PULL_THRESHOLD
              ? 'scale-110 text-primary'
              : 'text-muted-foreground'
          }`}
          style={{
            transform: refreshing
              ? undefined
              : `rotate(${pullDistance * 3}deg)`,
          }}
        />
      </div>

      {refreshing && (
        <div className="flex items-center justify-center bg-dkm-green-soft py-2">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin text-primary" />
          <span className="text-xs font-semibold text-primary">
            Memperbarui data...
          </span>
        </div>
      )}

      <div className="mx-auto max-w-[520px] px-4 pt-3 pb-[132px]">
        {/* Header */}
        {!(screen === 'home' && !user) && (
          <header className="mb-4 py-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  {user
                    ? `Panel ${user.role}`
                    : 'Transparansi Keuangan Mushola'}
                </div>
                <h1 className="mt-1.5 font-heading text-[24px] leading-[1.1] font-bold tracking-tight text-foreground">
                  {screenTitles[screen]}
                </h1>
                {user && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {user.name} Â· {user.role}
                  </p>
                )}
                {!user && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Mushola Raudhatul Mukminin
                  </p>
                )}
              </div>

              <img
                src={APP_ICON_URL}
                alt="Icon Mushola"
                className="mt-1 h-10 w-10 shrink-0 object-contain"
              />
            </div>
          </header>
        )}

        {/* Screen Content */}
        <main>
          {screen === 'home' &&
            (showSkeleton ? (
              <HomeScreenSkeleton />
            ) : (
              <HomeScreen
                data={data}
                loading={loading}
                error={error}
                onNavigate={navigate}
              />
            ))}
          {screen === 'event' &&
            (showSkeleton ? (
              <EventScreenSkeleton />
            ) : (
              <EventScreen data={data} loading={loading} />
            ))}
          {screen === 'login' && (
            <LoginScreen onLoginSuccess={handleLoginSuccess} />
          )}
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
