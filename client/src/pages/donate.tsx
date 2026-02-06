import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Heart, ArrowLeft, CreditCard, Check } from "lucide-react";
import { Link } from "wouter";

const presetAmounts = [5, 10, 25, 50];

export default function Donate() {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(10);
  const [message, setMessage] = useState("");
  const [donated, setDonated] = useState(false);

  const donateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/donations", { amount, message: message || null });
      return res.json();
    },
    onSuccess: () => {
      setDonated(true);
      toast({ title: "Obrigado pela doa\u00e7\u00e3o!" });
    },
    onError: () => {
      toast({ title: "Erro ao processar doa\u00e7\u00e3o", variant: "destructive" });
    },
  });

  if (donated) {
    return (
      <div className="p-4 pb-20 max-w-lg mx-auto flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center w-full">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-2" data-testid="text-thank-you">Muito Obrigado!</h2>
          <p className="text-muted-foreground mb-1">
            Sua doa\u00e7\u00e3o de <span className="font-semibold text-foreground">\u20ac{amount}</span> foi registrada.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Voc\u00ea est\u00e1 ajudando a manter o Caminho Companion gratuito para todos os peregrinos.
          </p>
          <Link href="/">
            <Button data-testid="button-back-home">Voltar ao In\u00edcio</Button>
          </Link>
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
        <h1 className="font-serif text-xl font-bold" data-testid="text-donate-title">Apoiar o Projeto</h1>
      </div>

      <Card className="p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-7 h-7 text-destructive" />
        </div>
        <h2 className="font-serif text-lg font-bold mb-2">Fa\u00e7a uma Doa\u00e7\u00e3o</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          O Caminho Companion \u00e9 gratuito e mantido por volunt\u00e1rios. 
          Sua contribui\u00e7\u00e3o nos ajuda a manter o projeto funcionando.
        </p>

        <div className="flex gap-2 justify-center mb-4 flex-wrap">
          {presetAmounts.map((preset) => (
            <Button
              key={preset}
              variant={amount === preset ? "default" : "outline"}
              onClick={() => setAmount(preset)}
              data-testid={`amount-${preset}`}
            >
              \u20ac{preset}
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
          <span className="text-xs text-muted-foreground">Valor em euros</span>
        </div>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Deixe uma mensagem (opcional)..."
          className="mb-4 text-sm"
          data-testid="input-donate-message"
        />

        <Button
          className="w-full"
          size="lg"
          disabled={!amount || amount <= 0 || donateMutation.isPending}
          onClick={() => donateMutation.mutate()}
          data-testid="button-donate"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          {donateMutation.isPending ? "Processando..." : `Doar \u20ac${amount}`}
        </Button>

        <p className="text-[10px] text-muted-foreground mt-3">
          Simula\u00e7\u00e3o de pagamento. Nenhuma cobran\u00e7a real ser\u00e1 feita.
        </p>
      </Card>
    </div>
  );
}
