import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL_ENTITY } from '@/lib/legal/site-legal';

export const metadata: Metadata = {
    title: 'Termini e Condizioni',
    description: 'Termini e condizioni d’uso di Concoro per accesso al sito, account, servizi pro e funzionalita AI.',
    alternates: { canonical: '/termini' },
};

export default function TermsPage() {
    return (
        <LegalPage
            eyebrow="Termini"
            title="Termini e Condizioni"
            intro="I presenti Termini e Condizioni disciplinano l’accesso e l’utilizzo del sito Concoro, dell’area riservata, dei piani a pagamento e delle funzionalita accessorie, incluse le funzioni AI e di supporto."
            updatedAt={LEGAL_ENTITY.lastUpdatedLabel}
            sections={[
                {
                    title: '1. Identita del fornitore',
                    paragraphs: [
                        `Il servizio e offerto da ${LEGAL_ENTITY.legalName}, con sede in ${LEGAL_ENTITY.registeredOffice}, P.IVA/C.F. ${LEGAL_ENTITY.vatOrTaxId}, contattabile a ${LEGAL_ENTITY.supportEmail}.`,
                        'Sostituisci i dati tra parentesi quadre con quelli definitivi del soggetto che commercializza il servizio prima della pubblicazione.',
                    ],
                },
                {
                    title: '2. Oggetto del servizio',
                    paragraphs: [
                        'Concoro offre una piattaforma digitale per consultare, organizzare e monitorare concorsi pubblici in Italia, con funzionalita che possono includere filtri avanzati, salvataggi, notifiche, contenuti personalizzati, area profilo e funzioni premium.',
                        'I dati sui concorsi possono derivare da fonti ufficiali, incluse integrazioni o contenuti collegati al portale InPA. L’utente resta tenuto a verificare sempre il bando ufficiale prima di compiere scelte o candidature.',
                    ],
                },
                {
                    title: '3. Account utente',
                    bullets: [
                        'Per accedere a determinate funzionalita e necessario creare un account e fornire informazioni accurate, aggiornate e complete.',
                        'L’utente e responsabile della riservatezza delle credenziali e di tutte le attivita svolte tramite il proprio account.',
                        'Concoro puo sospendere o limitare l’accesso in presenza di uso illecito, fraudolento, abusivo o contrario ai presenti termini.',
                    ],
                },
                {
                    title: '4. Piani gratuiti e a pagamento',
                    paragraphs: [
                        'Alcune funzionalita sono disponibili gratuitamente, mentre altre richiedono un abbonamento a pagamento. Prezzi, caratteristiche incluse, periodicita e condizioni economiche applicabili sono indicate nella pagina prezzi e nel checkout Stripe.',
                    ],
                    bullets: [
                        'Gli abbonamenti possono essere mensili o annuali, con rinnovo automatico salvo disdetta.',
                        'La gestione del pagamento, del rinnovo, del metodo di pagamento e dell’eventuale cancellazione puo avvenire tramite Stripe o il relativo portale clienti.',
                        'In caso di pagamento non riuscito, l’accesso alle funzionalita premium puo essere sospeso o limitato fino alla regolarizzazione.',
                    ],
                },
                {
                    title: '5. Recesso, cancellazione e rimborsi',
                    paragraphs: [
                        'L’utente puo disdire il rinnovo dell’abbonamento secondo le funzionalita disponibili nel proprio account o nel portale di billing. La cancellazione produce effetti secondo il ciclo di fatturazione in corso, salvo diversa indicazione espressa al momento dell’acquisto.',
                        'Eventuali diritti di recesso o rimborsi previsti dalla normativa applicabile restano impregiudicati. Qualsiasi esclusione o limitazione del recesso per contenuti o servizi digitali sara applicata solo se validamente raccolto il consenso richiesto dalla legge.',
                    ],
                },
                {
                    title: '6. Uso consentito',
                    bullets: [
                        'L’utente si impegna a utilizzare il servizio in modo conforme alla legge, ai presenti termini e ai diritti di terzi.',
                        'E vietato tentare di aggirare limiti tecnici o commerciali, effettuare scraping non autorizzato, compromettere la sicurezza del sito o utilizzare il servizio per finalita fraudolente o illecite.',
                        'E vietato caricare contenuti che violino diritti di terzi, contengano malware, dati non autorizzati o informazioni il cui trattamento non sia consentito.',
                    ],
                },
                {
                    title: '7. Funzionalita AI e contenuti generati',
                    paragraphs: [
                        'Concoro puo offrire strumenti di assistenza AI, suggerimenti automatici o analisi documentali. Tali output sono forniti a scopo informativo e di supporto operativo e non costituiscono consulenza legale, professionale o garanzia di esito nei concorsi.',
                        'L’utente e responsabile dei contenuti che inserisce nei prompt e nei file caricati e deve verificare l’accuratezza degli output prima di farvi affidamento.',
                    ],
                },
                {
                    title: '8. Proprieta intellettuale',
                    paragraphs: [
                        'Marchi, grafica, software, struttura del sito, testi originali e ogni altro contenuto di Concoro sono protetti dalla normativa applicabile. Salvo quanto consentito dalla legge, non possono essere copiati, distribuiti, modificati o riutilizzati senza autorizzazione.',
                    ],
                },
                {
                    title: '9. Disponibilita del servizio',
                    paragraphs: [
                        'Concoro si impegna a mantenere il servizio ragionevolmente disponibile, ma non garantisce continuita assoluta, assenza di errori o disponibilita ininterrotta. Potrebbero verificarsi manutenzioni, aggiornamenti, interruzioni tecniche o dipendenze da fornitori terzi.',
                    ],
                },
                {
                    title: '10. Limitazione di responsabilita',
                    paragraphs: [
                        'Nei limiti consentiti dalla legge, Concoro non risponde di danni indiretti, mancati guadagni, perdite di opportunita o decisioni prese dall’utente sulla base di dati, notifiche o output generati dal servizio senza verifica delle fonti ufficiali.',
                        'Nulla in questi termini esclude o limita responsabilita che non possano essere escluse per legge, inclusi i diritti inderogabili dei consumatori.',
                    ],
                },
                {
                    title: '11. Legge applicabile e foro',
                    paragraphs: [
                        'I presenti termini sono regolati dalla legge italiana, salvo l’applicazione di norme imperative di tutela del consumatore eventualmente applicabili nel Paese di residenza dell’utente.',
                        'Per gli utenti consumatori resta fermo il foro previsto dalla legge. Per gli utenti professionali, salvo diversa previsione inderogabile, il foro esclusivo potra essere quello del luogo in cui ha sede il fornitore.',
                    ],
                },
                {
                    title: '12. Modifiche ai termini',
                    paragraphs: [
                        'Concoro puo aggiornare i presenti termini per ragioni normative, tecniche o commerciali. Le modifiche entrano in vigore dalla data di pubblicazione, salvo quando la legge richieda una comunicazione o un preavviso specifico.',
                    ],
                },
            ]}
        />
    );
}
