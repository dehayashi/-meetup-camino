import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

const TERMS_CONTENT: Record<string, string> = {
  "pt-BR": `
# Termos de Uso — Meet Up

**Última atualização: 07 de fevereiro de 2026**

Bem-vindo ao Meet Up! Ao utilizar nosso aplicativo, você concorda com os seguintes termos.

## 1. Aceitação dos Termos

Ao acessar ou utilizar o Meet Up, você declara ter lido, compreendido e concordado com estes Termos de Uso e com nossa Política de Privacidade. Se não concordar, não utilize o aplicativo.

## 2. Descrição do Serviço

O Meet Up é uma plataforma gratuita que conecta peregrinos do Caminho de Santiago para compartilhar atividades como transporte, refeições, caminhadas e hospedagem.

## 3. Cadastro e Acesso

- O acesso ao Meet Up é feito exclusivamente por convite.
- Você é responsável pela veracidade das informações fornecidas em seu perfil.
- Cada conta é pessoal e intransferível.
- Não compartilhe seu código de convite de forma pública.

## 4. Regras de Conduta

Ao utilizar o Meet Up, você se compromete a:
- Tratar todos os usuários com respeito e cordialidade.
- Não publicar conteúdo ofensivo, discriminatório, ameaçador ou ilegal.
- Não utilizar a plataforma para fins comerciais, propaganda ou spam.
- Não tentar acessar contas de outros usuários.
- Não publicar informações falsas ou enganosas.
- Respeitar a privacidade dos demais usuários.

## 5. Conteúdo do Usuário

- Você é responsável por todo conteúdo que publicar (mensagens, avaliações, fotos de perfil).
- O Meet Up reserva-se o direito de remover conteúdo que viole estes termos.
- Ao publicar conteúdo, você concede ao Meet Up uma licença para exibi-lo na plataforma.

## 6. Denúncias e Moderação

- Qualquer usuário pode denunciar outro por comportamento inadequado.
- Denúncias serão analisadas pela equipe de moderação.
- O Meet Up pode suspender ou banir contas que violem as regras de conduta.
- Decisões de moderação são tomadas a critério exclusivo da equipe do Meet Up.

## 7. Bloqueio de Usuários

- Você pode bloquear outros usuários a qualquer momento.
- Ao bloquear alguém, suas atividades e mensagens ficarão ocultas para você.
- Bloquear outro usuário não gera notificação para o bloqueado.

## 8. Doações

- Doações são voluntárias e não reembolsáveis.
- Doações não concedem benefícios especiais dentro do aplicativo.
- Pagamentos são processados pelo Stripe e sujeitos aos termos do Stripe.

## 9. Isenção de Responsabilidade

- O Meet Up não se responsabiliza por encontros, transações ou atividades realizadas entre usuários fora da plataforma.
- Recomendamos sempre encontrar-se em locais públicos e tomar precauções de segurança.
- O Meet Up não garante a identidade ou intenções de outros usuários.

## 10. Propriedade Intelectual

Todo o conteúdo do aplicativo (design, código, textos, logotipos) é propriedade do Meet Up e protegido por leis de propriedade intelectual.

## 11. Alterações nos Termos

Podemos atualizar estes termos a qualquer momento. Alterações significativas serão notificadas dentro do aplicativo. O uso contínuo após alterações constitui aceitação dos novos termos.

## 12. Encerramento de Conta

- Você pode solicitar o encerramento de sua conta a qualquer momento.
- O Meet Up pode encerrar contas que violem estes termos.
- Dados podem ser retidos conforme exigido por lei.

## 13. Legislação Aplicável

Estes termos são regidos pelas leis da República Federativa do Brasil.

## 14. Contato

Para dúvidas sobre estes termos, entre em contato através do próprio aplicativo.
`,
  en: `
# Terms of Use — Meet Up

**Last updated: February 7, 2026**

Welcome to Meet Up! By using our application, you agree to the following terms.

## 1. Acceptance of Terms

By accessing or using Meet Up, you confirm that you have read, understood, and agree to these Terms of Use and our Privacy Policy. If you do not agree, do not use the application.

## 2. Description of Service

Meet Up is a free platform that connects pilgrims on the Camino de Santiago to share activities such as transport, meals, hikes, and lodging.

## 3. Registration and Access

- Access to Meet Up is by invitation only.
- You are responsible for the accuracy of the information in your profile.
- Each account is personal and non-transferable.
- Do not share your invite code publicly.

## 4. Code of Conduct

By using Meet Up, you agree to:
- Treat all users with respect and courtesy.
- Not post offensive, discriminatory, threatening, or illegal content.
- Not use the platform for commercial purposes, advertising, or spam.
- Not attempt to access other users' accounts.
- Not publish false or misleading information.
- Respect other users' privacy.

## 5. User Content

- You are responsible for all content you post (messages, reviews, profile photos).
- Meet Up reserves the right to remove content that violates these terms.
- By posting content, you grant Meet Up a license to display it on the platform.

## 6. Reports and Moderation

- Any user may report another for inappropriate behavior.
- Reports will be reviewed by the moderation team.
- Meet Up may suspend or ban accounts that violate the code of conduct.
- Moderation decisions are at the sole discretion of the Meet Up team.

## 7. Blocking Users

- You may block other users at any time.
- When you block someone, their activities and messages will be hidden from you.
- Blocking another user does not notify the blocked user.

## 8. Donations

- Donations are voluntary and non-refundable.
- Donations do not grant special benefits within the application.
- Payments are processed by Stripe and subject to Stripe's terms.

## 9. Disclaimer of Liability

- Meet Up is not responsible for meetings, transactions, or activities between users outside the platform.
- We recommend always meeting in public places and taking safety precautions.
- Meet Up does not guarantee the identity or intentions of other users.

## 10. Intellectual Property

All application content (design, code, text, logos) is the property of Meet Up and protected by intellectual property laws.

## 11. Changes to Terms

We may update these terms at any time. Significant changes will be notified within the application. Continued use after changes constitutes acceptance of the new terms.

## 12. Account Termination

- You may request account termination at any time.
- Meet Up may terminate accounts that violate these terms.
- Data may be retained as required by law.

## 13. Governing Law

These terms are governed by the laws of the Federative Republic of Brazil.

## 14. Contact

For questions about these terms, contact us through the application.
`,
  es: `
# Términos de Uso — Meet Up

**Última actualización: 7 de febrero de 2026**

Bienvenido a Meet Up. Al utilizar nuestra aplicación, aceptas los siguientes términos.

## 1. Aceptación de los Términos

Al acceder o utilizar Meet Up, declaras haber leído, comprendido y aceptado estos Términos de Uso y nuestra Política de Privacidad. Si no estás de acuerdo, no utilices la aplicación.

## 2. Descripción del Servicio

Meet Up es una plataforma gratuita que conecta peregrinos del Camino de Santiago para compartir actividades como transporte, comidas, excursiones y alojamiento.

## 3. Registro y Acceso

- El acceso a Meet Up es exclusivamente por invitación.
- Eres responsable de la veracidad de la información de tu perfil.
- Cada cuenta es personal e intransferible.
- No compartas tu código de invitación públicamente.

## 4. Reglas de Conducta

Al utilizar Meet Up, te comprometes a:
- Tratar a todos los usuarios con respeto y cordialidad.
- No publicar contenido ofensivo, discriminatorio, amenazante o ilegal.
- No utilizar la plataforma con fines comerciales, publicidad o spam.
- No intentar acceder a cuentas de otros usuarios.
- No publicar información falsa o engañosa.
- Respetar la privacidad de los demás usuarios.

## 5. Contenido del Usuario

- Eres responsable de todo el contenido que publiques (mensajes, valoraciones, fotos de perfil).
- Meet Up se reserva el derecho de eliminar contenido que viole estos términos.
- Al publicar contenido, concedes a Meet Up una licencia para mostrarlo en la plataforma.

## 6. Denuncias y Moderación

- Cualquier usuario puede denunciar a otro por comportamiento inapropiado.
- Las denuncias serán revisadas por el equipo de moderación.
- Meet Up puede suspender o prohibir cuentas que violen las reglas de conducta.
- Las decisiones de moderación son a criterio exclusivo del equipo de Meet Up.

## 7. Bloqueo de Usuarios

- Puedes bloquear a otros usuarios en cualquier momento.
- Al bloquear a alguien, sus actividades y mensajes quedarán ocultos para ti.
- Bloquear a otro usuario no genera notificación para el bloqueado.

## 8. Donaciones

- Las donaciones son voluntarias y no reembolsables.
- Las donaciones no otorgan beneficios especiales dentro de la aplicación.
- Los pagos son procesados por Stripe y están sujetos a los términos de Stripe.

## 9. Exención de Responsabilidad

- Meet Up no se responsabiliza de encuentros, transacciones o actividades realizadas entre usuarios fuera de la plataforma.
- Recomendamos siempre encontrarse en lugares públicos y tomar precauciones de seguridad.
- Meet Up no garantiza la identidad ni las intenciones de otros usuarios.

## 10. Propiedad Intelectual

Todo el contenido de la aplicación (diseño, código, textos, logotipos) es propiedad de Meet Up y está protegido por leyes de propiedad intelectual.

## 11. Cambios en los Términos

Podemos actualizar estos términos en cualquier momento. Los cambios significativos serán notificados dentro de la aplicación. El uso continuado después de los cambios constituye aceptación de los nuevos términos.

## 12. Terminación de Cuenta

- Puedes solicitar la terminación de tu cuenta en cualquier momento.
- Meet Up puede cerrar cuentas que violen estos términos.
- Los datos pueden ser retenidos según lo exija la ley.

## 13. Legislación Aplicable

Estos términos se rigen por las leyes de la República Federativa de Brasil.

## 14. Contacto

Para preguntas sobre estos términos, contáctanos a través de la aplicación.
`,
  fr: `
# Conditions d'Utilisation — Meet Up

**Dernière mise à jour : 7 février 2026**

Bienvenue sur Meet Up ! En utilisant notre application, vous acceptez les conditions suivantes.

## 1. Acceptation des Conditions

En accédant ou en utilisant Meet Up, vous confirmez avoir lu, compris et accepté ces Conditions d'Utilisation et notre Politique de Confidentialité. Si vous n'êtes pas d'accord, n'utilisez pas l'application.

## 2. Description du Service

Meet Up est une plateforme gratuite qui met en relation des pèlerins du Chemin de Saint-Jacques pour partager des activités telles que le transport, les repas, les randonnées et l'hébergement.

## 3. Inscription et Accès

- L'accès à Meet Up se fait exclusivement sur invitation.
- Vous êtes responsable de l'exactitude des informations de votre profil.
- Chaque compte est personnel et non transférable.
- Ne partagez pas votre code d'invitation publiquement.

## 4. Règles de Conduite

En utilisant Meet Up, vous vous engagez à :
- Traiter tous les utilisateurs avec respect et courtoisie.
- Ne pas publier de contenu offensant, discriminatoire, menaçant ou illégal.
- Ne pas utiliser la plateforme à des fins commerciales, publicitaires ou de spam.
- Ne pas tenter d'accéder aux comptes d'autres utilisateurs.
- Ne pas publier d'informations fausses ou trompeuses.
- Respecter la vie privée des autres utilisateurs.

## 5. Contenu Utilisateur

- Vous êtes responsable de tout contenu que vous publiez (messages, avis, photos de profil).
- Meet Up se réserve le droit de supprimer tout contenu violant ces conditions.
- En publiant du contenu, vous accordez à Meet Up une licence pour l'afficher sur la plateforme.

## 6. Signalements et Modération

- Tout utilisateur peut signaler un autre pour comportement inapproprié.
- Les signalements seront examinés par l'équipe de modération.
- Meet Up peut suspendre ou bannir les comptes qui violent les règles de conduite.
- Les décisions de modération sont prises à la seule discrétion de l'équipe Meet Up.

## 7. Blocage d'Utilisateurs

- Vous pouvez bloquer d'autres utilisateurs à tout moment.
- Lorsque vous bloquez quelqu'un, ses activités et messages seront masqués pour vous.
- Le blocage d'un utilisateur ne génère pas de notification pour la personne bloquée.

## 8. Dons

- Les dons sont volontaires et non remboursables.
- Les dons ne confèrent pas d'avantages spéciaux dans l'application.
- Les paiements sont traités par Stripe et soumis aux conditions de Stripe.

## 9. Limitation de Responsabilité

- Meet Up n'est pas responsable des rencontres, transactions ou activités entre utilisateurs en dehors de la plateforme.
- Nous recommandons de toujours se rencontrer dans des lieux publics et de prendre des précautions de sécurité.
- Meet Up ne garantit pas l'identité ou les intentions des autres utilisateurs.

## 10. Propriété Intellectuelle

Tout le contenu de l'application (design, code, textes, logos) est la propriété de Meet Up et protégé par les lois sur la propriété intellectuelle.

## 11. Modifications des Conditions

Nous pouvons mettre à jour ces conditions à tout moment. Les modifications importantes seront notifiées dans l'application. L'utilisation continue après les modifications constitue l'acceptation des nouvelles conditions.

## 12. Résiliation de Compte

- Vous pouvez demander la résiliation de votre compte à tout moment.
- Meet Up peut résilier les comptes qui violent ces conditions.
- Les données peuvent être conservées conformément à la loi.

## 13. Droit Applicable

Ces conditions sont régies par les lois de la République Fédérative du Brésil.

## 14. Contact

Pour toute question concernant ces conditions, contactez-nous via l'application.
`,
};

function renderMarkdown(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h1 class="text-2xl font-bold mb-4 mt-6">${line.slice(2)}</h1>`;
      if (line.startsWith("## ")) return `<h2 class="text-lg font-semibold mb-2 mt-5">${line.slice(3)}</h2>`;
      if (line.startsWith("**") && line.endsWith("**")) return `<p class="text-sm text-muted-foreground mb-4">${line.slice(2, -2)}</p>`;
      if (line.startsWith("- ")) return `<li class="ml-4 text-sm mb-1">${line.slice(2)}</li>`;
      if (line.trim() === "") return "<br/>";
      return `<p class="text-sm mb-2">${line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</p>`;
    })
    .join("");
}

export default function Terms() {
  const { t, locale } = useT();
  const [, setLocation] = useLocation();

  const content = TERMS_CONTENT[locale] || TERMS_CONTENT["en"];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <Button size="icon" variant="ghost" onClick={() => setLocation("/")} data-testid="button-terms-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif font-bold text-base">{t("terms_title")}</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
      </main>
    </div>
  );
}
