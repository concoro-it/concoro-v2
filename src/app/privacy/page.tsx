import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL_ENTITY } from '@/lib/legal/site-legal';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Informativa privacy di Concoro sul trattamento dei dati personali degli utenti della piattaforma.',
    alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
    return (
        <LegalPage
            eyebrow="Privacy"
            title="Privacy Policy"
            intro="Questa informativa descrive come Concoro raccoglie, utilizza, conserva e protegge i dati personali trattati tramite il sito, l’area riservata, i servizi di supporto e le funzionalita a pagamento."
            updatedAt={LEGAL_ENTITY.lastUpdatedLabel}
            sections={[
                {
                    title: '1. Titolare del trattamento',
                    paragraphs: [
                        `Il titolare del trattamento e ${LEGAL_ENTITY.legalName}, con sede in ${LEGAL_ENTITY.registeredOffice}, P.IVA/C.F. ${LEGAL_ENTITY.vatOrTaxId}.`,
                        `Per richieste relative alla privacy puoi scrivere a ${LEGAL_ENTITY.privacyEmail}. Prima della pubblicazione definitiva di questa informativa, sostituisci i dati societari tra parentesi quadre con quelli corretti.`,
                    ],
                },
                {
                    title: '2. Dati personali trattati',
                    paragraphs: [
                        'Concoro tratta dati forniti direttamente dall’utente, dati generati durante l’utilizzo del servizio e dati tecnici necessari al funzionamento della piattaforma.',
                    ],
                    bullets: [
                        'Dati account e autenticazione: email, password gestita tramite provider di autenticazione, identificativi utente, eventuale nome, cognome e avatar.',
                        'Dati profilo e preferenze: regione, provincia, settore di interesse, profilo professionale, titolo di studio, esperienza, obiettivi, preferenze di notifica e altre informazioni inserite nell’area personale.',
                        'Dati di utilizzo: ricerche salvate, concorsi salvati, interazioni con dashboard, richieste di supporto e log tecnici essenziali.',
                        'Dati di pagamento e abbonamento: identificativi cliente e abbonamento Stripe, piano attivo, stato del pagamento, scadenze e storico fatture. I dati completi della carta non sono trattati direttamente da Concoro.',
                        'Dati analytics e consenso: eventi di navigazione e preferenze di consenso raccolti tramite Google Tag e il banner cookie, solo secondo le scelte effettuate dall’utente.',
                        'Dati condivisi con funzioni AI o automazioni: contenuti inviati nelle conversazioni con Genio, nei prompt e negli eventuali file caricati per l’analisi.',
                    ],
                },
                {
                    title: '3. Finalita e basi giuridiche',
                    bullets: [
                        'Erogazione del servizio, gestione dell’account, autenticazione, salvataggio delle preferenze e accesso alle funzioni richieste: esecuzione del contratto o di misure precontrattuali.',
                        'Gestione di abbonamenti, pagamenti, fatturazione, prevenzione frodi e supporto amministrativo: esecuzione del contratto e adempimento di obblighi legali.',
                        'Assistenza clienti e gestione delle richieste inviate tramite form o email: esecuzione del contratto o legittimo interesse a fornire supporto operativo.',
                        'Invio di comunicazioni operative e notifiche relative al servizio, incluse scadenze o aggiornamenti di account: esecuzione del contratto o legittimo interesse.',
                        'Analisi aggregate di utilizzo e misurazione del traffico tramite Google Analytics/Google Tag: consenso, ove richiesto.',
                        'Invio di comunicazioni marketing o newsletter tramite Brevo: consenso, salvo eventuali comunicazioni strettamente di servizio.',
                        'Tutela dei diritti del titolare, sicurezza della piattaforma, gestione incidenti e prevenzione abusi: legittimo interesse.',
                    ],
                },
                {
                    title: '4. Modalita del trattamento',
                    paragraphs: [
                        'I dati sono trattati con strumenti elettronici e misure organizzative adeguate alla natura del servizio. L’accesso ai dati e limitato al personale autorizzato e ai fornitori che operano per conto del titolare secondo istruzioni documentate.',
                    ],
                },
                {
                    title: '5. Fornitori e destinatari dei dati',
                    paragraphs: [
                        'Per il funzionamento di Concoro alcuni dati possono essere comunicati a fornitori che agiscono come responsabili del trattamento o, a seconda dei casi, come titolari autonomi. L’elenco va mantenuto coerente con i servizi effettivamente in uso.',
                    ],
                    bullets: [
                        'Supabase per autenticazione, database applicativo e infrastruttura connessa all’account utente.',
                        'Stripe per checkout, gestione abbonamenti, fatturazione e area clienti pagamenti.',
                        'Brevo per invio email operative, notifiche e gestione dei contatti.',
                        'Google per Google Tag e Google Analytics, in base al consenso espresso.',
                        'OpenAI e workflow esterni collegati a Genio o funzioni di analisi documentale, limitatamente ai contenuti inviati dall’utente per ottenere la funzionalita richiesta.',
                        'Vercel o analogo hosting provider per distribuzione dell’applicazione, log tecnici e sicurezza.',
                    ],
                },
                {
                    title: '6. Trasferimenti extra SEE',
                    paragraphs: [
                        'Alcuni fornitori possono trattare dati al di fuori dello Spazio Economico Europeo. In tali casi il titolare dovra utilizzare strumenti di trasferimento adeguati, come decisioni di adeguatezza o clausole contrattuali standard, e verificare periodicamente la documentazione dei fornitori.',
                    ],
                },
                {
                    title: '7. Periodi di conservazione',
                    bullets: [
                        'Dati account e profilo: per la durata del rapporto contrattuale e, successivamente, per il tempo necessario a gestire contestazioni, obblighi di legge o richieste dell’utente.',
                        'Dati relativi ad abbonamenti, pagamenti e documenti contabili: per i termini previsti dalla normativa fiscale e civilistica applicabile.',
                        'Richieste di supporto: per il tempo necessario a gestire la richiesta e per eventuali esigenze di difesa o miglioramento del servizio.',
                        'Dati analytics e preferenze cookie: secondo quanto indicato nella Cookie Policy e nelle impostazioni degli strumenti terzi utilizzati.',
                        'Prompt, chat e file caricati nelle funzionalita AI: per il tempo strettamente necessario a fornire la funzione, salvo diversa retention tecnica o legale da documentare nelle procedure interne.',
                    ],
                },
                {
                    title: '8. Diritti degli interessati',
                    paragraphs: [
                        'Nei casi previsti dal GDPR, l’utente puo chiedere accesso, rettifica, cancellazione, limitazione del trattamento, portabilita dei dati, opposizione al trattamento fondato su legittimo interesse e revoca del consenso senza pregiudicare la liceita del trattamento precedente.',
                        `Le richieste possono essere inviate a ${LEGAL_ENTITY.privacyEmail}. L’utente ha inoltre diritto di proporre reclamo all’autorita di controllo competente, in Italia il Garante per la protezione dei dati personali.`,
                    ],
                },
                {
                    title: '9. Minori',
                    paragraphs: [
                        'Il servizio non e destinato a minori che non abbiano l’eta minima richiesta dalla legge applicabile per prestare validamente il consenso o concludere il contratto. Se ritieni che siano stati raccolti dati di un minore senza adeguata base giuridica, contattaci per la rimozione.',
                    ],
                },
                {
                    title: '10. Aggiornamenti',
                    paragraphs: [
                        'Questa informativa puo essere aggiornata per modifiche normative, evoluzioni del servizio o variazioni nei fornitori. La versione aggiornata viene pubblicata su questa pagina con data di ultimo aggiornamento.',
                    ],
                },
            ]}
        />
    );
}
