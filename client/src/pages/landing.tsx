import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Users, MessageCircle, Heart, ArrowRight, Shield, Share2, Copy, Check } from "lucide-react";
import { SiWhatsapp, SiFacebook, SiX } from "react-icons/si";
import { useT } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { useMemo, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
const heroImage = "/images/hero-camino.png";

export default function Landing() {
  const { t } = useT();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const appUrl = window.location.origin;
  const shareText = `${t("landing_hero_title")} - ${t("landing_hero_subtitle")}`;

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopied(true);
      toast({ title: t("share_copied") });
      setTimeout(() => setCopied(false), 2000);
    });
  }, [appUrl, t, toast]);

  const shareWhatsApp = useCallback(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + appUrl)}`, "_blank");
  }, [shareText, appUrl]);

  const shareFacebook = useCallback(() => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`, "_blank");
  }, [appUrl]);

  const shareTwitter = useCallback(() => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`, "_blank");
  }, [shareText, appUrl]);

  const features = useMemo(() => [
    {
      icon: Users,
      title: t("landing_feature_companions_title"),
      description: t("landing_feature_companions_desc"),
    },
    {
      icon: MapPin,
      title: t("landing_feature_map_title"),
      description: t("landing_feature_map_desc"),
    },
    {
      icon: MessageCircle,
      title: t("landing_feature_chat_title"),
      description: t("landing_feature_chat_desc"),
    },
  ], [t]);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <a href="/" className="flex items-center gap-2 no-underline" data-testid="link-home-logo">
            <img src="/logo.png" alt="Meet Up" className="w-8 h-8 rounded-md" />
            <span className="font-serif font-bold text-lg text-foreground" data-testid="text-logo">{t("app_name")}</span>
          </a>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <a href="/api/login">
              <Button data-testid="button-login-header">{t("landing_login")}</Button>
            </a>
          </div>
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
                {t("landing_hero_title")}
              </h1>
              <p className="text-white/80 text-base md:text-lg mb-6 leading-relaxed">
                {t("landing_hero_subtitle")}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <a href="/api/login">
                  <Button size="lg" data-testid="button-login-hero">
                    {t("landing_cta")}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </a>
                <div className="flex items-center gap-1.5 text-white/60 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>{t("landing_free")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6 px-4 max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Share2 className="w-4 h-4" />
            <span>{t("landing_share_cta")}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={shareWhatsApp}
              data-testid="button-share-whatsapp"
            >
              <SiWhatsapp className="w-4 h-4" />
              <span className="ml-1.5">{t("share_whatsapp")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={shareFacebook}
              data-testid="button-share-facebook"
            >
              <SiFacebook className="w-4 h-4" />
              <span className="ml-1.5">{t("share_facebook")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={shareTwitter}
              data-testid="button-share-twitter"
            >
              <SiX className="w-4 h-4" />
              <span className="ml-1.5">{t("share_twitter")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              data-testid="button-share-copy"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="ml-1.5">{copied ? t("share_copied") : t("share_copy")}</span>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-2" data-testid="text-features-title">
          {t("landing_features_title")}
        </h2>
        <p className="text-muted-foreground text-center mb-10 max-w-md mx-auto">
          {t("landing_features_subtitle")}
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
            <span className="font-serif text-xl font-bold">{t("landing_donate_title")}</span>
          </div>
          <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
            {t("landing_donate_desc")}
          </p>
          <a href="/api/login">
            <Button variant="outline" data-testid="button-donate-landing">
              {t("landing_donate_btn")}
            </Button>
          </a>
        </div>
      </section>

      <footer className="py-6 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 flex-wrap text-xs text-muted-foreground">
          <span>&copy; {t("landing_footer_copyright")}</span>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover-elevate px-1 py-0.5 rounded text-muted-foreground no-underline" data-testid="link-privacy-policy">{t("footer_privacy_policy")}</a>
            <span>{t("buen_camino")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
