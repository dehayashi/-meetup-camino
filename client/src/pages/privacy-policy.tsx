import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  const { locale } = useT();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center gap-2 px-4 h-14">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back-privacy">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/" className="flex items-center gap-2 no-underline">
            <img src="/logo.png" alt="Meet Up" className="w-7 h-7 rounded-md" />
            <span className="font-serif font-bold text-base text-foreground">Meet Up</span>
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8 pb-20">
        {locale === "pt-BR" ? <PrivacyPT /> :
         locale === "es" ? <PrivacyES /> :
         locale === "fr" ? <PrivacyFR /> :
         <PrivacyEN />}
      </main>
    </div>
  );
}

function PrivacyPT() {
  return (
    <article className="prose prose-sm dark:prose-invert max-w-none" data-testid="privacy-content">
      <h1>Pol&iacute;tica de Privacidade</h1>
      <p className="text-muted-foreground text-sm">
        &Uacute;ltima atualiza&ccedil;&atilde;o: 06 de fevereiro de 2026
      </p>

      <p>O <strong>Meet Up</strong> (&ldquo;n&oacute;s&rdquo;, &ldquo;nosso&rdquo;, &ldquo;aplicativo&rdquo;) respeita sua privacidade e est&aacute; comprometido com a prote&ccedil;&atilde;o dos seus dados pessoais. Esta pol&iacute;tica descreve como coletamos, usamos, armazenamos e protegemos suas informa&ccedil;&otilde;es, em conformidade com a Lei Geral de Prote&ccedil;&atilde;o de Dados (LGPD &ndash; Lei n&ordm; 13.709/2018), o Regulamento Geral de Prote&ccedil;&atilde;o de Dados da Uni&atilde;o Europeia (GDPR), e as leis de privacidade dos Estados Unidos (CCPA/CPRA e demais legisla&ccedil;&otilde;es aplic&aacute;veis).</p>

      <h2>1. Dados que Coletamos</h2>
      <ul>
        <li><strong>Dados de conta:</strong> nome, e-mail e foto de perfil fornecidos pelo servi&ccedil;o de autentica&ccedil;&atilde;o (Replit Auth).</li>
        <li><strong>Dados de perfil:</strong> nacionalidade, idioma, bio, datas de viagem, cidades do Caminho e prefer&ecirc;ncias de atividades, fornecidos voluntariamente por voc&ecirc;.</li>
        <li><strong>Dados de atividades:</strong> atividades criadas, participa&ccedil;&otilde;es, mensagens de chat e avalia&ccedil;&otilde;es.</li>
        <li><strong>Dados de pagamento:</strong> processados pelo Stripe. N&atilde;o armazenamos dados de cart&atilde;o de cr&eacute;dito.</li>
        <li><strong>Dados de notifica&ccedil;&otilde;es:</strong> informa&ccedil;&otilde;es de assinatura push para envio de notifica&ccedil;&otilde;es, quando autorizadas por voc&ecirc;.</li>
        <li><strong>Dados t&eacute;cnicos:</strong> endere&ccedil;o IP, tipo de navegador, sistema operacional e dados de cookies de sess&atilde;o.</li>
      </ul>

      <h2>2. Finalidades do Tratamento</h2>
      <p>Seus dados s&atilde;o tratados para:</p>
      <ul>
        <li>Fornecer e manter o funcionamento do aplicativo;</li>
        <li>Permitir a cria&ccedil;&atilde;o de perfis e a conex&atilde;o entre peregrinos;</li>
        <li>Enviar notifica&ccedil;&otilde;es sobre atividades e mensagens;</li>
        <li>Processar doa&ccedil;&otilde;es;</li>
        <li>Melhorar a experi&ecirc;ncia do usu&aacute;rio e a seguran&ccedil;a do servi&ccedil;o.</li>
      </ul>

      <h2>3. Base Legal (LGPD e GDPR)</h2>
      <ul>
        <li><strong>Consentimento:</strong> ao criar sua conta e perfil, voc&ecirc; consente com o tratamento dos seus dados.</li>
        <li><strong>Execu&ccedil;&atilde;o de contrato:</strong> necess&aacute;rio para fornecer os servi&ccedil;os solicitados.</li>
        <li><strong>Interesse leg&iacute;timo:</strong> para seguran&ccedil;a e melhoria do aplicativo.</li>
      </ul>

      <h2>4. Compartilhamento de Dados</h2>
      <p>Seus dados podem ser compartilhados com:</p>
      <ul>
        <li><strong>Outros usu&aacute;rios:</strong> nome, foto e perfil de peregrino s&atilde;o vis&iacute;veis para participantes de atividades.</li>
        <li><strong>Stripe:</strong> para processamento de pagamentos.</li>
        <li><strong>Provedores de infraestrutura:</strong> servidores e banco de dados para opera&ccedil;&atilde;o do servi&ccedil;o.</li>
      </ul>
      <p>N&atilde;o vendemos seus dados pessoais a terceiros.</p>

      <h2>5. Transfer&ecirc;ncia Internacional de Dados</h2>
      <p>Os dados podem ser processados em servidores localizados nos Estados Unidos. Garantimos que essas transfer&ecirc;ncias seguem as salvaguardas exigidas pela LGPD e GDPR, incluindo cl&aacute;usulas contratuais padr&atilde;o quando aplic&aacute;vel.</p>

      <h2>6. Reten&ccedil;&atilde;o de Dados</h2>
      <p>Seus dados s&atilde;o mantidos enquanto sua conta estiver ativa. Ap&oacute;s a exclus&atilde;o da conta, os dados ser&atilde;o removidos em at&eacute; 30 dias, exceto quando houver obriga&ccedil;&atilde;o legal de reten&ccedil;&atilde;o.</p>

      <h2>7. Seus Direitos</h2>
      <h3>LGPD (Brasil)</h3>
      <p>Voc&ecirc; tem direito a: confirma&ccedil;&atilde;o do tratamento, acesso, corre&ccedil;&atilde;o, anonimiza&ccedil;&atilde;o, bloqueio ou elimina&ccedil;&atilde;o de dados desnecess&aacute;rios, portabilidade, informa&ccedil;&atilde;o sobre compartilhamento, revoga&ccedil;&atilde;o do consentimento e oposi&ccedil;&atilde;o.</p>

      <h3>GDPR (Uni&atilde;o Europeia)</h3>
      <p>Voc&ecirc; tem direito a: acesso, retifica&ccedil;&atilde;o, apagamento (&ldquo;direito ao esquecimento&rdquo;), restri&ccedil;&atilde;o do tratamento, portabilidade, oposi&ccedil;&atilde;o e n&atilde;o estar sujeito a decis&otilde;es automatizadas.</p>

      <h3>CCPA/CPRA (Estados Unidos)</h3>
      <p>Residentes da Calif&oacute;rnia t&ecirc;m direito a: saber quais dados pessoais s&atilde;o coletados, solicitar exclus&atilde;o, optar por n&atilde;o ter dados vendidos (n&atilde;o vendemos dados) e n&atilde;o sofrer discrimina&ccedil;&atilde;o por exercer esses direitos.</p>

      <h2>8. Seguran&ccedil;a</h2>
      <p>Adotamos medidas t&eacute;cnicas e organizacionais para proteger seus dados, incluindo criptografia em tr&acirc;nsito (HTTPS/TLS), armazenamento seguro de senhas e controle de acesso.</p>

      <h2>9. Cookies</h2>
      <p>Utilizamos cookies estritamente necess&aacute;rios para manter sua sess&atilde;o ativa e suas prefer&ecirc;ncias de idioma. N&atilde;o utilizamos cookies de rastreamento ou publicidade.</p>

      <h2>10. Menores de Idade</h2>
      <p>O Meet Up n&atilde;o &eacute; destinado a menores de 16 anos. N&atilde;o coletamos intencionalmente dados de menores. Se tomarmos conhecimento de que coletamos dados de um menor, eles ser&atilde;o exclu&iacute;dos prontamente.</p>

      <h2>11. Altera&ccedil;&otilde;es nesta Pol&iacute;tica</h2>
      <p>Podemos atualizar esta pol&iacute;tica periodicamente. Altera&ccedil;&otilde;es significativas ser&atilde;o comunicadas pelo aplicativo.</p>

      <h2>12. Contato</h2>
      <p>Para exercer seus direitos ou esclarecer d&uacute;vidas sobre esta pol&iacute;tica, entre em contato conosco pelo e-mail: <strong>privacidade@meetup-camino.com</strong></p>
      <p>Encarregado de Prote&ccedil;&atilde;o de Dados (DPO): <strong>privacidade@meetup-camino.com</strong></p>
    </article>
  );
}

