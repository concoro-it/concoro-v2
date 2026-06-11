'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { GenioMatchCard } from '@/components/genio/GenioMatchCard';
import { Button } from '@/components/ui/button';
import { matchGenioProfile } from '@/lib/genio/client';
import { normalizeGenioProfile } from '@/lib/genio/normalize';
import type { GenioMatchResponse, GenioProfileInput } from '@/types/genio';
import type { Profile } from '@/types/profile';

interface GenioMatchTestClientProps {
    profile: Partial<Profile> | null;
}

export function GenioMatchTestClient({ profile }: GenioMatchTestClientProps) {
    const [data, setData] = useState<GenioMatchResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    const profileInput = useMemo<GenioProfileInput>(() => {
        const source = profile ?? {};
        return {
            ...source,
            profile: source.profilo_professionale,
            current_sector: source.current_sector ?? source.settori_interesse?.[0] ?? source.preferred_settori?.[0] ?? null,
            contract_type: source.contract_type ?? null,
            skills: source.skills ?? [],
            preferred_regioni: source.preferred_regioni ?? (source.regione_interesse ? [source.regione_interesse] : []),
            preferred_job_families: source.preferred_job_families ?? [],
            is_public_employee: source.public_admin_experience ?? false,
            willing_to_relocate: source.disponibilita_mobilita ?? false,
            exclude_mobility: source.exclude_mobility ?? false,
        };
    }, [profile]);

    const normalizedProfile = useMemo(() => normalizeGenioProfile(profileInput), [profileInput]);

    const runMatch = async () => {
        setIsLoading(true);
        setError(false);

        try {
            const result = await matchGenioProfile(profileInput, { matchCount: 10 });
            setData(result);
        } catch {
            setData(null);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void runMatch();
    }, []);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-4xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/hub/genio">
                            <ArrowLeft className="h-4 w-4" />
                            Genio
                        </Link>
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => void runMatch()} disabled={isLoading}>
                        <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                        Riprova
                    </Button>
                </div>

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Genio V2</p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Matching profilo utente</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                        Questa pagina invia il tuo profilo Concoro normalizzato all&apos;API interna <code className="rounded bg-slate-100 px-1 py-0.5">/api/genio/match</code>.
                    </p>
                    <div className="mt-4 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-2">
                        <span><strong>Profilo:</strong> {normalizedProfile.profile || 'Non impostato'}</span>
                        <span><strong>Settore:</strong> {normalizedProfile.current_sector || 'Non impostato'}</span>
                        <span><strong>Regioni:</strong> {normalizedProfile.preferred_regioni.join(', ') || 'Non impostate'}</span>
                        <span><strong>Competenze:</strong> {normalizedProfile.skills.join(', ') || 'Non impostate'}</span>
                    </div>
                </section>

                {isLoading && (
                    <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                        Analisi del profilo in corso…
                    </div>
                )}

                {!isLoading && error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-800">
                        Non siamo riusciti a completare l’analisi. Riprova tra poco.
                    </div>
                )}

                {!isLoading && !error && data && data.results.length === 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                        Nessun concorso compatibile trovato al momento.
                    </div>
                )}

                {!isLoading && !error && data && data.results.length > 0 && (
                    <div className="space-y-3">
                        {data.results.map((result) => (
                            <GenioMatchCard key={`${result.concorso_id}_${result.rank}`} result={result} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
