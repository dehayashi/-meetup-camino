import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { I18nProvider, useT } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Shield } from "lucide-react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Activities from "@/pages/activities";
import CreateActivity from "@/pages/create-activity";
import ActivityDetail from "@/pages/activity-detail";
import MapPage from "@/pages/map-page";
import Profile from "@/pages/profile";
import Donate from "@/pages/donate";
import PrivacyPolicy from "@/pages/privacy-policy";
import Ranking from "@/pages/ranking";
import Terms from "@/pages/terms";
import InviteGate from "@/pages/invite-gate";
import Suspended from "@/pages/suspended";
import Admin from "@/pages/admin";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
      {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </Button>
  );
}

function AuthenticatedApp({ isAdmin }: { isAdmin?: boolean }) {
  const { t } = useT();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2 px-4 h-14">
          <Link href="/" className="flex items-center gap-2 no-underline" data-testid="link-home-logo">
            <img src="/logo.png" alt="Meet Up" className="w-8 h-8 rounded-md" />
            <span className="font-serif font-bold text-base text-foreground" data-testid="text-app-name">{t("app_name")}</span>
          </Link>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="icon" data-testid="button-admin-link">
                  <Shield className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/activities" component={Activities} />
          <Route path="/create" component={CreateActivity} />
          <Route path="/activity/:id" component={ActivityDetail} />
          <Route path="/map" component={MapPage} />
          <Route path="/profile" component={Profile} />
          <Route path="/donate" component={Donate} />
          <Route path="/ranking" component={Ranking} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={Terms} />
          {isAdmin && <Route path="/admin" component={Admin} />}
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNav />
    </div>
  );
}

function AccessGate() {
  const { t } = useT();

  const { data: accessStatus, isLoading, refetch } = useQuery<{
    status: string;
    isAdmin?: boolean;
    reason?: string;
    profile?: any;
  }>({
    queryKey: ["/api/access/status"],
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="Meet Up" className="w-10 h-10 rounded-md animate-pulse" />
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!accessStatus) {
    return (
      <Switch>
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={Terms} />
        <Route component={Landing} />
      </Switch>
    );
  }

  if (accessStatus.status === "suspended") {
    return <Suspended reason={accessStatus.reason} />;
  }

  if (accessStatus.status === "needs_invite" || accessStatus.status === "needs_terms") {
    return (
      <Switch>
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={Terms} />
        <Route>
          <InviteGate
            isAdmin={accessStatus.isAdmin}
            onSuccess={() => refetch()}
          />
        </Route>
      </Switch>
    );
  }

  if (accessStatus.status === "needs_profile") {
    return (
      <Switch>
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={Terms} />
        <Route>
          <InviteGate
            isAdmin={accessStatus.isAdmin}
            onSuccess={() => refetch()}
          />
        </Route>
      </Switch>
    );
  }

  return <AuthenticatedApp isAdmin={accessStatus.isAdmin} />;
}

function Router() {
  const { user, isLoading } = useAuth();
  const { t } = useT();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="Meet Up" className="w-10 h-10 rounded-md animate-pulse" />
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={Terms} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return <AccessGate />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
