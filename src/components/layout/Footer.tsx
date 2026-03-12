import Link from 'next/link';
import Image from 'next/image';

const links = {
    piattaforma: [
        { label: 'Concorsi', href: '/concorsi' },
        { label: 'Per Regione', href: '/regione' },
        { label: 'Per Settore', href: '/settore' },
        { label: 'In Scadenza Oggi', href: '/scadenza/oggi' },
        { label: 'Questa Settimana', href: '/scadenza/questa-settimana' },
        { label: 'Nuovi Arrivi', href: '/scadenza/nuovi' },
    ],
    azienda: [
        { label: 'Chi Siamo', href: '/chi-siamo' },
        { label: 'Contatti', href: '/contatti' },
        { label: 'Prezzi', href: '/pricing' },
    ],
    legale: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Cookie Policy', href: '/cookie-policy' },
        { label: 'Termini di Servizio', href: '/termini' },
    ],
};

export function Footer() {
    return (
        <footer className="border-t border-border bg-surface mt-16">
            <div className="container max-w-container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1">
                        <Link href="/">
                            <Image
                                src="/concoro-logo-light.png"
                                alt="Concoro Logo"
                                width={120}
                                height={32}
                                className="h-8 w-auto object-contain"
                            />
                        </Link>
                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                            La piattaforma italiana per trovare i concorsi pubblici. Aggiornati ogni giorno dal portale InPA.
                        </p>
                    </div>

                    {/* Piattaforma */}
                    <div>
                        <h3 className="text-sm font-semibold mb-4">Piattaforma</h3>
                        <ul className="space-y-2">
                            {links.piattaforma.map(l => (
                                <li key={l.href}>
                                    <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Azienda */}
                    <div>
                        <h3 className="text-sm font-semibold mb-4">Azienda</h3>
                        <ul className="space-y-2">
                            {links.azienda.map(l => (
                                <li key={l.href}>
                                    <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legale */}
                    <div>
                        <h3 className="text-sm font-semibold mb-4">Legale</h3>
                        <ul className="space-y-2">
                            {links.legale.map(l => (
                                <li key={l.href}>
                                    <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Concoro. Tutti i diritti riservati.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Dati forniti dal portale{' '}
                        <a href="https://www.inpa.gov.it" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                            InPA
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
