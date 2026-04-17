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
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(500px,calc(100vw-24px))] z-20
                 bg-card/95 backdrop-blur-xl border border-border rounded-[22px] shadow-elevated
                 p-2 flex items-center justify-around gap-1"
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
              "flex flex-col items-center gap-0.5 py-2.5 px-3 rounded-2xl transition-all duration-200 active:scale-[0.97] min-w-[48px]",
              isActive
                ? "bg-dkm-green-soft text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted/50",
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className="text-[10px] font-semibold leading-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