function PrivacyEN() {
  return (
    <article className="prose prose-sm dark:prose-invert max-w-none" data-testid="privacy-content">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground text-sm">Last updated: February 06, 2026</p>

      <p><strong>Meet Up</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;app&rdquo;) respects your privacy and is committed to protecting your personal data. This policy describes how we collect, use, store, and protect your information in compliance with Brazil&rsquo;s General Data Protection Law (LGPD &ndash; Law No. 13,709/2018), the European Union&rsquo;s General Data Protection Regulation (GDPR), and United States privacy laws (CCPA/CPRA and other applicable legislation).</p>

      <h2>1. Data We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email, and profile picture provided by the authentication service (Replit Auth).</li>
        <li><strong>Profile data:</strong> nationality, language, bio, travel dates, Camino cities, and activity preferences, voluntarily provided by you.</li>
        <li><strong>Activity data:</strong> activities created, participations, chat messages, and ratings.</li>
        <li><strong>Payment data:</strong> processed by Stripe. We do not store credit card data.</li>
        <li><strong>Notification data:</strong> push subscription information for sending notifications, when authorized by you.</li>
        <li><strong>Technical data:</strong> IP address, browser type, operating system, and session cookie data.</li>
      </ul>

      <h2>2. Purposes of Processing</h2>
      <p>Your data is processed to:</p>
      <ul>
        <li>Provide and maintain the application;</li>
        <li>Enable profile creation and connection between pilgrims;</li>
        <li>Send notifications about activities and messages;</li>
        <li>Process donations;</li>
        <li>Improve user experience and service security.</li>
      </ul>

      <h2>3. Legal Basis (LGPD and GDPR)</h2>
      <ul>
        <li><strong>Consent:</strong> by creating your account and profile, you consent to the processing of your data.</li>
        <li><strong>Contract performance:</strong> necessary to provide requested services.</li>
        <li><strong>Legitimate interest:</strong> for security and application improvement.</li>
      </ul>

      <h2>4. Data Sharing</h2>
      <p>Your data may be shared with:</p>
      <ul>
        <li><strong>Other users:</strong> name, photo, and pilgrim profile are visible to activity participants.</li>
        <li><strong>Stripe:</strong> for payment processing.</li>
        <li><strong>Infrastructure providers:</strong> servers and databases for service operation.</li>
      </ul>
      <p>We do not sell your personal data to third parties.</p>

      <h2>5. International Data Transfer</h2>
      <p>Data may be processed on servers located in the United States. We ensure these transfers follow the safeguards required by LGPD and GDPR, including standard contractual clauses where applicable.</p>

      <h2>6. Data Retention</h2>
      <p>Your data is maintained while your account is active. After account deletion, data will be removed within 30 days, except where legal retention obligations apply.</p>

      <h2>7. Your Rights</h2>
      <h3>LGPD (Brazil)</h3>
      <p>You have the right to: confirmation of processing, access, correction, anonymization, blocking or deletion of unnecessary data, portability, information about sharing, revocation of consent, and objection.</p>

      <h3>GDPR (European Union)</h3>
      <p>You have the right to: access, rectification, erasure (&ldquo;right to be forgotten&rdquo;), restriction of processing, portability, objection, and not being subject to automated decisions.</p>

      <h3>CCPA/CPRA (United States)</h3>
      <p>California residents have the right to: know what personal data is collected, request deletion, opt out of data sales (we do not sell data), and not be discriminated against for exercising these rights.</p>

      <h2>8. Security</h2>
      <p>We adopt technical and organizational measures to protect your data, including encryption in transit (HTTPS/TLS), secure password storage, and access controls.</p>

      <h2>9. Cookies</h2>
      <p>We use strictly necessary cookies to maintain your active session and language preferences. We do not use tracking or advertising cookies.</p>

      <h2>10. Children</h2>
      <p>Meet Up is not intended for children under 16. We do not knowingly collect data from minors. If we become aware that we have collected data from a minor, it will be promptly deleted.</p>

      <h2>11. Changes to This Policy</h2>
      <p>We may update this policy periodically. Significant changes will be communicated through the application.</p>

      <h2>12. Contact</h2>
      <p>To exercise your rights or ask questions about this policy, contact us at: <strong>privacy@meetup-camino.com</strong></p>
      <p>Data Protection Officer (DPO): <strong>privacy@meetup-camino.com</strong></p>
    </article>
  );
}

