import { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, Clock, Calendar, Search, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
    title: 'Concorsi per Scadenza | Concoro',
    description: 'Trova concorsi in scadenza oggi, questa settimana e questo mese.',
};

export default function ScadenzePage() {
    const timeChips = [
        {
            label: 'In scadenza oggi',
            href: '/scadenza/oggi',
            color: 'bg-red-50 text-red-700 border-red-200',
            description: 'Ultime ore per candidarsi.',
            icon: Clock
        },
        {
            label: 'Questa settimana',
            href: '/scadenza/questa-settimana',
            color: 'bg-amber-50 text-amber-700 border-amber-200',
            description: 'Concorsi che scadono nei prossimi 7 giorni.',
            icon: CalendarDays
        },
        {
            label: 'Questo mese',
            href: '/scadenza/questo-mese',
            color: 'bg-blue-50 text-blue-700 border-blue-200',
            description: 'Concorsi in scadenza entro la fine del mese.',
            icon: Calendar
        },
        {
            label: 'Nuovi arrivi',
            href: '/scadenza/nuovi',
            color: 'bg-green-50 text-green-700 border-green-200',
            description: 'Gli ultimi concorsi pubblicati questa settimana.',
            icon: Search
        },
    ];

    return (
        <div className="container max-w-container mx-auto px-4 py-8">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
                <Link href="/" className="hover:text-foreground">Home</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">Scadenze</span>
            </nav>

            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Concorsi per Scadenza
                </h1>
                <p className="text-muted-foreground mt-2 text-lg max-w-3xl">
                    Non perdere le scadenze. Scopri i concorsi in base alla data limite per presentare la tua candidatura.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {timeChips.map((chip) => {
                    const Icon = chip.icon;
                    return (
                        <Link key={chip.href} href={chip.href} className="group">
                            <Card className="h-full hover:shadow-md transition-all border-border cursor-pointer group-hover:border-primary/20">
                                <CardHeader className="flex flex-row items-center gap-4 pb-3">
                                    <div className={`p-3 rounded-xl bg-white shadow-sm border ${chip.color.split(' ')[2]} group-hover:scale-110 transition-transform`}>
                                        <Icon className={`w-6 h-6 ${chip.color.split(' ')[1]}`} />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                                            {chip.label}
                                        </CardTitle>
                                        <CardDescription className="text-sm mt-1">
                                            {chip.description}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
