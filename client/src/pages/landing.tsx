import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Users, MessageCircle, Heart, ArrowRight, Shield } from "lucide-react";
const heroImage = "/images/hero-camino.png";

const features = [
  {
    icon: Users,
    title: "Encontre Companheiros",
    description: "Conecte-se com peregrinos que est\u00e3o na mesma cidade e nas mesmas datas que voc\u00ea.",
  },
  {
    icon: MapPin,
    title: "Atividades no Mapa",
    description: "Visualize transportes, refei\u00e7\u00f5es e passeios pr\u00f3ximos de voc\u00ea no mapa interativo.",
  },
  {
    icon: MessageCircle,
    title: "Chat em Grupo",
    description: "Converse diretamente com os participantes de cada atividade em tempo real.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif font-bold text-lg" data-testid="text-logo">Caminho Companion</span>
          </div>
          <a href="/api/login">
            <Button data-testid="button-login-header">Entrar</Button>
          </a>
        </div>
      </header>

      <section className="relative pt-14 overflow-hidden">
        <div className="relative h-[70vh] min-h-[480px]">
          <img
            src={heroImage}
            alt="Caminho de Santiago"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 max-w-6xl mx-auto">
            <div className="max-w-xl">
              <h1 className="font-serif text-3xl md:text-5xl font-bold text-white leading-tight mb-4" data-testid="text-hero-title">
                Sua jornada no Caminho, com companhia
              </h1>
              <p className="text-white/80 text-base md:text-lg mb-6 leading-relaxed">
                Divida transportes, compartilhe refei\u00e7\u00f5es e encontre
                companheiros para cada etapa do Caminho de Santiago.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <a href="/api/login">
                  <Button size="lg" data-testid="button-login-hero">
                    Come\u00e7ar Agora
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </a>
                <div className="flex items-center gap-1.5 text-white/60 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Gratuito para sempre</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-2" data-testid="text-features-title">
          Tudo que voc\u00ea precisa no Caminho
        </h2>
        <p className="text-muted-foreground text-center mb-10 max-w-md mx-auto">
          Planeje, conecte e compartilhe experi\u00eancias com outros peregrinos.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Card key={i} className="p-6 hover-elevate overflow-visible">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-destructive" />
            <span className="font-serif text-xl font-bold">Apoie o Projeto</span>
          </div>
          <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
            O Caminho Companion \u00e9 mantido por volunt\u00e1rios. Sua doa\u00e7\u00e3o nos ajuda a continuar.
          </p>
          <a href="/api/login">
            <Button variant="outline" data-testid="button-donate-landing">
              Fa\u00e7a uma Doa\u00e7\u00e3o
            </Button>
          </a>
        </div>
      </section>

      <footer className="py-6 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 flex-wrap text-xs text-muted-foreground">
          <span>&copy; 2026 Caminho Companion</span>
          <span>Buen Camino!</span>
        </div>
      </footer>
    </div>
  );
}
