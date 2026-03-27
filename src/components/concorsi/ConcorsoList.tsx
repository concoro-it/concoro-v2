import type { Concorso } from '@/types/concorso';
import { ConcorsoCard, ConcorsoCardSkeleton } from './ConcorsoCard';

interface Props {
    concorsi: Concorso[];
    loading?: boolean;
    savedIds?: string[];
    detailBasePath?: string;
}

export function ConcorsoList({ concorsi, loading, savedIds, detailBasePath }: Props) {
    const hasSavedState = Array.isArray(savedIds);
    const savedIdsSet = hasSavedState ? new Set(savedIds) : null;

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <ConcorsoCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (concorsi.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-2xl mb-2">🔍</p>
                <h3 className="font-semibold text-lg mb-2">Nessun concorso trovato</h3>
                <p className="text-muted-foreground text-sm">
                    Prova a modificare i filtri o effettua una nuova ricerca.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {concorsi.map(c => (
                <ConcorsoCard
                    key={c.concorso_id}
                    concorso={c}
                    saved={savedIdsSet ? savedIdsSet.has(c.concorso_id) : undefined}
                    disableSaveStatusAutoCheck={hasSavedState}
                    detailBasePath={detailBasePath}
                />
            ))}
        </div>
    );
}
