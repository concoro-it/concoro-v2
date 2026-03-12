'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Crown, Sparkles } from 'lucide-react';
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
import { cn } from '@/lib/utils/cn';

interface UpgradeProModalProps {
    children?: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    triggerClassName?: string;
}

const proFeatures = [
    'Salva preset illimitati e riusali in un click.',
    'Mantieni filtri avanzati (ente, procedura, ordinamento).',
    'Ottieni una ricerca piu veloce e focalizzata ogni giorno.',
];

export function UpgradeProModal({
    children,
    isOpen,
    onOpenChange,
    triggerClassName,
}: UpgradeProModalProps) {
    const router = useRouter();
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = isOpen !== undefined;
    const open = isControlled ? isOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && (
                <DialogTrigger asChild>
                    <div className={cn('cursor-pointer', triggerClassName)}>
                        {children}
                    </div>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[560px] overflow-hidden border-0 bg-transparent p-0 shadow-none">
                <div className="relative border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-100/70 shadow-2xl shadow-amber-900/10">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full bg-amber-300/35 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-orange-300/30 blur-3xl" />

                    <div className="relative border-b border-amber-200/70 px-6 py-6 sm:px-7">
                        <DialogHeader className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className="rounded-full border-0 bg-slate-900 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-white hover:bg-slate-900">
                                    <Crown className="mr-1.5 h-3.5 w-3.5" />
                                    Pro Upgrade
                                </Badge>
                                <Badge variant="secondary" className="border border-amber-200 bg-white/80 text-amber-800">
                                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                                    Salva preset
                                </Badge>
                            </div>
                            <DialogTitle className="text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
                                Sblocca Salva preset con Pro
                            </DialogTitle>
                            <DialogDescription className="max-w-xl text-sm text-slate-700 sm:text-base">
                                Hai gia un account. Passa a Pro per salvare le ricerche migliori e ripartire subito dai filtri che funzionano.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="relative space-y-4 p-6 sm:px-7 sm:pb-7">
                        <div className="space-y-3 rounded-2xl border border-amber-200/70 bg-white/80 p-4 sm:p-5">
                            {proFeatures.map((feature) => (
                                <div key={feature} className="flex items-start gap-3">
                                    <div className="mt-0.5 rounded-full bg-amber-100 p-1 text-amber-700">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-800">{feature}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Button
                                className="h-12 w-full rounded-xl bg-slate-900 text-base font-semibold text-white shadow-md shadow-slate-900/20 hover:bg-slate-800"
                                onClick={() => {
                                    setOpen(false);
                                    router.push('/pricing?billing=yearly&source=upgrade-pro-modal');
                                }}
                            >
                                Passa a Pro
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 w-full rounded-xl border-amber-200 bg-white/80 text-sm text-slate-700 hover:bg-white"
                                onClick={() => setOpen(false)}
                            >
                                Continua senza Pro
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
