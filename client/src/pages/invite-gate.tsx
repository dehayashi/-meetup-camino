import { useState } from "react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LanguageSelector } from "@/components/language-selector";
import { Link } from "wouter";
import { Shield, KeyRound } from "lucide-react";

interface InviteGateProps {
  isAdmin?: boolean;
  onSuccess: () => void;
}

export default function InviteGate({ isAdmin, onSuccess }: InviteGateProps) {
  const { t } = useT();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [validated, setValidated] = useState(isAdmin || false);
  const [validating, setValidating] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [entering, setEntering] = useState(false);

  const handleValidate = async () => {
    if (!code.trim()) return;
    setValidating(true);
    try {
      const res = await apiRequest("POST", "/api/invites/validate", { code: code.trim() });
      const data = await res.json();
      if (data.valid) {
        setValidated(true);
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("invalid_code")) toast({ title: t("invite_invalid"), variant: "destructive" });
      else if (msg.includes("invite_expired")) toast({ title: t("invite_expired"), variant: "destructive" });
      else if (msg.includes("invite_used")) toast({ title: t("invite_used"), variant: "destructive" });
      else if (msg.includes("invite_disabled")) toast({ title: t("invite_disabled"), variant: "destructive" });
      else toast({ title: t("invite_invalid"), variant: "destructive" });
    } finally {
      setValidating(false);
    }
  };

  const handleEnter = async () => {
    if (!accepted) return;
    setEntering(true);
    try {
      await apiRequest("POST", "/api/invites/redeem", {
        inviteCode: isAdmin ? "ADMIN" : code.trim(),
        termsVersion: "1.0",
        privacyVersion: "1.0",
      });
      onSuccess();
    } catch (err: any) {
      toast({ title: t("invite_invalid"), variant: "destructive" });
    } finally {
      setEntering(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Meet Up" className="w-8 h-8 rounded-md" />
            <span className="font-serif font-bold text-base text-foreground">{t("app_name")}</span>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <CardTitle data-testid="text-invite-title">{t("invite_title")}</CardTitle>
            <CardDescription>{t("invite_subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-primary/5 border border-primary/20">
                <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-sm text-muted-foreground" data-testid="text-admin-skip">{t("invite_admin_skip")}</p>
              </div>
            )}

            {!isAdmin && !validated && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-code">{t("invite_code_label")}</Label>
                  <Input
                    id="invite-code"
                    data-testid="input-invite-code"
                    placeholder={t("invite_code_placeholder")}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={50}
                    className="uppercase tracking-widest text-center font-mono"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleValidate}
                  disabled={!code.trim() || validating}
                  data-testid="button-validate-invite"
                >
                  {validating ? t("invite_validating") : t("invite_validate")}
                </Button>
              </div>
            )}

            {validated && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-md border">
                  <Checkbox
                    id="accept-terms"
                    data-testid="checkbox-accept-terms"
                    checked={accepted}
                    onCheckedChange={(v) => setAccepted(v === true)}
                  />
                  <Label htmlFor="accept-terms" className="text-sm leading-relaxed cursor-pointer">
                    {t("invite_accept_terms")}
                    <span className="block mt-1 text-xs text-muted-foreground">
                      <Link href="/terms" className="underline" data-testid="link-terms">{t("terms_link")}</Link>
                      {" · "}
                      <Link href="/privacy" className="underline" data-testid="link-privacy">{t("privacy_link")}</Link>
                    </span>
                  </Label>
                </div>
                <Button
                  className="w-full"
                  onClick={handleEnter}
                  disabled={!accepted || entering}
                  data-testid="button-enter-app"
                >
                  {entering ? t("invite_entering") : t("invite_enter")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
