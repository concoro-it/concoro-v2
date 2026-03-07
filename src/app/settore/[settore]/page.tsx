import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { createClient, createStaticClient } from '@/lib/supabase/server';
import { getConcorsi, getConcorsiBySettore, getSettoriWithCount } from '@/lib/supabase/queries';
import { getUserTier } from '@/lib/auth/getUserTier';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import { PaywallBanner, BlurredResultsSection } from '@/components/paywall/PaywallBanner';
import { toUrlSlug } from '@/lib/utils/regioni';

const FREE_VISIBLE = 5;

interface Props {
    params: Promise<{ settore: string }>;
    searchParams: Promise<{ stato?: string; page?: string }>;
}

const STATO_OPTIONS = [
    { value: 'aperti', label: 'Aperti' },
    { value: 'scaduti', label: 'Scaduti' },
];

export async function generateStaticParams() {
    const supabase = createStaticClient();
    const settori = await getSettoriWithCount(supabase);
    return settori.map(({ settore }) => ({
        settore: toUrlSlug(settore),
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { settore: slug } = await params;
    const supabase = createStaticClient();
    const settori = await getSettoriWithCount(supabase);
    const originalSettore = settori.find(s => toUrlSlug(s.settore) === slug)?.settore || slug;

    return {
        title: `Concorsi pubblici — ${originalSettore}`,
        description: `Trova concorsi pubblici nel settore ${originalSettore}. Aggiornati dal portale InPA.`,
    };
}

export const revalidate = 86400;

export default async function SettorePage({ params, searchParams }: Props) {
    const { settore: slug } = await params;

    const supabase = await createClient();
    const settori = await getSettoriWithCount(supabase);
    const originalSettore = settori.find(s => toUrlSlug(s.settore) === slug)?.settore;

    if (!originalSettore) {
        return (
            <div className="container py-12 text-center text-muted-foreground">
                Settore non trovato.
            </div>
        );
    }

    const paramsObj = await searchParams;
    const stato = paramsObj.stato ?? 'aperti';
    const page = parseInt(paramsObj.page ?? '1', 10);
    const LIMIT = 20;

    const [{ data: concorsi, count }, tier] = await Promise.all([
        getConcorsi(supabase, { settore: originalSettore, stato: stato as any }, page, LIMIT),
        getUserTier(supabase),
    ]);

    const isLocked = tier !== 'pro' && tier !== 'admin';
    const visible = concorsi.slice(0, FREE_VISIBLE);
    const locked = concorsi.slice(FREE_VISIBLE);

    function buildUrl(newStato: string) {
        return `/settore/${slug}?stato=${newStato}`;
    }

    return (
        <div className="container max-w-container mx-auto px-4 py-8">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
                <Link href="/" className="hover:text-foreground">Home</Link>
                <ChevronRight className="w-4 h-4" />
                <Link href="/settore" className="hover:text-foreground">Settori</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">{originalSettore}</span>
            </nav>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">
                    Concorsi — {originalSettore}
                    <span className="ml-3 text-lg font-normal text-muted-foreground">({count})</span>
                </h1>
            </div>

            {/* Stato filter */}
            <div className="flex items-center gap-2 mb-8 pb-6 border-b border-border">
                <label className="text-sm font-medium">Stato:</label>
                <div className="flex gap-1">
                    {STATO_OPTIONS.map(opt => (
                        <Link key={opt.value} href={buildUrl(opt.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${stato === opt.value
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-white border-border hover:bg-secondary'
                                }`}>
                            {opt.label}
                        </Link>
                    ))}
                </div>
            </div>
            <ConcorsoList concorsi={visible} />
            {isLocked && locked.length > 0 && (
                <BlurredResultsSection
                    concorsi={locked}
                    lockedCount={locked.length}
                    isLoggedIn={tier !== 'anon'}
                />
            )}
            {!isLocked && locked.length > 0 && <ConcorsoList concorsi={locked} />}
        </div>
    );
}
