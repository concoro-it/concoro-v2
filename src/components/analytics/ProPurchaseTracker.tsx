'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        dataLayer?: Array<Record<string, unknown>>;
        gtag?: (...args: unknown[]) => void;
    }
}

interface ProPurchaseTrackerProps {
    sessionId?: string;
    billingCycle?: 'monthly' | 'yearly';
}

const EVENT_NAME = 'pro_purchase_completed';

export function ProPurchaseTracker({ sessionId, billingCycle }: ProPurchaseTrackerProps) {
    useEffect(() => {
        const dedupeKey = `pro-purchase-tracked:${sessionId ?? 'no-session'}`;

        try {
            if (window.sessionStorage.getItem(dedupeKey) === '1') {
                return;
            }
        } catch {
            // no-op
        }

        const payload = {
            event: EVENT_NAME,
            transaction_id: sessionId ?? null,
            billing_cycle: billingCycle ?? null,
            plan: 'pro',
            page: '/hub/welcome-pro',
        };

        window.dataLayer = window.dataLayer ?? [];
        window.dataLayer.push(payload);

        if (typeof window.gtag === 'function') {
            window.gtag('event', EVENT_NAME, payload);
        }

        try {
            window.sessionStorage.setItem(dedupeKey, '1');
        } catch {
            // no-op
        }
    }, [billingCycle, sessionId]);

    return null;
}
