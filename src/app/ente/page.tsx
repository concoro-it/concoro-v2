import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getEntiWithCount } from '@/lib/supabase/queries';

export const metadata: Metadata = {
    title: 'Concorsi Pubblici per Ente | Cerca bandi per amministrazione | Concoro',
    description: 'Cerca i concorsi pubblici per ente e consulta i bandi delle singole amministrazioni. Utile se sai gia quali enti vuoi monitorare.',
};

export const revalidate = 3600;

export default async function EnteIndexPage() {
    const supabase = await createClient();
    const enti = await getEntiWithCount(supabase);

    return (
        <div className="container max-w-container mx-auto px-4 py-8">
            <div className="mb-8">
                <nav className="text-sm text-muted-foreground mb-4">
                    <Link href="/" className="hover:text-foreground">Home</Link>
                    {' › '}
                    <span className="text-foreground">Enti</span>
                </nav>
                <h1 className="text-3xl font-bold tracking-tight">Concorsi pubblici per ente</h1>
                <p className="text-muted-foreground mt-1">Seleziona un ente per vedere i bandi attivi e capire subito quali amministrazioni pubblicano di piu</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {enti.map(({ ente_nome, ente_slug, count }) => (
                    <Link
                        key={ente_slug}
                        href={`/ente/${ente_slug}`}
                        className="flex flex-col items-start p-4 rounded-xl border border-border bg-white hover:shadow-md hover:border-primary/20 transition-all group"
                    >
                        <Building2 className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-semibold leading-tight line-clamp-2">{ente_nome || ente_slug}</span>
                        <span className="text-xs text-muted-foreground mt-1">{count} aperti</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
