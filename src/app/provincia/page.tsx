import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getProvinceWithCount } from '@/lib/supabase/queries';
import { toUrlSlug } from '@/lib/utils/regioni';

export const metadata: Metadata = {
    title: 'Concorsi per Provincia',
    description: 'Cerca concorsi pubblici per provincia italiana. Trova i bandi aperti nella tua provincia.',
};

export const revalidate = 3600;

export default async function ProvinciaIndexPage() {
    const supabase = await createClient();
    const province = await getProvinceWithCount(supabase);

    return (
        <div className="container max-w-container mx-auto px-4 py-8">
            <div className="mb-8">
                <nav className="text-sm text-muted-foreground mb-4">
                    <Link href="/" className="hover:text-foreground">Home</Link>
                    {' › '}
                    <span className="text-foreground">Province</span>
                </nav>
                <h1 className="text-3xl font-bold tracking-tight">Concorsi per Provincia</h1>
                <p className="text-muted-foreground mt-1">Trova i concorsi pubblici nella tua provincia italiana</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {province.map(({ provincia, sigla, count }) => (
                    <Link key={provincia} href={`/provincia/${toUrlSlug(provincia)}`}
                        className="flex flex-col items-center justify-center p-5 rounded-xl border border-border bg-white hover:shadow-md hover:border-primary/20 transition-all text-center group">
                        <MapPin className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-semibold leading-tight">{provincia} {sigla ? `(${sigla})` : ''}</span>
                        <span className="text-xs text-muted-foreground mt-1">{count} aperti</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
