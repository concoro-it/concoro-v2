import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSettoriWithCount } from '@/lib/supabase/queries';
import { toUrlSlug } from '@/lib/utils/regioni';

export const metadata: Metadata = {
    title: 'Settori | Dashboard',
    description: 'Esplora i concorsi per settore dal dashboard.',
};

export const revalidate = 3600;

export default async function HubSettoreIndexPage() {
    const supabase = await createClient();
    const settori = await getSettoriWithCount(supabase);

    return (
        <div className="container max-w-container mx-auto px-4 py-8">
            <div className="mb-8">
                <nav className="text-sm text-muted-foreground mb-4">
                    <Link href="/hub/bacheca" className="hover:text-foreground">Dashboard</Link>
                    {' › '}
                    <span className="text-foreground">Settori</span>
                </nav>
                <h1 className="text-3xl font-bold tracking-tight">Concorsi per Settore</h1>
                <p className="text-muted-foreground mt-1">Scegli il settore di tuo interesse</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {settori.map(({ settore, count }) => (
                    <Link key={settore} href={`/hub/settore/${toUrlSlug(settore)}`}
                        className="flex flex-col items-start p-4 rounded-xl border border-border bg-white hover:shadow-md hover:border-primary/20 transition-all group">
                        <Briefcase className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-semibold leading-tight">{settore}</span>
                        <span className="text-xs text-muted-foreground mt-1">{count} aperti</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
