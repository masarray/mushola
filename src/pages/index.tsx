import { useState, useEffect, useCallback, useRef } from "react";
import { BottomNav, type Screen } from "@/components/dkm/bottomnav";
import { HomeScreen } from "@/components/dkm/homescreen";
import { EventScreen } from "@/components/dkm/eventscreen";
import { LoginScreen } from "@/components/dkm/loginscreen";
import { InputScreen } from "@/components/dkm/inputscreen";
import { RekapScreen } from "@/components/dkm/rekapscreen";
import { QurbanScreen } from "@/components/dkm/qurbanscreen";
import { PublicQurbanScreen } from "@/components/dkm/publicqurbanscreen";
import { AuditScreen } from "@/components/dkm/auditscreen";
import { AccountScreen } from "@/components/dkm/accountscreen";
import { InstallPrompt } from "@/components/dkm/installprompt";
import { getErrorMessage, loadPublicData, type PublicData } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { RefreshCw } from "lucide-react";

const APP_ICON_URL = `${import.meta.env.BASE_URL}favicon.svg`;
const PUBLIC_CACHE_KEY = "dkm_public_data_cache_v1";
const PUBLIC_CACHE_TTL_MS = 1000 * 60 * 3;

type PublicCachePayload = {
  savedAt: number;
  data: PublicData;
};

const Index = () => {
  const { user } = useAuth();
  const isBendahara = user?.role === "BENDAHARA";
  const [publicQurbanDefaultGroup, setPublicQurbanDefaultGroup] = useState<string>("");
  const [screen, setScreen] = useState<Screen>("home");
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isRefreshingFromCache, setIsRefreshingFromCache] = useState(false);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const PULL_THRESHOLD = 80;

  const fetchData = useCallback(async (isRefresh = false, useCache = false) => {
    const now = Date.now();
    let hadFreshCache = false;

    if (useCache) {
      try {
        const raw = localStorage.getItem(PUBLIC_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as PublicCachePayload;
          if (
            parsed &&
            parsed.data &&
            typeof parsed.savedAt === "number" &&
            now - parsed.savedAt < PUBLIC_CACHE_TTL_MS
          ) {
            setData(parsed.data);
            setLoading(false);
            setIsRefreshingFromCache(true);
            hadFreshCache = true;
          }
        }
      } catch {
        // Ignore invalid cache payload.
      }
    }

    if (isRefresh) setRefreshing(true);
    else if (!hadFreshCache) setLoading(true);

    setError(null);

    const loadMessageTimer = window.setTimeout(() => {
      setLoadMessage(
        hadFreshCache
          ? "Memperbarui ringkasan mushola dari spreadsheet..."
          : "Mengambil data terbaru dari spreadsheet...",
      );
    }, 700);

    try {
      const result = await loadPublicData();
      setData(result);
      try {
        localStorage.setItem(
          PUBLIC_CACHE_KEY,
          JSON.stringify({
            savedAt: Date.now(),
            data: result,
          } satisfies PublicCachePayload),
        );
      } catch {
        // Ignore storage write failure.
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      window.clearTimeout(loadMessageTimer);
      setLoadMessage(null);
      setLoading(false);
      setRefreshing(false);
      setIsRefreshingFromCache(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false, true);
  }, [fetchData]);

  useEffect(() => {
    if (user) {
      setScreen(user.role === "BENDAHARA" ? "input" : "rekap");
      return;
    }

    setScreen((prev) => {
      if (prev === "home" || prev === "event" || prev === "login") {
        return prev;
      }
      return "home";
    });
  }, [user]);

  const navigate = useCallback((s: Screen, options?: { defaultGroup?: string }) => {
    if (s === "input" && user?.role !== "BENDAHARA") {
      setScreen("rekap");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (s === "qurban") {
      const fallbackLastGroup =
        Array.isArray(data?.qurban?.groups) && data.qurban.groups.length > 0
          ? data.qurban.groups[data.qurban.groups.length - 1]?.groupName || ""
          : "";
      setPublicQurbanDefaultGroup(options?.defaultGroup || fallbackLastGroup);
    }

    setScreen(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [user, data?.qurban?.groups]);

  useEffect(() => {
    if (screen === "input" && user?.role !== "BENDAHARA") {
      setScreen(user ? "rekap" : "login");
    }
  }, [screen, user]);

  const handleLoginSuccess = useCallback(() => {
    // Handled by auth state effect.
  }, []);

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

  const screenTitles: Record<Screen, string> = {
    home: "Dashboard Publik",
    event: "Event Qurban",
    login: "Login Internal",
    input: "Input Transaksi",
    rekap: "Rekap Keuangan",
    qurban: user ? "Manajemen Qurban" : "Info Qurban Warga",
    audit: "Audit & Koreksi",
    account: "Akun Saya",
  };

  return (
    <div
      className="min-h-screen bg-background"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance > 10 ? pullDistance : 0 }}
      >
        <RefreshCw
          className={`h-5 w-5 transition-transform duration-200 ${
            refreshing ? "animate-spin text-primary" : ""
          } ${
            pullDistance >= PULL_THRESHOLD
              ? "scale-110 text-primary"
              : "text-muted-foreground"
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

      {loadMessage && !refreshing && (
        <div className="px-4 pt-2">
          <div className="mx-auto max-w-[430px] rounded-full border border-primary/10 bg-primary/5 px-3 py-2 text-center text-[11px] font-semibold tracking-wide text-primary/90 shadow-[0_8px_24px_rgba(22,101,52,0.06)]">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              {loadMessage}
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[430px] px-3.5 pt-3 pb-[128px] sm:px-4">
        {!(screen === "home" && !user) && (
          <header className="mb-4 py-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  {user
                    ? `Panel ${user.role}`
                    : "Transparansi Keuangan Mushola"}
                </div>
                <h1 className="mt-1.5 font-heading text-[24px] leading-[1.1] font-bold tracking-tight text-foreground">
                  {screenTitles[screen]}
                </h1>
                {user && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {user.name} - {user.role}
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

        <main>
          {screen === "home" && (
            <HomeScreen
              data={data}
              loading={loading}
              error={error}
              isRefreshing={isRefreshingFromCache}
              onNavigate={navigate}
            />
          )}
          {screen === "event" && (
            <EventScreen
              data={data}
              loading={loading}
              isRefreshing={isRefreshingFromCache}
              canOpenGroupsDetail={Boolean(user)}
              onOpenGroupsDetail={(groupName) =>
                navigate("qurban", { defaultGroup: groupName })
              }
            />
          )}
          {screen === "login" && (
            <LoginScreen onLoginSuccess={handleLoginSuccess} />
          )}
          {screen === "input" && isBendahara && <InputScreen />}
          {screen === "rekap" && <RekapScreen />}
          {screen === "qurban" &&
            (user ? (
              <QurbanScreen />
            ) : (
              <PublicQurbanScreen
                data={data}
                loading={loading}
                isRefreshing={isRefreshingFromCache}
                initialSelectedGroup={publicQurbanDefaultGroup}
              />
            ))}
          {screen === "audit" && <AuditScreen />}
          {screen === "account" && <AccountScreen />}
        </main>
      </div>

      <BottomNav active={screen} onNavigate={navigate} />
      {!user && <InstallPrompt />}
    </div>
  );
};

export default Index;
