import { Home, CalendarDays, LogIn } from "lucide-react";
import { useState } from "react";

const navItems = [
  { id: "home", label: "Beranda", icon: Home },
  { id: "event", label: "Event", icon: CalendarDays },
  { id: "login", label: "Login", icon: LogIn },
];

const BottomNav = () => {
  const [active, setActive] = useState("home");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-lg">
        <div className="mx-3 mb-3 glass-elevated rounded-2xl px-2 py-2 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : ""}`} />
                <span className={`text-[10px] font-semibold ${isActive ? "text-primary-foreground" : ""}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
