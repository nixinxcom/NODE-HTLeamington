// app/[locale]/privacy/page.tsx

type Locale = "en" | "fr" | "es";

const PRIVACY_TITLES: Record<Locale, string> = {
  en: "Privacy Policy",
  fr: "Politique de confidentialité",
  es: "Política de Privacidad",
};

const PRIVACY_TEXT: Record<Locale, string> = {
  en: `
Last updated: [insert date]

This Privacy Policy (“Policy”) explains how the Company collects, uses, discloses and protects personal information when you use this website, any associated mobile site, applications and related services (collectively, the “Services”). The Company operates primarily in Ontario, Canada.

By accessing or using the Services, you acknowledge that you have read and understood this Policy. This document is for general information only and does not constitute legal advice.

1. Personal information we collect

Depending on how you interact with the Services, we may collect:

– Identification and contact details: name, email, phone number, city, province, country, preferred language.  
– Reservation and event data: date and time of visit, number of guests, type of event, special requests.  
– Marketing and communication preferences: newsletter subscriptions, consent for email/SMS marketing, contest entries, loyalty programs.  
– Payment-related data: limited payment information processed through secure third-party providers (we normally do not store full card numbers).  
– Technical and usage data: IP address, browser type, device type, operating system, pages visited, time and date of visits, referral URLs, approximate location based on IP, and interactions with our content.  
– Content you submit: reviews, comments, survey responses, photos, or other materials.  
– Information from third parties: social media platforms, marketing partners, analytics providers or publicly available sources, where permitted by law.

2. Purposes of use

We use personal information to:

– provide, operate and maintain the Services;  
– manage reservations, guest lists and event participation;  
– respond to inquiries and provide customer support;  
– send marketing and promotional communications (email, SMS, push, ads, social media) in accordance with your preferences and applicable law;  
– personalize your experience and show relevant content;  
– analyze trends and measure performance;  
– detect, investigate and prevent fraud, abuse and security incidents;  
– comply with legal and regulatory requirements;  
– any other purpose for which you have given your consent.

3. Legal basis and consent

Where required by law, we rely on your consent to use personal information for marketing and certain processing. You may withdraw consent at any time by following unsubscribe instructions in our messages or by contacting us.

We may also process personal information to perform a contract with you (e.g., a reservation), to pursue our legitimate business interests (such as improving the Services and ensuring security) and to comply with legal obligations.

4. Minors

The Services are not intended for individuals who are under the legal drinking age in their jurisdiction. We do not knowingly collect personal information from minors without appropriate parental consent. If you believe we have collected such information, please contact us so we can delete it where appropriate.

5. Sharing of information

We may share personal information with:

– service providers and vendors who help us operate the Services (hosting, analytics, marketing, email and SMS delivery, reservations, payment processing, customer support);  
– business partners and event organizers involved in specific events or promotions;  
– law enforcement authorities, regulators or courts when required by law or when we believe disclosure is necessary to protect our rights, property or safety, or that of our guests or the public;  
– successors or assigns in connection with a merger, acquisition or sale of assets.

We do not sell personal information in exchange for money. If applicable law defines “sale” more broadly, we will comply with any required opt-out mechanisms.

6. International transfers

Some service providers may be located outside your province, territory or country, including outside Canada. As a result, personal information may be processed in jurisdictions with different privacy laws. We take reasonable steps to ensure appropriate safeguards are in place.

7. Retention

We retain personal information only for as long as necessary for the purposes described in this Policy, unless a longer retention period is required or permitted by law (for example for tax or regulatory reasons). When information is no longer needed, we will securely delete or anonymize it.

8. Security

We use reasonable physical, technical and organizational safeguards to protect personal information from loss, theft, misuse, unauthorized access, disclosure, alteration and destruction. No method of transmission or storage is completely secure; we cannot guarantee absolute security.

9. Your rights

Depending on applicable law, you may have the right to:

– request access to the personal information we hold about you;  
– request correction of inaccurate or incomplete information;  
– withdraw consent to marketing communications;  
– request deletion of your personal information where we are not required to retain it;  
– object to or restrict certain processing activities.

To exercise these rights, contact us using the details provided on the Website. We may verify your identity before responding.

10. Cookies and similar technologies

The Services may use cookies, local storage, pixels and similar technologies to:

– remember your settings and preferences;  
– keep you logged in;  
– analyze traffic and usage;  
– deliver personalized offers and advertising.

Most browsers allow you to block or delete cookies; this may affect the functionality of the Services.

11. Third-party links and social media

The Services may contain links to third-party websites, platforms or social media pages. We are not responsible for their privacy practices or content. We encourage you to review their privacy policies before providing information.

12. Changes to this Policy

We may update this Policy from time to time. The “Last updated” date will show the latest version. Your continued use of the Services after changes are posted constitutes acceptance of the updated Policy.

13. Contact

If you have questions about this Privacy Policy or our handling of personal information, please contact us using the information provided on the Website.
`,

  fr: `
Dernière mise à jour : [insérer la date]

La présente Politique de confidentialité (« Politique ») explique comment la Société collecte, utilise, communique et protège les renseignements personnels lorsque vous utilisez ce site Web, tout site mobile, les applications et les services connexes (collectivement, les « Services »). La Société exerce principalement ses activités en Ontario, au Canada.

En accédant aux Services ou en les utilisant, vous reconnaissez avoir lu et compris cette Politique.

1. Renseignements personnels collectés

Selon la façon dont vous utilisez les Services, nous pouvons recueillir :

– des renseignements d’identification et de contact : nom, adresse courriel, numéro de téléphone, ville, province, pays, langue préférée ;  
– des renseignements relatifs aux réservations et événements : date et heure de la visite, nombre de personnes, type d’événement, demandes particulières ;  
– des préférences de marketing et de communication : abonnements à des infolettres, consentement au marketing par courriel ou SMS, participation à des concours ou programmes de fidélité ;  
– des renseignements liés au paiement : certaines données de paiement traitées par des fournisseurs tiers sécurisés (habituellement, nous ne conservons pas les numéros de cartes complets) ;  
– des données techniques et d’utilisation : adresse IP, type de navigateur, type d’appareil, système d’exploitation, pages consultées, date et heure des visites, URL de provenance, localisation approximative basée sur l’IP et interactions avec notre contenu ;  
– le contenu que vous soumettez : avis, commentaires, réponses à des sondages, photos ou autres documents ;  
– des renseignements provenant de tiers : plateformes de médias sociaux, partenaires marketing, fournisseurs d’analytique ou sources publiques, lorsque la loi le permet.

2. Finalités de l’utilisation

Nous utilisons les renseignements personnels afin de :

– fournir, exploiter et maintenir les Services ;  
– gérer les réservations, listes d’invités et participations aux événements ;  
– répondre aux demandes d’information et offrir du soutien à la clientèle ;  
– envoyer des communications marketing et promotionnelles (courriel, SMS, notifications push, publicité en ligne, médias sociaux), conformément à vos préférences et à la loi applicable ;  
– personnaliser votre expérience et vous présenter du contenu pertinent ;  
– analyser les tendances, mesurer la performance et améliorer nos offres ;  
– détecter, enquêter et prévenir la fraude, les abus et les incidents de sécurité ;  
– respecter nos obligations légales et réglementaires ;  
– toute autre fin pour laquelle vous avez donné votre consentement.

3. Base légale et consentement

Lorsque la loi l’exige, nous nous appuyons sur votre consentement pour utiliser les renseignements personnels à des fins de marketing ou pour certains traitements. Vous pouvez retirer votre consentement en tout temps en utilisant les mécanismes de désabonnement fournis ou en nous contactant.

Nous pouvons également traiter les renseignements personnels pour exécuter un contrat avec vous (par exemple, une réservation), pour poursuivre nos intérêts commerciaux légitimes (tels que l’amélioration des Services et la sécurité) et pour respecter nos obligations légales.

4. Mineurs

Les Services ne s’adressent pas aux personnes qui n’ont pas l’âge légal pour consommer de l’alcool dans leur territoire. Nous ne collectons pas sciemment de renseignements personnels sur des mineurs sans consentement parental approprié. Si vous croyez que nous avons recueilli de tels renseignements, veuillez nous contacter afin que nous puissions les supprimer, le cas échéant.

5. Communication des renseignements

Nous pouvons communiquer des renseignements personnels à :

– des fournisseurs de services qui nous aident à exploiter les Services (hébergement, analytique, marketing, envoi de courriels ou de SMS, réservations, traitement des paiements, soutien à la clientèle) ;  
– des partenaires commerciaux ou organisateurs d’événements associés à certaines activités ;  
– des autorités chargées de l’application de la loi, des organismes de réglementation ou des tribunaux lorsqu’une telle communication est exigée par la loi ou jugée nécessaire pour protéger nos droits, nos biens ou la sécurité de nos invités ou du public ;  
– des acquéreurs ou autres parties dans le cadre d’une fusion, d’une acquisition ou d’une vente d’actifs.

Nous ne vendons pas les renseignements personnels en échange d’une somme d’argent. Si la loi définit la « vente » de manière plus large, nous respecterons les mécanismes d’exclusion requis.

6. Transferts internationaux

Certains fournisseurs de services peuvent être situés à l’extérieur de votre province, territoire ou pays, y compris à l’extérieur du Canada. Vos renseignements personnels peuvent donc être traités dans des juridictions ayant des lois sur la protection de la vie privée différentes. Nous prenons des mesures raisonnables pour que des protections appropriées soient en place.

7. Conservation

Nous conservons les renseignements personnels uniquement pendant la période nécessaire pour atteindre les objectifs décrits dans la présente Politique, à moins qu’une période plus longue ne soit requise ou permise par la loi. Lorsque les renseignements ne sont plus nécessaires, nous les supprimons ou les anonymisons de manière sécuritaire.

8. Sécurité

Nous mettons en œuvre des mesures physiques, techniques et organisationnelles raisonnables pour protéger les renseignements personnels contre la perte, le vol, l’utilisation abusive, l’accès non autorisé, la divulgation, la modification ou la destruction. Toutefois, aucune méthode de transmission ou de stockage n’est parfaitement sécuritaire; nous ne pouvons garantir une sécurité absolue.

9. Vos droits

Selon la loi applicable, vous pouvez avoir le droit de :

– demander l’accès aux renseignements personnels que nous détenons à votre sujet ;  
– demander la rectification de renseignements inexacts ou incomplets ;  
– retirer votre consentement aux communications marketing ;  
– demander la suppression de certains renseignements lorsque nous ne sommes pas tenus de les conserver ;  
– vous opposer à certains traitements ou demander qu’ils soient limités.

Pour exercer ces droits, veuillez nous contacter en utilisant les coordonnées fournies sur le site Web. Nous pourrions devoir vérifier votre identité avant de répondre.

10. Témoins (cookies) et technologies similaires

Les Services peuvent utiliser des témoins, le stockage local, des pixels et d’autres technologies similaires pour :

– mémoriser vos paramètres et préférences ;  
– maintenir votre session ouverte ;  
– analyser le trafic et l’utilisation ;  
– diffuser des offres et publicités personnalisées.

Vous pouvez configurer votre navigateur pour bloquer ou supprimer les témoins, ce qui pourrait toutefois nuire au fonctionnement de certaines parties des Services.

11. Liens vers des sites tiers et médias sociaux

Les Services peuvent contenir des liens vers des sites Web, plateformes ou pages de médias sociaux de tiers. Nous ne sommes pas responsables de leurs pratiques en matière de confidentialité ni de leur contenu. Nous vous encourageons à consulter leurs politiques de confidentialité avant de fournir des renseignements.

12. Modifications de la Politique

Nous pouvons mettre à jour la présente Politique de temps à autre. La date de « Dernière mise à jour » indique la version la plus récente. Votre utilisation continue des Services après la publication des modifications constitue votre acceptation de la Politique révisée.

13. Contact

Pour toute question concernant cette Politique de confidentialité ou nos pratiques en matière de protection des renseignements personnels, veuillez communiquer avec nous à l’aide des coordonnées indiquées sur le site Web.
`,

  es: `
Última actualización: [insertar fecha]

Esta Política de Privacidad (“Política”) explica cómo la Compañía recopila, utiliza, divulga y protege la información personal cuando usted utiliza este sitio web, cualquier sitio móvil, aplicaciones y servicios relacionados (conjuntamente, los “Servicios”). La Compañía opera principalmente en la provincia de Ontario, Canadá.

Al acceder o utilizar los Servicios, usted reconoce que ha leído y comprendido esta Política. Este documento es informativo y no constituye asesoría legal.

1. Información personal que recopilamos

Según la forma en que utilice los Servicios, podemos recopilar:

– Datos de identificación y contacto: nombre, correo electrónico, número de teléfono, ciudad, provincia, país, idioma preferido.  
– Datos de reservaciones y eventos: fecha y hora de visita, número de personas, tipo de evento, solicitudes especiales.  
– Preferencias de marketing y comunicación: suscripciones a boletines, consentimiento para marketing por correo electrónico o SMS, participación en concursos o programas de lealtad.  
– Datos relacionados con pagos: cierta información de pago procesada por proveedores externos seguros (normalmente no almacenamos números completos de tarjeta).  
– Datos técnicos y de uso: dirección IP, tipo de navegador, tipo de dispositivo, sistema operativo, páginas visitadas, fecha y hora de las visitas, URL de referencia, ubicación aproximada basada en IP e interacciones con nuestro contenido.  
– Contenido que usted envía: reseñas, comentarios, respuestas a encuestas, fotografías u otros materiales.  
– Información de terceros: plataformas de redes sociales, socios de marketing, proveedores de analítica o fuentes públicas, cuando la ley lo permita.

2. Finalidades del uso

Utilizamos la información personal para:

– proporcionar, operar y mantener los Servicios;  
– gestionar reservaciones, listas de invitados y participación en eventos;  
– responder consultas y brindar servicio al cliente;  
– enviar comunicaciones de marketing y promoción (correo electrónico, SMS, notificaciones push, anuncios, redes sociales) de acuerdo con sus preferencias y la legislación aplicable;  
– personalizar su experiencia y mostrar contenido relevante;  
– analizar tendencias, medir el desempeño y mejorar nuestras ofertas;  
– detectar, investigar y prevenir fraudes, abusos e incidentes de seguridad;  
– cumplir obligaciones legales y regulatorias;  
– cualquier otra finalidad para la cual usted haya otorgado su consentimiento.

3. Base legal y consentimiento

Cuando la ley lo exige, nos basamos en su consentimiento para utilizar la información personal con fines de marketing u otros tratamientos específicos. Puede retirar su consentimiento en cualquier momento utilizando los mecanismos de cancelación de suscripción incluidos en nuestras comunicaciones o contactándonos directamente.

Asimismo, podemos tratar su información personal para ejecutar un contrato con usted (por ejemplo, una reservación), para perseguir nuestros intereses comerciales legítimos (como mejorar los Servicios y garantizar la seguridad) y para cumplir obligaciones legales.

4. Menores de edad

Los Servicios no están dirigidos a personas que no tengan la edad legal para consumir alcohol en su jurisdicción. No recopilamos deliberadamente información personal de menores sin el consentimiento adecuado de sus padres o tutores. Si considera que hemos recopilado datos de un menor, contáctenos para que podamos eliminarlos cuando corresponda.

5. Compartir información

Podemos compartir información personal con:

– proveedores de servicios que nos ayudan a operar los Servicios (alojamiento, analítica, marketing, envío de correos o SMS, reservaciones, procesamiento de pagos, atención al cliente);  
– socios comerciales y organizadores de eventos involucrados en actividades específicas;  
– autoridades gubernamentales, reguladores o tribunales cuando la ley lo exija o cuando consideremos que la divulgación es necesaria para proteger nuestros derechos, bienes o la seguridad de nuestros invitados o del público;  
– sucesores o cesionarios en el contexto de una fusión, adquisición o venta de activos.

No vendemos información personal a cambio de dinero. Si la ley aplicable define “venta” de forma más amplia, cumpliremos con los mecanismos de exclusión que sean necesarios.

6. Transferencias internacionales

Algunos proveedores de servicios pueden ubicarse fuera de su provincia, territorio o país, incluyendo fuera de Canadá. En consecuencia, su información personal puede ser procesada en jurisdicciones con leyes de privacidad diferentes. Tomamos medidas razonables para asegurar que existan garantías adecuadas para proteger sus datos.

7. Conservación

Conservamos la información personal únicamente durante el tiempo necesario para cumplir las finalidades descritas en esta Política, salvo que la ley requiera o permita un plazo mayor (por ejemplo, por motivos fiscales o regulatorios). Cuando la información ya no sea necesaria, la eliminaremos o la anonimizaremos de forma segura.

8. Seguridad

Implementamos medidas físicas, técnicas y organizativas razonables para proteger la información personal contra pérdida, robo, uso indebido, acceso no autorizado, divulgación, alteración o destrucción. No obstante, ningún método de transmisión o almacenamiento es completamente seguro; no podemos garantizar seguridad absoluta.

9. Sus derechos

Dependiendo de la legislación aplicable, usted puede tener derecho a:

– solicitar acceso a la información personal que mantenemos sobre usted;  
– solicitar la corrección de información inexacta o incompleta;  
– retirar su consentimiento para comunicaciones de marketing;  
– solicitar la eliminación de cierta información personal cuando no estemos obligados a conservarla;  
– oponerse a determinados tratamientos o solicitar su limitación.

Para ejercer estos derechos, contáctenos utilizando los datos que aparecen en el sitio web. Es posible que debamos verificar su identidad antes de responder a su solicitud.

10. Cookies y tecnologías similares

Los Servicios pueden utilizar cookies, almacenamiento local, píxeles y tecnologías similares para:

– recordar sus preferencias y configuración;  
– mantener su sesión iniciada;  
– analizar el tráfico y el uso;  
– ofrecer anuncios y promociones personalizados.

La mayoría de los navegadores permiten bloquear o eliminar cookies, aunque esto puede afectar el funcionamiento de algunas partes de los Servicios.

11. Enlaces a terceros y redes sociales

Los Servicios pueden contener enlaces a sitios web, plataformas o páginas de redes sociales de terceros. No somos responsables de sus prácticas de privacidad ni de su contenido. Le recomendamos revisar sus políticas de privacidad antes de proporcionar información.

12. Cambios en esta Política

Podemos actualizar esta Política periódicamente. La fecha de “Última actualización” indicará la versión más reciente. El uso continuo de los Servicios después de la publicación de cambios implica la aceptación de la Política revisada.

13. Contacto

Si tiene preguntas acerca de esta Política de Privacidad o sobre cómo tratamos la información personal, puede contactarnos mediante los datos indicados en el sitio web.
`,
};

interface PrivacyPageProps {
  params: { locale: string };
}

export default function PrivacyPage({ params }: PrivacyPageProps) {
  const locale = (["en", "fr", "es"].includes(params.locale)
    ? params.locale
    : "en") as Locale;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">
        {PRIVACY_TITLES[locale]}
      </h1>
      <div
        className="
          min-h-[60vh]
          whitespace-pre-wrap
          rounded-lg
          border
          border-neutral-700
          bg-neutral-900/40
          px-4
          py-3
          text-sm
          leading-relaxed
          overflow-y-auto
        "
      >
        {PRIVACY_TEXT[locale]}
      </div>
    </main>
  );
}
