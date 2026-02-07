import { useState } from "react";
import { useT } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Copy, Shield, Flag, Ban } from "lucide-react";

export default function Admin() {
  const { t } = useT();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <Button size="icon" variant="ghost" onClick={() => setLocation("/")} data-testid="button-admin-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="font-serif font-bold text-base">{t("admin_title")}</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-4">
        <Tabs defaultValue="invites">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="invites" className="flex-1" data-testid="tab-admin-invites">
              {t("admin_invites")}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1" data-testid="tab-admin-reports">
              {t("admin_reports")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="invites">
            <InvitesTab />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function InvitesTab() {
  const { t } = useT();
  const { toast } = useToast();
  const [maxUses, setMaxUses] = useState("10");
  const [expiresIn, setExpiresIn] = useState("");

  const { data: invites = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/invites"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: any = { maxUses: parseInt(maxUses) || 10 };
      if (expiresIn) {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(expiresIn));
        body.expiresAt = d.toISOString();
      }
      return apiRequest("POST", "/api/invites/create", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/invites/${id}/disable`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: t("share_copied") });
  };

  const getInviteStatus = (inv: any) => {
    if (inv.isDisabled) return { label: t("admin_invite_disabled"), variant: "secondary" as const };
    if (inv.expiresAt && new Date() > new Date(inv.expiresAt)) return { label: t("admin_invite_expired"), variant: "outline" as const };
    if (inv.maxUses && (inv.usedCount || 0) >= inv.maxUses) return { label: t("spots_full"), variant: "outline" as const };
    return { label: t("admin_invite_active"), variant: "default" as const };
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("admin_create_invite")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-3 flex-wrap justify-start">
            <div className="space-y-1.5 flex-1 min-w-[120px]">
              <Label className="text-xs">{t("admin_max_uses")}</Label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                data-testid="input-invite-max-uses"
              />
            </div>
            <div className="space-y-1.5 flex-1 min-w-[120px]">
              <Label className="text-xs">{t("admin_expires")} (dias)</Label>
              <Input
                type="number"
                min="1"
                max="365"
                placeholder="--"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                data-testid="input-invite-expires"
              />
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              data-testid="button-create-invite"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("admin_create_invite")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground text-center py-8">{t("loading")}</p>}

      {!isLoading && invites.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-invites">
          {t("admin_no_invites")}
        </p>
      )}

      <div className="space-y-2">
        {invites.map((inv: any) => {
          const status = getInviteStatus(inv);
          return (
            <Card key={inv.id} data-testid={`card-invite-${inv.id}`}>
              <CardContent className="flex items-center gap-3 py-3 flex-wrap justify-start">
                <code className="font-mono text-sm font-bold tracking-wider flex-shrink-0">{inv.code}</code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyCode(inv.code)}
                  data-testid={`button-copy-invite-${inv.id}`}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Badge variant={status.variant}>{status.label}</Badge>
                <span className="text-xs text-muted-foreground">
                  {t("admin_invite_uses")}: {inv.usedCount || 0}/{inv.maxUses || "∞"}
                </span>
                <div className="flex-1" />
                {!inv.isDisabled && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => disableMutation.mutate(inv.id)}
                    disabled={disableMutation.isPending}
                    data-testid={`button-disable-invite-${inv.id}`}
                  >
                    {t("admin_disable")}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ReportsTab() {
  const { t } = useT();
  const { toast } = useToast();
  const [suspendDialog, setSuspendDialog] = useState<{ userId: string; open: boolean }>({ userId: "", open: false });
  const [suspendReason, setSuspendReason] = useState("");

  const { data: reports = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/reports"],
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) => {
      return apiRequest("PATCH", `/api/admin/reports/${id}`, { status, adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return apiRequest("POST", "/api/admin/suspend", { userId, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      setSuspendDialog({ userId: "", open: false });
      setSuspendReason("");
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", "/api/admin/unsuspend", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge variant="destructive">{t("admin_report_open")}</Badge>;
      case "reviewing": return <Badge variant="secondary">{t("admin_report_reviewing")}</Badge>;
      case "closed": return <Badge variant="outline">{t("admin_report_closed")}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground text-center py-8">{t("loading")}</p>;

  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-reports">{t("admin_no_reports")}</p>;
  }

  return (
    <div className="space-y-2">
      {reports.map((report: any) => (
        <Card key={report.id} data-testid={`card-report-${report.id}`}>
          <CardContent className="py-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap justify-start">
              <Flag className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t("admin_report_from")}:</span>
              <span className="text-xs font-medium">{report.reporterId?.slice(0, 8)}...</span>
              <span className="text-xs text-muted-foreground">{t("admin_report_about")}:</span>
              <span className="text-xs font-medium">{report.reportedId?.slice(0, 8)}...</span>
              {getStatusBadge(report.status)}
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">{t("admin_report_reason")}: </span>
              {t(`report_reason_${report.reason}`)}
            </p>
            {report.details && (
              <p className="text-xs text-muted-foreground border-l-2 border-border pl-2">{report.details}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap justify-start pt-1">
              <Select
                value={report.status}
                onValueChange={(v) => updateReportMutation.mutate({ id: report.id, status: v })}
              >
                <SelectTrigger className="w-[140px]" data-testid={`select-report-status-${report.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{t("admin_report_open")}</SelectItem>
                  <SelectItem value="reviewing">{t("admin_report_reviewing")}</SelectItem>
                  <SelectItem value="closed">{t("admin_report_closed")}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setSuspendDialog({ userId: report.reportedId, open: true })}
                data-testid={`button-suspend-from-report-${report.id}`}
              >
                <Ban className="w-3 h-3 mr-1" />
                {t("admin_suspend_user")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => unsuspendMutation.mutate(report.reportedId)}
                data-testid={`button-unsuspend-from-report-${report.id}`}
              >
                {t("admin_unsuspend_user")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={suspendDialog.open} onOpenChange={() => setSuspendDialog({ userId: "", open: false })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-4 h-4" />
              {t("admin_suspend_user")}
            </DialogTitle>
            <DialogDescription className="sr-only">{t("admin_suspend_user")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>{t("admin_suspend_reason")}</Label>
            <Textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder={t("admin_suspend_reason")}
              data-testid="input-suspend-reason"
            />
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => suspendMutation.mutate({ userId: suspendDialog.userId, reason: suspendReason })}
              disabled={!suspendReason.trim() || suspendMutation.isPending}
              data-testid="button-confirm-suspend"
            >
              {t("admin_suspend_user")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
