import { useLocation, Link } from "wouter";
import { Home, Search, MapPin, Plus, User } from "lucide-react";
import { useT } from "@/lib/i18n";

const navItems = [
  { path: "/", icon: Home, key: "home", i18nKey: "nav_home" },
  { path: "/activities", icon: Search, key: "search", i18nKey: "nav_search" },
  { path: "/create", icon: Plus, key: "create", i18nKey: "nav_create" },
  { path: "/map", icon: MapPin, key: "map", i18nKey: "nav_map" },
  { path: "/profile", icon: User, key: "profile", i18nKey: "nav_profile" },
];

export function BottomNav() {
  const [location] = useLocation();
  const { t } = useT();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border" data-testid="bottom-nav">
      <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <button
                data-testid={`nav-${item.key}`}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.path === "/create" ? (
                  <div className="bg-primary text-primary-foreground rounded-full p-2 -mt-4 shadow-lg">
                    <Icon className="w-5 h-5" />
                  </div>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                <span className="text-[10px] font-medium">{t(item.i18nKey)}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