function PrivacyES() {
  return (
    <article className="prose prose-sm dark:prose-invert max-w-none" data-testid="privacy-content">
      <h1>Pol&iacute;tica de Privacidad</h1>
      <p className="text-muted-foreground text-sm">&Uacute;ltima actualizaci&oacute;n: 06 de febrero de 2026</p>

      <p><strong>Meet Up</strong> (&ldquo;nosotros&rdquo;, &ldquo;nuestro&rdquo;, &ldquo;aplicaci&oacute;n&rdquo;) respeta su privacidad y se compromete a proteger sus datos personales. Esta pol&iacute;tica describe c&oacute;mo recopilamos, usamos, almacenamos y protegemos su informaci&oacute;n, en cumplimiento con la Ley General de Protecci&oacute;n de Datos de Brasil (LGPD), el Reglamento General de Protecci&oacute;n de Datos de la Uni&oacute;n Europea (GDPR), y las leyes de privacidad de los Estados Unidos (CCPA/CPRA).</p>

      <h2>1. Datos que Recopilamos</h2>
      <ul>
        <li><strong>Datos de cuenta:</strong> nombre, correo electr&oacute;nico y foto de perfil proporcionados por el servicio de autenticaci&oacute;n.</li>
        <li><strong>Datos de perfil:</strong> nacionalidad, idioma, biograf&iacute;a, fechas de viaje, ciudades del Camino y preferencias de actividades.</li>
        <li><strong>Datos de actividades:</strong> actividades creadas, participaciones, mensajes de chat y calificaciones.</li>
        <li><strong>Datos de pago:</strong> procesados por Stripe. No almacenamos datos de tarjetas de cr&eacute;dito.</li>
        <li><strong>Datos de notificaciones:</strong> informaci&oacute;n de suscripci&oacute;n push, cuando usted lo autoriza.</li>
        <li><strong>Datos t&eacute;cnicos:</strong> direcci&oacute;n IP, tipo de navegador, sistema operativo y datos de cookies.</li>
      </ul>

      <h2>2. Finalidades del Tratamiento</h2>
      <ul>
        <li>Proporcionar y mantener el funcionamiento de la aplicaci&oacute;n;</li>
        <li>Permitir la creaci&oacute;n de perfiles y la conexi&oacute;n entre peregrinos;</li>
        <li>Enviar notificaciones sobre actividades y mensajes;</li>
        <li>Procesar donaciones;</li>
        <li>Mejorar la experiencia del usuario y la seguridad del servicio.</li>
      </ul>

      <h2>3. Base Legal (LGPD y GDPR)</h2>
      <ul>
        <li><strong>Consentimiento:</strong> al crear su cuenta, usted consiente el tratamiento de sus datos.</li>
        <li><strong>Ejecuci&oacute;n de contrato:</strong> necesario para prestar los servicios solicitados.</li>
        <li><strong>Inter&eacute;s leg&iacute;timo:</strong> para seguridad y mejora de la aplicaci&oacute;n.</li>
      </ul>

      <h2>4. Compartici&oacute;n de Datos</h2>
      <p>No vendemos sus datos personales a terceros. Sus datos pueden compartirse con otros usuarios (perfil visible), Stripe (pagos) y proveedores de infraestructura.</p>

      <h2>5. Transferencia Internacional de Datos</h2>
      <p>Los datos pueden procesarse en servidores ubicados en Estados Unidos, con las salvaguardas requeridas por la LGPD y el GDPR.</p>

      <h2>6. Retenci&oacute;n de Datos</h2>
      <p>Sus datos se mantienen mientras su cuenta est&eacute; activa. Tras la eliminaci&oacute;n de la cuenta, se eliminar&aacute;n en un plazo de 30 d&iacute;as.</p>

      <h2>7. Sus Derechos</h2>
      <p>Seg&uacute;n la LGPD, GDPR y CCPA/CPRA, usted tiene derecho a: acceso, rectificaci&oacute;n, eliminaci&oacute;n, portabilidad, oposici&oacute;n, revocaci&oacute;n del consentimiento y a no ser discriminado por ejercer estos derechos.</p>

      <h2>8. Seguridad</h2>
      <p>Adoptamos medidas t&eacute;cnicas y organizativas para proteger sus datos, incluyendo cifrado en tr&aacute;nsito (HTTPS/TLS) y controles de acceso.</p>

      <h2>9. Cookies</h2>
      <p>Utilizamos cookies estrictamente necesarias para mantener su sesi&oacute;n activa. No utilizamos cookies de seguimiento o publicidad.</p>

      <h2>10. Menores de Edad</h2>
      <p>Meet Up no est&aacute; destinado a menores de 16 a&ntilde;os.</p>

      <h2>11. Cambios en esta Pol&iacute;tica</h2>
      <p>Podemos actualizar esta pol&iacute;tica peri&oacute;dicamente.</p>

      <h2>12. Contacto</h2>
      <p>Para ejercer sus derechos: <strong>privacidad@meetup-camino.com</strong></p>
    </article>
  );
}

