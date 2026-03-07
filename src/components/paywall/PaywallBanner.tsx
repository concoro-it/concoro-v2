import Link from 'next/link';
import { Lock } from 'lucide-react';

interface Props {
    lockedCount: number;
    isLoggedIn: boolean;
}

export function PaywallBanner({ lockedCount, isLoggedIn }: Props) {
    return (
        <div className="relative rounded-xl p-8 text-center z-20">
            <div className="flex justify-center mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-primary" />
                </div>
            </div>
            <h3 className="font-semibold text-base mb-1">
                {isLoggedIn
                    ? `Sblocca altri ${lockedCount} concorsi`
                    : `Accedi per vedere altri ${lockedCount} concorsi`}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
                {isLoggedIn
                    ? 'Passa a Concoro Pro per accesso illimitato, ricerche salvate e AI Assistant.'
                    : 'Registrati gratuitamente o accedi per scoprire tutti i concorsi disponibili.'}
            </p>
            {isLoggedIn ? (
                <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                    Passa a Pro — €9,90/mese
                </Link>
            ) : (
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Link
                        href="/signup"
                        className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Registrati gratis
                    </Link>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
                    >
                        Accedi
                    </Link>
                </div>
            )}
        </div>
    );
}

export function BlurredResultsSection({ concorsi, lockedCount, isLoggedIn }: {
    concorsi: any[]; // Using any to avoid complex circular dependencies for now, or import properly
    lockedCount: number;
    isLoggedIn: boolean;
}) {
    const { ConcorsoList } = require('@/components/concorsi/ConcorsoList');

    return (
        <div className="relative mt-8 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-8 overflow-hidden">
            <PaywallBanner lockedCount={lockedCount} isLoggedIn={isLoggedIn} />

            <div className="pointer-events-none select-none blur-sm opacity-60 -mx-4 sm:-mx-8 -mb-4 sm:-mb-8">
                <div className="p-4 sm:p-8 pt-0">
                    <ConcorsoList concorsi={concorsi.slice(0, 3)} />
                </div>
            </div>
        </div>
    );
}
