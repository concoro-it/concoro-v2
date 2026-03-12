'use client';

import { useEffect, useState } from 'react';
import { buildConsentUpdate, CONSENT_STORAGE_KEY, type ConsentState } from '@/lib/analytics/consent';

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

export function ConsentBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        try {
            const savedConsent = window.localStorage.getItem(CONSENT_STORAGE_KEY);
            if (savedConsent === 'granted' || savedConsent === 'denied') {
                return;
            }
            setIsVisible(true);
        } catch {
            setIsVisible(true);
        }
    }, []);

    const updateConsent = (consentState: ConsentState) => {
        try {
            window.localStorage.setItem(CONSENT_STORAGE_KEY, consentState);
        } catch {}

        window.gtag?.('consent', 'update', buildConsentUpdate(consentState));
        setIsVisible(false);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200 bg-white/95 p-4 shadow-[0_-16px_40px_-20px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Preferenze cookie</p>
                    <p className="mt-1">
                        Usiamo cookie analitici per misurare le performance del sito. Puoi accettare o rifiutare in qualsiasi momento.
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={() => updateConsent('denied')}
                        className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        Rifiuta
                    </button>
                    <button
                        type="button"
                        onClick={() => updateConsent('granted')}
                        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                        Accetta
                    </button>
                </div>
            </div>
        </div>
    );
}