function PrivacyFR() {
  return (
    <article className="prose prose-sm dark:prose-invert max-w-none" data-testid="privacy-content">
      <h1>Politique de Confidentialit&eacute;</h1>
      <p className="text-muted-foreground text-sm">Derni&egrave;re mise &agrave; jour : 06 f&eacute;vrier 2026</p>

      <p><strong>Meet Up</strong> (&laquo; nous &raquo;, &laquo; notre &raquo;, &laquo; application &raquo;) respecte votre vie priv&eacute;e et s&rsquo;engage &agrave; prot&eacute;ger vos donn&eacute;es personnelles. Cette politique d&eacute;crit comment nous collectons, utilisons, stockons et prot&eacute;geons vos informations, conform&eacute;ment &agrave; la Loi G&eacute;n&eacute;rale de Protection des Donn&eacute;es du Br&eacute;sil (LGPD), au R&egrave;glement G&eacute;n&eacute;ral sur la Protection des Donn&eacute;es de l&rsquo;Union europ&eacute;enne (RGPD), et aux lois am&eacute;ricaines sur la vie priv&eacute;e (CCPA/CPRA).</p>

      <h2>1. Donn&eacute;es que Nous Collectons</h2>
      <ul>
        <li><strong>Donn&eacute;es de compte :</strong> nom, e-mail et photo de profil fournis par le service d&rsquo;authentification.</li>
        <li><strong>Donn&eacute;es de profil :</strong> nationalit&eacute;, langue, biographie, dates de voyage, villes du Chemin et pr&eacute;f&eacute;rences d&rsquo;activit&eacute;s.</li>
        <li><strong>Donn&eacute;es d&rsquo;activit&eacute;s :</strong> activit&eacute;s cr&eacute;&eacute;es, participations, messages de chat et &eacute;valuations.</li>
        <li><strong>Donn&eacute;es de paiement :</strong> trait&eacute;es par Stripe. Nous ne stockons pas les donn&eacute;es de carte bancaire.</li>
        <li><strong>Donn&eacute;es de notifications :</strong> informations d&rsquo;abonnement push, lorsque vous l&rsquo;autorisez.</li>
        <li><strong>Donn&eacute;es techniques :</strong> adresse IP, type de navigateur, syst&egrave;me d&rsquo;exploitation et donn&eacute;es de cookies.</li>
      </ul>

      <h2>2. Finalit&eacute;s du Traitement</h2>
      <ul>
        <li>Fournir et maintenir le fonctionnement de l&rsquo;application ;</li>
        <li>Permettre la cr&eacute;ation de profils et la mise en relation entre p&egrave;lerins ;</li>
        <li>Envoyer des notifications sur les activit&eacute;s et les messages ;</li>
        <li>Traiter les dons ;</li>
        <li>Am&eacute;liorer l&rsquo;exp&eacute;rience utilisateur et la s&eacute;curit&eacute; du service.</li>
      </ul>

      <h2>3. Base L&eacute;gale (LGPD et RGPD)</h2>
      <ul>
        <li><strong>Consentement :</strong> en cr&eacute;ant votre compte, vous consentez au traitement de vos donn&eacute;es.</li>
        <li><strong>Ex&eacute;cution du contrat :</strong> n&eacute;cessaire pour fournir les services demand&eacute;s.</li>
        <li><strong>Int&eacute;r&ecirc;t l&eacute;gitime :</strong> pour la s&eacute;curit&eacute; et l&rsquo;am&eacute;lioration de l&rsquo;application.</li>
      </ul>

      <h2>4. Partage des Donn&eacute;es</h2>
      <p>Nous ne vendons pas vos donn&eacute;es personnelles &agrave; des tiers. Vos donn&eacute;es peuvent &ecirc;tre partag&eacute;es avec d&rsquo;autres utilisateurs (profil visible), Stripe (paiements) et les fournisseurs d&rsquo;infrastructure.</p>

      <h2>5. Transfert International de Donn&eacute;es</h2>
      <p>Les donn&eacute;es peuvent &ecirc;tre trait&eacute;es sur des serveurs situ&eacute;s aux &Eacute;tats-Unis, avec les garanties requises par la LGPD et le RGPD.</p>

      <h2>6. Conservation des Donn&eacute;es</h2>
      <p>Vos donn&eacute;es sont conserv&eacute;es tant que votre compte est actif. Apr&egrave;s suppression du compte, elles seront supprim&eacute;es sous 30 jours.</p>

      <h2>7. Vos Droits</h2>
      <p>Conform&eacute;ment &agrave; la LGPD, au RGPD et au CCPA/CPRA, vous avez le droit : d&rsquo;acc&egrave;s, de rectification, d&rsquo;effacement (&laquo; droit &agrave; l&rsquo;oubli &raquo;), de limitation du traitement, de portabilit&eacute;, d&rsquo;opposition, de retrait du consentement et de non-discrimination.</p>

      <h2>8. S&eacute;curit&eacute;</h2>
      <p>Nous adoptons des mesures techniques et organisationnelles pour prot&eacute;ger vos donn&eacute;es, y compris le chiffrement en transit (HTTPS/TLS) et les contr&ocirc;les d&rsquo;acc&egrave;s.</p>

      <h2>9. Cookies</h2>
      <p>Nous utilisons des cookies strictement n&eacute;cessaires pour maintenir votre session active. Nous n&rsquo;utilisons pas de cookies de suivi ou de publicit&eacute;.</p>

      <h2>10. Mineurs</h2>
      <p>Meet Up n&rsquo;est pas destin&eacute; aux mineurs de moins de 16 ans.</p>

      <h2>11. Modifications de cette Politique</h2>
      <p>Nous pouvons mettre &agrave; jour cette politique p&eacute;riodiquement.</p>

      <h2>12. Contact</h2>
      <p>Pour exercer vos droits : <strong>privacy@meetup-camino.com</strong></p>
    </article>
  );
}
