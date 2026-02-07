import { useState } from "react";
import { useT } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Flag, Ban } from "lucide-react";

const REPORT_REASONS = [
  "harassment",
  "offensive_language",
  "threat_violence",
  "scam_suspicious",
  "illegal_items",
  "sexual_content",
  "other",
] as const;

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  reportedId: string;
  activityId?: number;
  messageId?: number;
}

export function ReportModal({ open, onClose, reportedId, activityId, messageId }: ReportModalProps) {
  const { t } = useT();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/reports", {
        reportedId,
        reason,
        details: details.trim() || undefined,
        activityId,
        messageId,
      });
      toast({ title: t("report_success") });
      onClose();
      setReason("");
      setDetails("");
    } catch {
      toast({ title: t("report_error"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-4 h-4" />
            {t("report_title")}
          </DialogTitle>
          <DialogDescription className="sr-only">{t("report_title")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("report_reason")}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger data-testid="select-report-reason">
                <SelectValue placeholder={t("report_reason")} />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r} value={r} data-testid={`option-report-${r}`}>
                    {t(`report_reason_${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("report_details")}</Label>
            <Textarea
              data-testid="input-report-details"
              placeholder={t("report_details_placeholder")}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!reason || submitting}
            data-testid="button-submit-report"
          >
            {submitting ? t("report_submitting") : t("report_submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface BlockConfirmProps {
  open: boolean;
  onClose: () => void;
  blockedId: string;
  onBlocked?: () => void;
}

export function BlockConfirmDialog({ open, onClose, blockedId, onBlocked }: BlockConfirmProps) {
  const { t } = useT();
  const { toast } = useToast();

  const handleBlock = async () => {
    try {
      await apiRequest("POST", "/api/blocks", { blockedId });
      toast({ title: t("block_success") });
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      onBlocked?.();
      onClose();
    } catch {
      toast({ title: t("block_error"), variant: "destructive" });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={() => onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Ban className="w-4 h-4" />
            {t("block_confirm_title")}
          </AlertDialogTitle>
          <AlertDialogDescription>{t("block_confirm_desc")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-block">{t("block_cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleBlock} data-testid="button-confirm-block">
            {t("block_confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface UserActionsProps {
  userId: string;
  className?: string;
  activityId?: number;
}

export function UserActions({ userId, className, activityId }: UserActionsProps) {
  const { t } = useT();
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  return (
    <div className={`flex items-center gap-1 ${className || ""}`}>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setReportOpen(true)}
        data-testid={`button-report-user-${userId}`}
        className="text-xs text-muted-foreground"
      >
        <Flag className="w-3 h-3 mr-1" />
        {t("report_user")}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setBlockOpen(true)}
        data-testid={`button-block-user-${userId}`}
        className="text-xs text-muted-foreground"
      >
        <Ban className="w-3 h-3 mr-1" />
        {t("block_user")}
      </Button>
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedId={userId}
        activityId={activityId}
      />
      <BlockConfirmDialog
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        blockedId={userId}
      />
    </div>
  );
}
