import type { LucideIcon } from 'lucide-react';
import { AlarmClockCheck, CalendarClock, CalendarRange, Sparkles } from 'lucide-react';

export type ScadenzaKey = 'oggi' | 'questa-settimana' | 'questo-mese' | 'nuovi';

export interface ScadenzaBucket {
    key: ScadenzaKey;
    label: string;
    shortLabel: string;
    href: string;
    description: string;
    eyebrow: string;
    icon: LucideIcon;
    accentClass: string;
}

export const SCADENZA_BUCKETS: ScadenzaBucket[] = [
    {
        key: 'oggi',
        label: 'In scadenza oggi',
        shortLabel: 'Oggi',
        href: '/scadenza/oggi',
        description: 'Ultime ore utili: controlla e chiudi le candidature prioritarie.',
        eyebrow: 'Urgenza alta',
        icon: AlarmClockCheck,
        accentClass: 'border-rose-200 bg-rose-50 text-rose-700',
    },
    {
        key: 'questa-settimana',
        label: 'Questa settimana',
        shortLabel: '7 giorni',
        href: '/scadenza/questa-settimana',
        description: 'Panoramica operativa dei bandi da chiudere nei prossimi 7 giorni.',
        eyebrow: 'Sprint settimanale',
        icon: CalendarClock,
        accentClass: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    {
        key: 'questo-mese',
        label: 'Questo mese',
        shortLabel: 'Questo mese',
        href: '/scadenza/questo-mese',
        description: 'Visione completa delle opportunita da pianificare nel mese corrente.',
        eyebrow: 'Orizzonte mensile',
        icon: CalendarRange,
        accentClass: 'border-blue-200 bg-blue-50 text-blue-700',
    },
    {
        key: 'nuovi',
        label: 'Nuovi arrivi',
        shortLabel: 'Nuovi',
        href: '/scadenza/nuovi',
        description: 'Nuove pubblicazioni degli ultimi giorni per restare sempre aggiornato.',
        eyebrow: 'Nuove uscite',
        icon: Sparkles,
        accentClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
];

export function getScadenzaBucket(key: ScadenzaKey): ScadenzaBucket {
    const bucket = SCADENZA_BUCKETS.find((item) => item.key === key);
    if (!bucket) {
        return SCADENZA_BUCKETS[0];
    }
    return bucket;
}
