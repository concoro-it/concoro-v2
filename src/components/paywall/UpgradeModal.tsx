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
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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

    const isControlled = isOpen !== undefined;
    const open = isControlled ? isOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;

    const registerFeatures = [
        {
            title: 'Preferenze sempre salvate',
            description: 'Regione, settore e filtri restano sincronizzati sul tuo profilo.',
        },
        {
            title: 'Nuovi bandi in evidenza',
            description: 'Vedi subito i concorsi piu rilevanti senza rifare la ricerca.',
        },
        {
            title: 'Bacheca personale',
            description: 'Continua da mobile o desktop mantenendo lo stesso stato.',
        },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && (
                <DialogTrigger asChild>
                    <div className={cn('cursor-pointer', triggerClassName)}>
                        {children}
                    </div>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[560px] overflow-hidden  border-0 bg-transparent p-0 shadow-none">
                <div className="relative pt-4 border border-sky-100/80 bg-gradient-to-br from-sky-100/85 via-white to-cyan-100/80 backdrop-blur-sm shadow-2xl shadow-slate-900/10">
                    <div className=" pointer-events-none absolute -top-28 -right-24 h-56 w-56 bg-blue-100/60 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 bg-cyan-100/60 blur-3xl" />

                    <div className=" relative border-b border-slate-200/70 px-6 pt-6 sm:px-7">
                        <DialogHeader className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2 animate-slide-up-fade">
                                <Badge className="rounded-3xl border-0 bg-slate-900 text-[11px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-slate-900">
                                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                    Register First
                                </Badge>
                                <Badge variant="secondary" className="border border-sky-200 bg-sky-50 text-sky-700">
                                    Setup rapido
                                </Badge>
                            </div>
                            <DialogTitle className="animate-slide-up-fade delay-100 text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
                                Crea il tuo account gratis e filtra i concorsi meglio
                            </DialogTitle>
                            <DialogDescription className="animate-slide-up-fade delay-300 max-w-xl text-sm text-slate-600 sm:text-base">
                                Registrandoti una volta, le preferenze restano con te: meno tempo perso e piu candidature pertinenti.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="relative space-y-4 p-6 sm:px-7 sm:pb-7">
                        <div className="animate-slide-up-fade delay-300 space-y-3 rounded-2xl border border-slate-200/80 bg-white/75 p-4 sm:p-5">
                            {registerFeatures.map((feature) => (
                                <div key={feature.title} className="flex items-start gap-3">
                                    <div className="mt-0.5 rounded-full bg-sky-100 p-1 text-sky-700">
                                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{feature.title}</p>
                                        <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="animate-slide-up-fade delay-300 rounded-2xl border border-slate-200/80">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Button
                                    className="h-12 w-full rounded-xl text-base font-semibold shadow-md shadow-blue-500/25"
                                    onClick={() => {
                                        setOpen(false);
                                        router.push('/signup?source=preferences-register-modal');
                                    }}
                                >
                                    Registrati gratis
                                    <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-12 w-full rounded-xl border-slate-200 text-sm"
                                    onClick={() => {
                                        setOpen(false);
                                        router.push('/pricing?billing=yearly&source=register-modal-secondary');
                                    }}
                                >
                                    Esplora Pro
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
