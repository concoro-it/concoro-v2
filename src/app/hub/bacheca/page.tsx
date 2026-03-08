import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { getSavedConcorsi } from '@/lib/supabase/queries';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import { BookmarkIcon, Search, Settings, CreditCard, Crown } from 'lucide-react';
import ItalyMapDashboard from '@/components/dashboard/ItalyMapDashboard';

export const metadata: Metadata = { title: 'Bacheca | Dashboard' };

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const [tier, savedConcorsi, profile] = await Promise.all([
        getUserTier(supabase),
        getSavedConcorsi(supabase, user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
    ]);

    const profileData = profile.data;

    return (
        <div className="container max-w-container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Ciao, {profileData?.full_name?.split(' ')[0] ?? 'utente'} 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Piano: {' '}
                        <span className={`font-semibold ${tier === 'pro' ? 'text-primary' : 'text-muted-foreground'}`}>
                            {tier === 'pro' ? '🌟 Pro' : tier === 'admin' ? '⚡ Admin' : '✦ Gratuito'}
                        </span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/hub/profile" className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors">
                        <Settings className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Italy Map Dashboard Section */}
            <div className="mb-12">
                <ItalyMapDashboard />
            </div>

            {/* Stats cards - Keeping these for quick access but they could be integrated later */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                <Link href="/hub/salvati" className="bg-white border border-border rounded-xl p-4 hover:border-primary/50 transition-colors block">
                    <BookmarkIcon className="w-5 h-5 text-primary mb-2" />
                    <p className="text-2xl font-bold">{savedConcorsi.length}</p>
                    <p className="text-sm text-muted-foreground">Concorsi salvati</p>
                </Link>
                <Link href="/hub/ricerche" className="bg-white border border-border rounded-xl p-4 hover:border-primary/50 transition-colors block">
                    <Search className="w-5 h-5 text-primary mb-2" />
                    <p className="text-2xl font-bold">—</p>
                    <p className="text-sm text-muted-foreground">Ricerche salvate</p>
                </Link>
                <div className="bg-white border border-border rounded-xl p-4 flex flex-col">
                    <CreditCard className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm font-semibold">{tier === 'pro' ? 'Piano Pro' : 'Piano Gratuito'}</p>
                    {tier !== 'pro' && (
                        <Link href="/pricing" className="mt-auto text-xs text-primary hover:underline font-medium">
                            Passa a Pro →
                        </Link>
                    )}
                </div>
            </div>

            {/* Upgrade CTA if free */}
            {tier !== 'pro' && tier !== 'admin' && (
                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 mb-8 flex items-center gap-4">
                    <Crown className="w-8 h-8 text-primary flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-semibold">Passa a Concoro Pro</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Accesso illimitato, ricerche salvate, AI Assistant Genio e tanto altro.
                        </p>
                    </div>
                    <Link href="/pricing"
                        className="flex-shrink-0 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity">
                        Abbonati
                    </Link>
                </div>
            )}

            {/* Saved concorsi */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">I tuoi concorsi salvati</h2>
                    <Link href="/hub/salvati" className="text-sm text-primary hover:underline">Vedi tutti</Link>
                </div>
                {savedConcorsi.length > 0
                    ? <ConcorsoList
                        concorsi={savedConcorsi.slice(0, 3)}
                        savedIds={savedConcorsi.slice(0, 3).map((concorso) => concorso.concorso_id)}
                        detailBasePath="/hub/concorsi"
                    />
                    : (
                        <div className="text-center py-10 border border-dashed border-border rounded-xl">
                            <BookmarkIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground text-sm">Nessun concorso salvato ancora</p>
                            <Link href="/concorsi" className="text-sm text-primary hover:underline mt-1 inline-block">
                                Esplora i concorsi →
                            </Link>
                        </div>
                    )
                }
            </div>
        </div>
    );
}
