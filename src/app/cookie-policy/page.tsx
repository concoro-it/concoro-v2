import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL_ENTITY } from '@/lib/legal/site-legal';

export const metadata: Metadata = {
    title: 'Cookie Policy',
    description: 'Informativa cookie di Concoro con categorie, finalita e modalita di gestione del consenso.',
    alternates: { canonical: '/cookie-policy' },
};

export default function CookiePolicyPage() {
    return (
        <LegalPage
            eyebrow="Cookie"
            title="Cookie Policy"
            intro="Questa Cookie Policy spiega come Concoro utilizza cookie e tecnologie simili sul sito e nell’area riservata, come vengono gestite le preferenze e quali strumenti terzi possono essere attivati in base al consenso."
            updatedAt={LEGAL_ENTITY.lastUpdatedLabel}
            sections={[
                {
                    title: '1. Cosa sono cookie e tecnologie simili',
                    paragraphs: [
                        'I cookie sono piccoli file di testo memorizzati nel browser o sul dispositivo dell’utente. Possono essere utilizzati per far funzionare correttamente il sito, ricordare preferenze, mantenere la sessione autenticata o misurare l’utilizzo del servizio.',
                        'Concoro utilizza anche strumenti equivalenti, come local storage e tag di misurazione, quando necessari per le finalita indicate in questa policy.',
                    ],
                },
                {
                    title: '2. Come raccogliamo il consenso',
                    paragraphs: [
                        'All’apertura del sito mostriamo un banner personalizzato che consente di accettare o rifiutare i cookie analytics. Le preferenze espresse vengono memorizzate e riapplicate alle visite successive.',
                        'Finche il consenso analytics non viene accordato, il Google Tag viene configurato in modalita di consenso con storage analytics e advertising negati di default.',
                    ],
                },
                {
                    title: '3. Categorie di cookie utilizzati',
                    bullets: [
                        'Cookie tecnici o strettamente necessari: servono al funzionamento del sito, alla gestione della sessione, dell’autenticazione, della sicurezza e alla navigazione nelle aree protette.',
                        'Strumenti di preferenza e consenso: servono a ricordare la scelta dell’utente sul banner cookie, anche tramite local storage.',
                        'Cookie analytics: sono utilizzati per analizzare traffico, performance e utilizzo del sito tramite Google Tag / Google Analytics, solo se l’utente presta il consenso ove richiesto.',
                        'Cookie di pagamento o servizi terzi attivati dall’utente: possono essere installati da Stripe o da altri provider quando l’utente avvia un checkout, apre il portale clienti o utilizza servizi incorporati o collegati.',
                    ],
                },
                {
                    title: '4. Elenco operativo dei principali strumenti',
                    bullets: [
                        'Supabase: cookie tecnici necessari per autenticazione, mantenimento sessione e sicurezza dell’account.',
                        'Google Tag / Google Analytics: misurazione del traffico e degli eventi di navigazione, subordinata al consenso per le finalita non strettamente necessarie.',
                        'Local storage del sito: memorizza la preferenza di consenso associata al banner cookie.',
                        'Stripe: eventuali cookie o tecnologie equivalenti su pagine di checkout o billing ospitate dal provider di pagamento.',
                    ],
                },
                {
                    title: '5. Durata',
                    paragraphs: [
                        'La durata dei cookie puo variare: alcuni sono di sessione e vengono rimossi alla chiusura del browser, altri persistono per un periodo definito dal servizio che li imposta. Le preferenze di consenso possono rimanere memorizzate finche non vengono aggiornate dall’utente o rimosse manualmente dal browser.',
                    ],
                },
                {
                    title: '6. Come gestire o revocare il consenso',
                    bullets: [
                        'Puoi modificare le tue scelte cancellando i dati del sito dal browser o implementando un comando di riapertura del banner nelle impostazioni del sito.',
                        'Puoi inoltre bloccare o eliminare i cookie dalle impostazioni del browser. Questa scelta potrebbe pero compromettere alcune funzioni tecniche del servizio.',
                        `Per richieste specifiche puoi contattarci all’indirizzo ${LEGAL_ENTITY.privacyEmail}.`,
                    ],
                },
                {
                    title: '7. Cookie di terze parti',
                    paragraphs: [
                        'Quando l’utente interagisce con servizi di terze parti, i relativi fornitori possono installare cookie o raccogliere dati secondo le proprie informative. Concoro invita a consultare anche le policy dei singoli provider, in particolare Google, Supabase e Stripe.',
                    ],
                },
                {
                    title: '8. Aggiornamenti della policy',
                    paragraphs: [
                        'Questa policy puo essere aggiornata in caso di variazioni tecniche, modifiche normative o introduzione di nuovi strumenti di tracciamento. La versione piu recente e sempre disponibile su questa pagina.',
                    ],
                },
            ]}
        />
    );
}
