// app/[locale]/terms/page.tsx

type Locale = "en" | "fr" | "es";

const TITLES: Record<Locale, string> = {
  en: "Terms of Use",
  fr: "Conditions d’utilisation",
  es: "Términos y Condiciones de Uso",
};

const TERMS_TEXT: Record<Locale, string> = {
  en: `
Last updated: [insert date]

These Terms of Use (“Terms”) govern your access to and use of this website, any associated mobile site, applications and related services (collectively, the “Services”), operated by the company that owns and manages this site (“the Company”, “we”, “our”, “us”). The Company operates primarily in the Province of Ontario, Canada.

By accessing or using the Services in any way, you agree to be bound by these Terms. If you do not agree, you must not use the Services.

1. Informational nature of the Services

1.1 All content on the Services – including menus, prices, promotions, event descriptions, schedules, photos and any other material – is provided for general informational and promotional purposes only. It may not reflect real-time conditions, availability or pricing.

1.2 The Company may modify, update, suspend or remove any content, event, promotion, schedule, artist, DJ, price, opening hours or feature of the Services at any time, with or without prior notice.

1.3 The Company is not responsible for losses or inconvenience arising from reliance on outdated, incomplete or inaccurate information on the Services.

2. Eligibility and acceptable use

2.1 You must be of legal age in your province or territory to participate in activities involving alcohol or late-night events.

2.2 You agree not to use the Services for any illegal or unauthorized purpose and not to interfere with the normal operation of the Services.

2.3 You must not attempt to gain unauthorized access to our systems, introduce malware, scrape data without permission, impersonate the Company or its staff, or post content that is unlawful, hateful, discriminatory, pornographic or otherwise inappropriate.

3. User accounts (if applicable)

3.1 If you create an account, you are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account.

3.2 You must notify us immediately if you suspect any unauthorized access or breach of security.

3.3 We may suspend or terminate accounts that we believe are being misused or used in breach of these Terms.

4. Voluntary information provided by users

4.1 When you voluntarily provide information (such as contact details, preferences, reservation data, survey responses, contest entries or marketing opt-ins), you authorize the Company to collect, store, analyze and use that information to:

– operate and improve the Services;  
– manage reservations, guest lists and events;  
– plan marketing and promotional campaigns across various channels (email, SMS, push notifications, social media, online advertising, printed material);  
– support business analytics and decision-making;  
– comply with legal and regulatory obligations.

4.2 We may use aggregated and anonymized data for research, statistics and business intelligence. Such data will not reasonably identify you.

4.3 Personal information handling is further described in our Privacy Policy, which forms part of these Terms.

5. Events, reservations, tickets and third-party misconduct

5.1 Information about events, tickets, cover charges or reservations is provided as a guide only. It does not guarantee entry, availability or a particular experience unless expressly stated in a written confirmation from the Company or its authorized ticketing provider.

5.2 We may collaborate with third-party ticketing, reservation or payment platforms. Their terms apply in addition to these Terms.

5.3 The Company is not responsible for any actions, omissions or misrepresentations by third parties, including but not limited to:

– unofficial or fraudulent ticket sellers or resellers;  
– individuals or entities falsely presenting themselves as representatives of the Company;  
– social media profiles, pages or events not officially managed or endorsed by the Company;  
– false claims regarding cancellations, rescheduling or relocation of events;  
– any third party collecting money or personal data while claiming to sell tickets, reservations or packages on behalf of the Company outside of our official channels.

5.4 If you purchase tickets, pay deposits or provide personal data to a third party outside our official channels, you do so at your sole risk. The Company has no obligation to recognize such transactions, honour access or provide any refund for amounts paid to unauthorized third parties.

5.5 The Company reserves the right to cancel, postpone or modify events for operational, safety, regulatory or business reasons. Except where required by law or under an official ticketing agreement, the Company is not liable for travel, accommodation or any other consequential costs.

6. Intellectual property

6.1 Unless otherwise indicated, all content on the Services – including text, logos, trademarks, graphics, designs, photos, videos and audio – is the property of the Company or its licensors and is protected by Canadian and international intellectual property laws.

6.2 You may view and temporarily download content for your personal, non-commercial use only, provided that you do not remove any copyright or proprietary notices.

6.3 You may not reproduce, distribute, modify, create derivative works, publicly display, perform, transmit or exploit any content from the Services without our prior written consent.

7. User-generated content

7.1 If the Services allow you to post reviews, comments, photos or other material, you grant the Company a non-exclusive, worldwide, royalty-free, transferable and sublicensable license to use, reproduce, modify, publish, translate, distribute and display that content in any media for the purposes of operating and promoting the Services.

7.2 You declare that you have all necessary rights to the content you submit and that your content does not infringe the rights of any third party or violate any law.

7.3 We may remove or edit user content at our discretion, without being obligated to monitor all submissions.

8. Disclaimers

8.1 The Services are provided “as is” and “as available”, without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy or availability.

8.2 We do not guarantee that the Services will be error-free, secure, uninterrupted or free of harmful components.

8.3 Your use of the Services is at your own risk. You are responsible for verifying any information before relying on it.

9. Limitation of liability

9.1 To the fullest extent permitted by law, the Company and its directors, officers, employees, agents and affiliates are not liable for any indirect, incidental, consequential, special or punitive damages, including loss of profits, revenue, goodwill, data or business opportunities arising from your use of the Services.

9.2 In particular, the Company is not liable for damages arising from:

– fraudulent or misleading conduct by third parties;  
– unauthorized ticket resale or claims of representation;  
– misuse or alteration of publicly available information;  
– cancellations, rescheduling or changes in events or services, except where required by applicable law.

9.3 Where liability cannot be excluded, it shall be limited to the amount you paid directly to the Company for the specific service or event giving rise to the claim.

10. Indemnity

You agree to indemnify and hold harmless the Company and its directors, officers, employees, agents and affiliates from any claims, damages, losses, liabilities, costs and expenses (including reasonable legal fees) arising from your use of the Services, your violation of these Terms or your infringement of any third-party rights.

11. Changes to the Terms and to the Services

We may update these Terms or change the Services at any time. The “Last updated” date will indicate the latest version. Your continued use of the Services after any change constitutes acceptance of the revised Terms.

12. Governing law and jurisdiction

These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein. You submit to the exclusive jurisdiction of the courts located in Ontario, Canada, except where applicable law provides otherwise.

13. Contact

If you have questions about these Terms, please contact us using the information provided on the Website.
`,

  fr: `
Dernière mise à jour : [insérer la date]

Les présentes Conditions d’utilisation (« Conditions ») régissent l’accès et l’utilisation de ce site Web, de tout site mobile, des applications et des services connexes (collectivement, les « Services ») exploités par la société propriétaire de ce site (« la Société », « nous », « notre »). La Société exerce principalement ses activités dans la province de l’Ontario, au Canada.

En accédant aux Services ou en les utilisant, vous acceptez d’être lié par les présentes Conditions. Si vous n’acceptez pas ces Conditions, vous ne devez pas utiliser les Services.

1. Nature informative des Services

1.1 Tout le contenu des Services — y compris les menus, prix, promotions, descriptions d’événements, horaires, photos et tout autre matériel — est fourni uniquement à titre informatif et promotionnel. Il peut ne pas refléter la situation réelle en temps réel.

1.2 La Société peut modifier, mettre à jour, suspendre ou retirer tout contenu, événement, prix, horaire, artiste, DJ ou fonctionnalité des Services à tout moment, avec ou sans préavis.

1.3 La Société n’est pas responsable des pertes ou inconvénients découlant de l’utilisation d’informations périmées, incomplètes ou inexactes figurant sur les Services.

2. Admissibilité et utilisation acceptable

2.1 Vous devez avoir l’âge légal dans votre province ou territoire pour participer aux activités impliquant la consommation d’alcool ou des événements en soirée.

2.2 Vous vous engagez à ne pas utiliser les Services à des fins illégales ou non autorisées et à ne pas perturber leur fonctionnement normal.

2.3 Il est interdit de tenter d’accéder de façon non autorisée à nos systèmes, d’introduire des logiciels malveillants, de collecter des données sans autorisation, d’usurper l’identité de la Société ou de son personnel, ou de publier du contenu illégal, haineux, discriminatoire, pornographique ou inapproprié.

3. Comptes d’utilisateur

3.1 Si vous créez un compte, vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées au moyen de ce compte.

3.2 Vous devez nous informer immédiatement de toute utilisation non autorisée ou de toute violation de sécurité.

3.3 Nous pouvons suspendre ou résilier tout compte que nous estimons utilisé de manière abusive ou en violation des présentes Conditions.

4. Informations fournies volontairement par les utilisateurs

4.1 Lorsque vous fournissez volontairement des informations (coordonnées, préférences, données de réservation, réponses à des sondages, participation à des concours, consentement marketing, etc.), vous autorisez la Société à collecter, enregistrer, analyser et utiliser ces informations afin de :

– exploiter et améliorer les Services ;  
– gérer les réservations, listes d’invités et événements ;  
– planifier des campagnes de marketing et de promotion sur divers canaux (courriel, SMS, notifications push, médias sociaux, publicité en ligne, matériel imprimé) ;  
– soutenir l’analyse et la prise de décision commerciale ;  
– respecter les obligations légales et réglementaires.

4.2 Nous pouvons utiliser des données agrégées et anonymisées à des fins de recherche, de statistiques et d’intelligence d’affaires. Ces données ne permettent pas de vous identifier raisonnablement.

4.3 Le traitement des renseignements personnels est décrit plus en détail dans notre Politique de confidentialité, qui fait partie intégrante des présentes Conditions.

5. Événements, réservations, billets et comportements de tiers

5.1 Les informations relatives aux événements, billets, frais d’entrée ou réservations sont fournies à titre indicatif seulement. Elles ne garantissent pas l’accès, la disponibilité ou une expérience particulière, sauf indication contraire dans une confirmation écrite de la Société ou de son fournisseur de billetterie autorisé.

5.2 Nous pouvons collaborer avec des plateformes tierces de billetterie, de réservation ou de paiement. Leurs conditions s’appliquent en plus des présentes Conditions.

5.3 La Société n’est pas responsable des actes, omissions ou fausses représentations de tiers, notamment :

– les revendeurs de billets non autorisés ou frauduleux ;  
– les personnes ou entités se présentant faussement comme représentant la Société ;  
– les pages, profils ou événements sur les médias sociaux qui ne sont pas officiellement gérés ou approuvés par la Société ;  
– les allégations mensongères concernant l’annulation, le report ou la relocalisation d’événements ;  
– toute personne ou entité qui perçoit de l’argent ou recueille des renseignements personnels en prétendant vendre des billets, des réservations ou des forfaits au nom de la Société en dehors de nos canaux officiels.

5.4 Si vous achetez des billets, versez des acomptes ou fournissez des renseignements personnels à un tiers en dehors de nos canaux officiels, vous le faites à vos risques. La Société n’a aucune obligation de reconnaître ces transactions ni de rembourser les sommes payées à des tiers non autorisés.

5.5 La Société se réserve le droit d’annuler, de reporter ou de modifier des événements pour des raisons opérationnelles, de sécurité, réglementaires ou commerciales. Sauf exigence légale contraire ou dispositions d’un contrat officiel de billetterie, la Société n’est pas responsable des frais de déplacement, d’hébergement ou d’autres coûts consécutifs.

6. Propriété intellectuelle

6.1 Sauf indication contraire, tout le contenu des Services — textes, logos, marques de commerce, graphiques, dessins, photos, vidéos, audio — est la propriété de la Société ou de ses concédants et est protégé par les lois canadiennes et internationales en matière de propriété intellectuelle.

6.2 Vous pouvez consulter et télécharger temporairement le contenu pour un usage personnel et non commercial, à condition de ne pas supprimer les avis de droit d’auteur ou de propriété.

6.3 Il est interdit de reproduire, distribuer, modifier, créer des œuvres dérivées, afficher publiquement, exécuter, transmettre ou exploiter le contenu des Services sans notre autorisation écrite préalable.

7. Contenu généré par les utilisateurs

7.1 Si les Services vous permettent de publier des avis, commentaires, photos ou autre contenu, vous accordez à la Société une licence non exclusive, mondiale, libre de redevances, transférable et sous-licenciable pour utiliser, reproduire, modifier, publier, traduire, distribuer et afficher ce contenu dans tout média, afin d’exploiter et de promouvoir les Services.

7.2 Vous déclarez disposer de tous les droits nécessaires sur le contenu soumis et garantissez que ce contenu ne viole pas les droits d’un tiers ni aucune loi.

7.3 Nous pouvons retirer ou modifier tout contenu d’utilisateur à notre seule discrétion.

8. Exclusions de garanties

8.1 Les Services sont fournis « tels quels » et « selon leur disponibilité », sans garantie d’aucune sorte, expresse ou implicite, notamment de qualité marchande, d’adaptation à un usage particulier, d’absence de contrefaçon, d’exactitude ou de disponibilité.

8.2 Nous ne garantissons pas que les Services seront exempts d’erreurs, sécurisés, ininterrompus ou dépourvus de composants nuisibles.

8.3 Votre utilisation des Services se fait à vos risques. Il vous incombe de vérifier les informations avant de vous y fier.

9. Limitation de responsabilité

9.1 Dans la mesure maximale permise par la loi, la Société ainsi que ses administrateurs, dirigeants, employés, mandataires et sociétés affiliées ne sauraient être tenus responsables des dommages indirects, accessoires, consécutifs, spéciaux ou punitifs, y compris la perte de profits, de revenus, de clientèle, de données ou d’occasions d’affaires découlant de l’utilisation des Services.

9.2 En particulier, la Société n’est pas responsable des dommages résultant :

– de comportements frauduleux ou trompeurs de tiers ;  
– de la revente non autorisée de billets ou de fausses représentations ;  
– de la mauvaise utilisation ou de la modification d’informations rendues publiques ;  
– de l’annulation, du report ou de la modification d’événements ou de services, sauf exigence légale contraire.

9.3 Lorsque la responsabilité ne peut être exclue, elle est limitée au montant que vous avez payé directement à la Société pour le service ou l’événement en cause.

10. Indemnisation

Vous vous engagez à indemniser et à tenir indemnes la Société ainsi que ses administrateurs, dirigeants, employés, mandataires et sociétés affiliées de toute réclamation, perte, responsabilité, coût ou dépense (y compris les frais juridiques raisonnables) résultant de votre utilisation des Services, de votre violation des présentes Conditions ou de l’atteinte aux droits d’un tiers.

11. Modifications

La Société peut mettre à jour les présentes Conditions ou modifier les Services à tout moment. La date de « Dernière mise à jour » indique la version la plus récente. Votre utilisation continue des Services constitue votre acceptation des Conditions révisées.

12. Droit applicable et tribunal compétent

Les présentes Conditions sont régies par les lois de la province de l’Ontario et les lois fédérales du Canada applicables. Tout litige sera soumis à la compétence exclusive des tribunaux situés en Ontario, sous réserve des lois impératives applicables.

13. Contact

Pour toute question concernant ces Conditions, veuillez communiquer avec nous au moyen des coordonnées indiquées sur le site Web.
`,

  es: `
Última actualización: [insertar fecha]

Estos Términos y Condiciones de Uso (“Términos”) regulan el acceso y uso de este sitio web, cualquier sitio móvil, aplicaciones y servicios relacionados (conjuntamente, los “Servicios”), operados por la empresa propietaria de este sitio (“la Compañía”, “nosotros”, “nuestro”). La Compañía opera principalmente en la provincia de Ontario, Canadá.

Al acceder o utilizar los Servicios de cualquier forma, usted acepta quedar vinculado por estos Términos. Si no está de acuerdo, no debe utilizar los Servicios.

1. Carácter informativo de los Servicios

1.1 Todo el contenido de los Servicios —incluyendo menús, precios, promociones, descripciones de eventos, horarios, fotografías y cualquier otro material— se ofrece únicamente con fines informativos y promocionales. Puede no reflejar las condiciones reales en tiempo real.

1.2 La Compañía puede modificar, actualizar, suspender o eliminar cualquier contenido, evento, promoción, precio, horario, artista, DJ o funcionalidad de los Servicios en cualquier momento, con o sin previo aviso.

1.3 La Compañía no se hace responsable de pérdidas o inconvenientes derivados de la confianza en información desactualizada, incompleta o inexacta publicada en los Servicios.

2. Elegibilidad y uso aceptable

2.1 Usted debe contar con la edad legal en su provincia o territorio para participar en actividades que involucren consumo de alcohol o eventos nocturnos.

2.2 Usted se compromete a no utilizar los Servicios con fines ilegales o no autorizados y a no interferir con su funcionamiento normal.

2.3 Está prohibido intentar obtener acceso no autorizado a nuestros sistemas, introducir código malicioso, extraer datos sin permiso, hacerse pasar por la Compañía o su personal, o publicar contenido ilegal, difamatorio, discriminatorio, pornográfico o inapropiado.

3. Cuentas de usuario

3.1 Si crea una cuenta, usted es responsable de la confidencialidad de sus credenciales y de todas las actividades realizadas mediante dicha cuenta.

3.2 Debe notificarnos de inmediato si sospecha de cualquier acceso no autorizado o violación de seguridad.

3.3 Podemos suspender o cancelar cualquier cuenta que, a nuestro criterio, se utilice de forma indebida o en violación de estos Términos.

4. Información proporcionada voluntariamente por los usuarios

4.1 Cuando usted proporciona voluntariamente información (datos de contacto, preferencias, información de reservaciones, respuestas a encuestas, participación en concursos, consentimiento para marketing, etc.), autoriza a la Compañía a recopilar, almacenar, analizar y utilizar dicha información para:

– operar y mejorar los Servicios;  
– gestionar reservaciones, listas de invitados y eventos;  
– planear campañas de mercadeo y promociones en diversos canales (correo electrónico, SMS, notificaciones push, redes sociales, publicidad en línea, material impreso);  
– apoyar el análisis y la toma de decisiones del negocio;  
– cumplir obligaciones legales y regulatorias.

4.2 Podemos utilizar datos agregados y anonimizados con fines de investigación, estadística e inteligencia de negocios. Estos datos no permiten identificarle razonablemente.

4.3 El tratamiento de la información personal se describe con más detalle en nuestra Política de Privacidad, que forma parte de estos Términos.

5. Eventos, reservaciones, boletos y actuación de terceros

5.1 La información sobre eventos, boletos, cargos de entrada o reservaciones se proporciona únicamente como guía. No garantiza acceso, disponibilidad ni una experiencia específica, salvo que exista una confirmación escrita de la Compañía o de su proveedor de boletaje autorizado.

5.2 Podemos colaborar con plataformas de terceros para boletos, reservaciones o pagos. Sus condiciones aplican adicionalmente a estos Términos.

5.3 La Compañía no es responsable de las acciones, omisiones o declaraciones falsas de terceros, incluyendo:

– revendedores de boletos no autorizados o fraudulentos;  
– personas o entidades que se ostenten falsamente como representantes de la Compañía;  
– perfiles, páginas o eventos en redes sociales que no estén gestionados o autorizados oficialmente por la Compañía;  
– información falsa sobre cancelaciones, cambios de fecha u horario, o cambios de sede de los eventos;  
– cualquier tercero que cobre dinero o recolecte datos personales alegando vender boletos, reservaciones o paquetes a nombre de la Compañía fuera de nuestros canales oficiales.

5.4 Si usted adquiere boletos, paga anticipos o proporciona datos personales a un tercero fuera de nuestros canales oficiales, lo hace bajo su propio riesgo. La Compañía no tiene obligación de reconocer dichas transacciones ni de reembolsar cantidades pagadas a terceros no autorizados.

5.5 La Compañía se reserva el derecho de cancelar, posponer o modificar eventos por razones operativas, de seguridad, regulatorias o comerciales. Salvo disposición legal en contrario o lo que indiquen los contratos oficiales de boletaje, la Compañía no será responsable de gastos de transporte, hospedaje ni de otros costos indirectos.

6. Propiedad intelectual

6.1 Salvo indicación en contrario, todo el contenido de los Servicios —textos, logotipos, marcas, gráficos, diseños, fotografías, videos y audio— es propiedad de la Compañía o de sus licenciantes y está protegido por las leyes de propiedad intelectual de Canadá y otras jurisdicciones.

6.2 Usted puede visualizar y descargar temporalmente contenido para su uso personal y no comercial, siempre que no elimine avisos de derechos de autor ni leyendas de propiedad.

6.3 No se permite reproducir, distribuir, modificar, crear obras derivadas, exhibir públicamente, ejecutar, transmitir o explotar el contenido de los Servicios sin nuestro consentimiento previo y por escrito.

7. Contenido generado por los usuarios

7.1 Si los Servicios permiten que usted publique reseñas, comentarios, fotos u otros materiales, usted otorga a la Compañía una licencia no exclusiva, mundial, libre de regalías, transferible y sublicenciable para usar, reproducir, modificar, publicar, traducir, distribuir y mostrar dicho contenido en cualquier medio, con el fin de operar y promover los Servicios.

7.2 Usted declara que cuenta con todos los derechos necesarios sobre el contenido que envía y garantiza que éste no infringe derechos de terceros ni viola la ley.

7.3 Podemos editar o eliminar contenido de usuarios a nuestra sola discreción, sin estar obligados a supervisar todas las contribuciones.

8. Exclusión de garantías

8.1 Los Servicios se proporcionan “tal cual” y “según disponibilidad”, sin garantías de ningún tipo, ya sean expresas o implícitas, incluyendo sin limitarse a garantías de comerciabilidad, adecuación a un propósito particular, exactitud, disponibilidad o no infracción.

8.2 No garantizamos que los Servicios estén libres de errores, sean seguros, ininterrumpidos o estén exentos de componentes dañinos.

8.3 El uso que usted haga de los Servicios será bajo su propia responsabilidad. Usted es responsable de verificar la información antes de basarse en ella.

9. Limitación de responsabilidad

9.1 En la máxima medida permitida por la ley, la Compañía y sus directores, funcionarios, empleados, agentes y afiliadas no serán responsables de daños indirectos, incidentales, consecuentes, especiales o punitivos, incluyendo pérdida de ganancias, ingresos, clientela, datos u oportunidades de negocio derivados del uso de los Servicios.

9.2 En particular, la Compañía no será responsable de daños derivados de:

– conductas fraudulentas o engañosas de terceros;  
– reventa no autorizada de boletos o falsas representaciones;  
– uso indebido o manipulación de información difundida públicamente;  
– cancelaciones, cambios o modificaciones de eventos o servicios, salvo que lo exija la ley aplicable.

9.3 Cuando la responsabilidad no pueda ser excluida, se limitará al monto que usted haya pagado directamente a la Compañía por el servicio o evento específico que dio origen a la reclamación.

10. Indemnización

Usted se obliga a indemnizar y mantener indemne a la Compañía y a sus directores, funcionarios, empleados, agentes y afiliadas frente a cualquier reclamación, pérdida, responsabilidad, costo o gasto (incluyendo honorarios legales razonables) derivados de su uso de los Servicios, del incumplimiento de estos Términos o de la violación de derechos de terceros.

11. Cambios en los Términos y en los Servicios

La Compañía puede actualizar estos Términos o modificar los Servicios en cualquier momento. La fecha de “Última actualización” indicará la versión más reciente. El uso continuo de los Servicios después de dichos cambios implica la aceptación de los Términos modificados.

12. Ley aplicable y jurisdicción

Estos Términos se rigen por las leyes de la provincia de Ontario y las leyes federales de Canadá aplicables. Usted se somete a la jurisdicción exclusiva de los tribunales ubicados en Ontario, salvo que la ley aplicable disponga lo contrario.

13. Contacto

Si tiene preguntas sobre estos Términos, puede comunicarse con nosotros utilizando la información indicada en el sitio web.
`,
};

interface TermsPageProps {
  params: { locale: string };
}

export default function TermsPage({ params }: TermsPageProps) {
  const locale = (["en", "fr", "es"].includes(params.locale)
    ? params.locale
    : "en") as Locale;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">
        {TITLES[locale]}
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
        {TERMS_TEXT[locale]}
      </div>
    </main>
  );
}
