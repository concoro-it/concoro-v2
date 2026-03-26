'use client';

import React from 'react';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { GlowingEffect } from './GlowingEffect';
import Link from 'next/link';

export function ProAccountCTA({ className }: { className?: string }) {
    return (
        <div className={cn("group relative", className)}>
            <GlowingEffect glowColor="bg-blue-500/20" />
            <div className="relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />

                <div className="relative space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Passa a Pro</h3>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Sblocca il pieno potenziale di Concoro e non perdere mai un&apos;opportunità.
                    </p>

                    <ul className="space-y-2.5">
                        {[
                            'Accesso a tutti i risultati',
                            'Filtri avanzati per settori',
                            'Notifiche quotidiane via email',
                            'Dashboard personalizzata'
                        ].map((benefit, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                {benefit}
                            </li>
                        ))}
                    </ul>

                    <Link
                        href="/prezzi"
                        className="flex items-center justify-between w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all group/btn"
                    >
                        Inizia Ora
                        <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
