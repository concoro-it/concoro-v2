'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PLANS } from '@/lib/stripe/prices';

interface UpgradeModalProps {
    children?: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    triggerClassName?: string;
}

export function UpgradeModal({
    children,
    isOpen,
    onOpenChange,
    triggerClassName,
}: UpgradeModalProps) {
    const router = useRouter();
    const [internalOpen, setInternalOpen] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

    const isControlled = isOpen !== undefined;
    const open = isControlled ? isOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;

    const monthlyPrice = PLANS.pro.price_monthly;
    const yearlyPrice = PLANS.pro.price_yearly;
    const yearlyMonthlyEquivalent = yearlyPrice / 12;
    const yearlySavings = Math.round((1 - yearlyMonthlyEquivalent / monthlyPrice) * 100);
    const ctaPrice = billingCycle === 'yearly'
        ? `€${yearlyMonthlyEquivalent.toFixed(2).replace('.', ',')}/mese`
        : `€${monthlyPrice.toFixed(2).replace('.', ',')}/mese`;

    const features = PLANS.pro.features;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && (
                <DialogTrigger asChild>
                    <div className={cn('cursor-pointer', triggerClassName)}>
                        {children}
                    </div>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border-4 border-white/20" />
                        <div className="absolute bottom-10 -left-10 w-20 h-20 rounded-full border-2 border-white/20" />
                        <div className="absolute top-20 left-1/2 w-4 h-4 rounded-full bg-white/40" />
                    </div>

                    <DialogHeader className="relative z-10 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0 flex items-center gap-1 backdrop-blur-sm">
                                <Sparkles className="w-3.5 h-3.5" />
                                Concoro Pro
                            </Badge>
                        </div>
                        <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                            Non perdere il concorso giusto per te
                        </DialogTitle>
                        <DialogDescription className="text-blue-100 text-sm sm:text-base mt-2">
                            Sblocca monitoraggio completo, alert mirati e Genio per capire piu in fretta su quali bandi conviene agire.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 bg-white">
                    <div className="space-y-4 mb-6">
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-start gap-3 flex-wrap">
                                <div className="mt-0.5 flex-shrink-0 bg-blue-100 p-1 rounded-full text-blue-600">
                                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                </div>
                                <span className="text-sm font-medium text-slate-700">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
                        <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                            <button
                                type="button"
                                onClick={() => setBillingCycle('yearly')}
                                className={cn(
                                    'rounded-md px-3 py-2 text-sm font-semibold transition',
                                    billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                                )}
                            >
                                Annuale
                            </button>
                            <button
                                type="button"
                                onClick={() => setBillingCycle('monthly')}
                                className={cn(
                                    'rounded-md px-3 py-2 text-sm font-semibold transition',
                                    billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                                )}
                            >
                                Mensile
                            </button>
                        </div>

                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Piano Pro</p>
                                {billingCycle === 'yearly' && (
                                    <p className="text-xs text-emerald-600 font-semibold mt-1">
                                        Miglior scelta per monitorare i concorsi tutto l&apos;anno
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="flex items-baseline gap-1 justify-end">
                                    <span className="text-xl font-bold text-blue-600">
                                        {billingCycle === 'yearly'
                                            ? `€${yearlyMonthlyEquivalent.toFixed(2).replace('.', ',')}`
                                            : `€${monthlyPrice.toFixed(2).replace('.', ',')}`}
                                    </span>
                                    <span className="text-xs text-slate-500">/mese</span>
                                </div>
                                {billingCycle === 'yearly' && (
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Fatturato annualmente (€{yearlyPrice.toFixed(2).replace('.', ',')})
                                    </p>
                                )}
                                {billingCycle === 'monthly' && (
                                    <p className="text-xs text-slate-500 mt-0.5">Fatturato mensilmente</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            className="w-full text-base font-semibold h-12 shadow-md shadow-blue-500/20"
                            onClick={() => {
                                setOpen(false);
                                router.push(`/pricing?billing=${billingCycle}&source=upgrade-modal`);
                            }}
                        >
                            Attiva Pro da {ctaPrice}
                            <Zap className="w-4 h-4 ml-2 fill-current" />
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full text-sm h-11 border-slate-200"
                            onClick={() => setOpen(false)}
                        >
                            Continua con Free
                        </Button>
                    </div>

                    <div className="mt-4 flex items-center gap-2 justify-center text-xs text-slate-500">
                        <Lock className="w-3 h-3" />
                        <span>Pagamento sicuro con Stripe. Disdici quando vuoi.</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
