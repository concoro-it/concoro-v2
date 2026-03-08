import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getRegioniWithCount } from '@/lib/supabase/queries';
import { toUrlSlug } from '@/lib/utils/regioni';

export const metadata: Metadata = {
    title: 'Regioni | Dashboard',
    description: 'Esplora i concorsi per regione dal dashboard.',
};

export const revalidate = 3600;

export default async function HubRegioneIndexPage() {
    const supabase = await createClient();
    const regioni = await getRegioniWithCount(supabase);

    return (
        <div className="container max-w-container mx-auto px-4 py-8">
            <div className="mb-8">
                <nav className="text-sm text-muted-foreground mb-4">
                    <Link href="/hub/bacheca" className="hover:text-foreground">Dashboard</Link>
                    {' › '}
                    <span className="text-foreground">Regioni</span>
                </nav>
                <h1 className="text-3xl font-bold tracking-tight">Concorsi per Regione</h1>
                <p className="text-muted-foreground mt-1">Trova i concorsi pubblici nella tua regione italiana</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {regioni.map(({ regione, count }) => (
                    <Link key={regione} href={`/hub/regione/${toUrlSlug(regione)}`}
                        className="flex flex-col items-center justify-center p-5 rounded-xl border border-border bg-white hover:shadow-md hover:border-primary/20 transition-all text-center group">
                        <MapPin className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-semibold leading-tight">{regione}</span>
                        <span className="text-xs text-muted-foreground mt-1">{count} aperti</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
