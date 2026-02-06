import { useLocation, Link } from "wouter";
import { Home, Search, MapPin, Plus, User } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/activities", icon: Search, label: "Buscar" },
  { path: "/create", icon: Plus, label: "Criar" },
  { path: "/map", icon: MapPin, label: "Mapa" },
  { path: "/profile", icon: User, label: "Perfil" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border" data-testid="bottom-nav">
      <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <button
                data-testid={`nav-${item.label.toLowerCase()}`}
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
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
