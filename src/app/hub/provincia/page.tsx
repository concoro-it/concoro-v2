import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getProvinceWithCount, getRegioniWithCount } from '@/lib/supabase/queries';
import ProvinciaMapExplorer from '@/components/dashboard/ProvinciaMapExplorer';

export const metadata: Metadata = {
    title: 'Province | Dashboard',
    description: 'Esplora i concorsi per provincia dal dashboard.',
};

export const revalidate = 3600;

export default async function HubProvinciaIndexPage() {
    const supabase = await createClient();
    const [regioni, province] = await Promise.all([
        getRegioniWithCount(supabase),
        getProvinceWithCount(supabase),
    ]);

    return (
        <div className="relative overflow-hidden bg-[hsl(210,55%,98%)] text-slate-900 [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
            <div className="container mx-auto max-w-[78rem] px-4 py-10">
                <div className="mb-8">
                    <nav className="mb-4 text-sm text-slate-500">
                        <Link href="/hub/bacheca" className="hover:text-slate-900">Dashboard</Link>
                        {' › '}
                        <span className="text-slate-900">Province</span>
                    </nav>
                </div>

                <section className="mb-6 flex items-center justify-between gap-4">
                    <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl tracking-tight text-slate-900">
                        Mappa provinciale dei bandi
                    </h1>
                    <Link href="/hub/concorsi" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0B4B7F] hover:text-[#083861]">
                        Tutti i concorsi
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </section>

                <ProvinciaMapExplorer regionCounts={regioni} provinces={province} />
            </div>
        </div>
    );
}
