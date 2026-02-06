import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Heart, ArrowLeft, CreditCard, Check, Loader2, XCircle } from "lucide-react";
import { Link, useSearch } from "wouter";
import { useT } from "@/lib/i18n";

const presetAmounts = [5, 10, 25, 50];

export default function Donate() {
  const { toast } = useToast();
  const { t } = useT();
  const [amount, setAmount] = useState<number>(10);
  const [message, setMessage] = useState("");
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const status = params.get("status");
  const sessionId = params.get("session_id");

  const [paymentResult, setPaymentResult] = useState<{
    status: "success" | "cancelled" | null;
    amount?: number;
  }>({ status: null });

  useEffect(() => {
    if (status === "success" && sessionId) {
      fetch(`/api/donations/status/${sessionId}`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          setPaymentResult({ status: "success", amount: data.amount });
        })
        .catch(() => {
          setPaymentResult({ status: "success" });
        });
    } else if (status === "cancelled") {
      setPaymentResult({ status: "cancelled" });
    }
  }, [status, sessionId]);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/donations/checkout", {
        amount,
        message: message || null,
      });
      return res.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({ title: t("donate_checkout_error"), variant: "destructive" });
    },
  });

  if (paymentResult.status === "success") {
    return (
      <div className="p-4 pb-20 max-w-lg mx-auto flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center w-full">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-2" data-testid="text-thank-you">{t("donate_thank_you")}</h2>
          <p className="text-muted-foreground mb-1">
            {t("donate_success_msg", { amount: paymentResult.amount ? ` de R$${paymentResult.amount}` : "" })}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {t("donate_success_desc")}
          </p>
          <Link href="/">
            <Button data-testid="button-back-home">{t("donate_back_home")}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (paymentResult.status === "cancelled") {
    return (
      <div className="p-4 pb-20 max-w-lg mx-auto flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center w-full">
          <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-2" data-testid="text-cancelled">{t("donate_cancelled")}</h2>
          <p className="text-muted-foreground mb-6">
            {t("donate_cancelled_msg")}
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button variant="outline" onClick={() => setPaymentResult({ status: null })} data-testid="button-try-again">
              {t("donate_try_again")}
            </Button>
            <Link href="/">
              <Button data-testid="button-back-home-cancel">{t("donate_back_home")}</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back-donate">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-serif text-xl font-bold" data-testid="text-donate-title">{t("donate_title")}</h1>
      </div>

      <Card className="p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-7 h-7 text-destructive" />
        </div>
        <h2 className="font-serif text-lg font-bold mb-2">{t("donate_heading")}</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          {t("donate_description")}
        </p>

        <div className="flex gap-2 justify-center mb-4 flex-wrap">
          {presetAmounts.map((preset) => (
            <Button
              key={preset}
              variant={amount === preset ? "default" : "outline"}
              onClick={() => setAmount(preset)}
              data-testid={`amount-${preset}`}
            >
              R${preset}
            </Button>
          ))}
        </div>

        <div className="max-w-[200px] mx-auto mb-4">
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="text-center text-lg font-semibold"
            data-testid="input-custom-amount"
          />
          <span className="text-xs text-muted-foreground">{t("donate_amount_label")}</span>
        </div>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("donate_message_placeholder")}
          className="mb-4 text-sm"
          data-testid="input-donate-message"
        />

        <Button
          className="w-full"
          size="lg"
          disabled={!amount || amount <= 0 || checkoutMutation.isPending}
          onClick={() => checkoutMutation.mutate()}
          data-testid="button-donate"
        >
          {checkoutMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("donate_redirecting")}
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              {t("donate_button", { amount })}
            </>
          )}
        </Button>

        <p className="text-[10px] text-muted-foreground mt-3">
          {t("donate_secure_note")}
        </p>
      </Card>
    </div>
  );
}
