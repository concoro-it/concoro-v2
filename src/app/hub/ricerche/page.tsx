import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Search, Trash2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSavedSearches } from '@/lib/supabase/queries';
import { deleteSearchAction } from './actions';

export const metadata: Metadata = { title: 'Ricerche Salvate | Dashboard' };

export default async function RicerchePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const savedSearches = await getSavedSearches(supabase, user.id);

    return (
        <div className="container max-w-container mx-auto px-4 py-8">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
                <Link href="/hub/bacheca" className="hover:text-foreground">Dashboard</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">Ricerche salvate</span>
            </nav>

            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <Search className="w-6 h-6 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">
                        Ricerche salvate
                    </h1>
                </div>
                <p className="text-muted-foreground">
                    Hai {savedSearches.length} {savedSearches.length === 1 ? 'ricerca salvata' : 'ricerche salvate'}.
                </p>
            </div>

            {savedSearches.length > 0 ? (
                <div className="grid gap-4">
                    {savedSearches.map((search) => {
                        const filters = search.filters || {};
                        const searchParams = new URLSearchParams();
                        const query = filters.query;
                        if (query) searchParams.set('q', query);
                        if (filters.regioni?.length) searchParams.set('regione', filters.regioni[0]);
                        if (filters.province?.length) searchParams.set('provincia', filters.province[0]);
                        if (filters.settori?.length) searchParams.set('settore', filters.settori[0]);
                        if (filters.tipo_procedura) searchParams.set('tipo_procedura', filters.tipo_procedura);
                        if (filters.ente_slug) searchParams.set('ente_slug', filters.ente_slug);
                        if (filters.stato) searchParams.set('stato', filters.stato);
                        if (filters.sort) searchParams.set('sort', filters.sort);
                        if (filters.published_from) searchParams.set('published_from', filters.published_from);

                        const href = `/concorsi?${searchParams.toString()}`;

                        return (
                            <div key={search.id} className="bg-white border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-semibold text-lg">{search.name || 'Ricerca senza nome'}</h3>

                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {query && <span className="text-xs bg-muted px-2 py-1 rounded-md">Testo: {query}</span>}
                                        {filters.regioni?.map(r => <span key={r} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">{r}</span>)}
                                        {filters.province?.map(p => <span key={p} className="text-xs bg-muted px-2 py-1 rounded-md">{p}</span>)}
                                        {filters.settori?.map(s => <span key={s} className="text-xs bg-secondary px-2 py-1 rounded-md text-secondary-foreground">{s}</span>)}
                                        {filters.tipo_procedura && <span className="text-xs border border-border px-2 py-1 rounded-md">{filters.tipo_procedura}</span>}
                                        {filters.ente_slug && <span className="text-xs border border-border px-2 py-1 rounded-md">Ente: {filters.ente_slug}</span>}
                                        {filters.stato && <span className="text-xs border border-border px-2 py-1 rounded-md">Stato: {filters.stato}</span>}
                                        {filters.sort && <span className="text-xs border border-border px-2 py-1 rounded-md">Ordina: {filters.sort}</span>}
                                        {Object.keys(filters).length === 0 && !query && <span className="text-xs text-muted-foreground">Tutti i concorsi</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-3">Salvata il {new Date(search.created_at).toLocaleDateString('it-IT')}</p>
                                </div>
                                <div className="flex gap-2 self-start sm:self-auto">
                                    <Link href={href} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                                        Vai ai risultati
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                    <form action={deleteSearchAction.bind(null, search.id)}>
                                        <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-destructive/10 hover:text-destructive h-9 px-3">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 border border-dashed border-border rounded-xl bg-surface">
                    <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-lg font-medium">Nessun criterio salvato</p>
                    <p className="text-muted-foreground text-sm mt-1 mb-4">
                        Puoi salvare una ricerca direttamente dalla pagina dei risultati.
                    </p>
                    <Link href="/concorsi" className="px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity">
                        Esplora i concorsi
                    </Link>
                </div>
            )}
        </div>
    );
}
