import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useT();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">{t("not_found_title")}</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {t("not_found_desc")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
