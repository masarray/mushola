import { useAuth } from "@/lib/auth";
import {
  Home,
  Calendar,
  LogIn,
  PenLine,
  BarChart3,
  ShieldCheck,
  User,
  Beef,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Screen =
  | "home"
  | "event"
  | "login"
  | "input"
  | "rekap"
  | "qurban"
  | "audit"
  | "account";

interface NavItem {
  screen: Screen;
  label: string;
  icon: React.ElementType;
}

const PUBLIC_NAV: NavItem[] = [
  { screen: "home", label: "Beranda", icon: Home },
  { screen: "event", label: "Event", icon: Calendar },
  { screen: "qurban", label: "Qurban", icon: Beef },
  { screen: "login", label: "Login", icon: LogIn },
];

const BENDAHARA_NAV: NavItem[] = [
  { screen: "input", label: "Input", icon: PenLine },
  { screen: "qurban", label: "Qurban", icon: Calendar },
  { screen: "rekap", label: "Rekap", icon: BarChart3 },
  { screen: "audit", label: "Audit", icon: ShieldCheck },
  { screen: "account", label: "Akun", icon: User },
];

const PENGURUS_NAV: NavItem[] = [
  { screen: "rekap", label: "Rekap", icon: BarChart3 },
  { screen: "qurban", label: "Qurban", icon: Calendar },
  { screen: "audit", label: "Audit", icon: ShieldCheck },
  { screen: "account", label: "Akun", icon: User },
];

interface BottomNavProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  const { user } = useAuth();

  const items = user
    ? user.role === "BENDAHARA"
      ? BENDAHARA_NAV
      : PENGURUS_NAV
    : PUBLIC_NAV;

  return (
    <nav
      className="fixed bottom-3 left-1/2 z-20 flex w-[min(430px,calc(100vw-20px))] -translate-x-1/2 items-center justify-around gap-0.5 rounded-full border border-border/90 bg-card/94 px-1.5 py-2 shadow-[0_12px_28px_rgba(15,23,42,0.10),0_1px_0_rgba(255,255,255,0.72)_inset] backdrop-blur-xl"
      aria-label="Navigasi utama"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.screen;
        return (
          <button
            key={item.screen}
            onClick={() => onNavigate(item.screen)}
            className={cn(
              "group relative flex min-w-[64px] flex-1 items-center justify-center px-1 py-1 transition-all duration-200 active:scale-[0.94]",
              "group relative flex min-w-0 flex-1 items-center justify-center px-0.5 py-1 transition-all duration-200 active:scale-[0.94]",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <div
              className={cn(
                "flex h-[58px] w-[58px] flex-col items-center justify-center rounded-full transition-all duration-200",
                "flex h-[clamp(50px,14vw,58px)] w-[clamp(50px,14vw,58px)] flex-col items-center justify-center rounded-full transition-all duration-200",
                isActive
                  ? "bg-dkm-green-soft shadow-[0_10px_24px_rgba(22,101,52,0.18),0_2px_0_rgba(255,255,255,0.68)_inset]"
                  : "bg-transparent group-hover:bg-muted/45 active:bg-muted/70 active:shadow-[0_6px_16px_rgba(15,23,42,0.10)_inset]",
              )}
            >
              <Icon
                className={cn(
                  "h-[clamp(18px,5vw,21px)] w-[clamp(18px,5vw,21px)] transition-all duration-200",
                  isActive
                    ? "scale-110 text-primary"
                    : "text-muted-foreground group-hover:scale-105 group-hover:text-foreground",
                )}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span
                className={cn(
                  "mt-0.5 text-[clamp(9px,2.4vw,10px)] font-semibold leading-none transition-colors duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {item.label}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
