import { useT } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

interface SuspendedProps {
  reason?: string;
}

export default function Suspended({ reason }: SuspendedProps) {
  const { t } = useT();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle data-testid="text-suspended-title">{t("suspended_title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground" data-testid="text-suspended-message">
            {t("suspended_message")}
          </p>
          {reason && (
            <p className="text-sm font-medium" data-testid="text-suspended-reason">
              {t("suspended_reason").replace("{reason}", reason)}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{t("suspended_contact")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
