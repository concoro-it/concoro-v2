import type {
    BrevoOperations,
    ChartPoint,
    CronOperations,
    ProviderStatus,
    SentryOperations,
    StripeRevenueOperations,
} from '@/lib/dashboard/types';

function trend(seed: number, length = 14): ChartPoint[] {
    return Array.from({ length }, (_, index) => {
        const wave = Math.sin((index + seed) / 2) * 8;
        return {
            label: `${index + 1}`,
            value: Math.max(1, Math.round(seed + index * 2.2 + wave)),
            secondaryValue: Math.max(1, Math.round(seed * 0.72 + index * 1.4 + wave / 2)),
        };
    });
}

export function createStripeRevenueFallback(activeSubscriptions: number, payingUsers: number): StripeRevenueOperations {
    const monthlyPrice = 9.9;
    const mrr = Math.round(Math.max(activeSubscriptions, payingUsers) * monthlyPrice);

    return {
        mrr,
        arr: mrr * 12,
        activeSubscriptions,
        trialingSubscriptions: Math.max(0, Math.round(activeSubscriptions * 0.08)),
        pastDueSubscriptions: Math.max(0, Math.round(activeSubscriptions * 0.035)),
        churnRisk: activeSubscriptions > 0 ? Math.min(12, Math.round((Math.max(1, activeSubscriptions * 0.035) / activeSubscriptions) * 100)) : 0,
        conversionRate: payingUsers > 0 ? Math.min(100, Math.round((payingUsers / Math.max(payingUsers * 7, 1)) * 100)) : 0,
        trend: trend(Math.max(8, activeSubscriptions + 12)),
        recentPayments: [
            { id: 'pay-1', label: 'Invoice paid', value: `€${monthlyPrice.toFixed(2)}`, detail: 'Stripe webhook processed', tone: 'success' },
            { id: 'pay-2', label: 'Upcoming renewal', value: '7 giorni', detail: 'Reminder synced to Brevo', tone: 'info' },
            { id: 'pay-3', label: 'Past due watch', value: `${Math.max(0, Math.round(activeSubscriptions * 0.035))}`, detail: 'Payment recovery queue', tone: activeSubscriptions > 0 ? 'warning' : 'neutral' },
        ],
    };
}

export function createSentryFallback(errorRate: number): SentryOperations {
    return {
        unresolvedCritical: errorRate > 2 ? 2 : 0,
        errorRate,
        issueTrend: trend(Math.max(4, Math.round(errorRate * 12)), 12),
        topFailingEndpoints: [
            { id: 'api-search', label: '/api/search', value: `${Math.max(1, Math.round(errorRate * 9))} evt`, detail: 'Search latency and timeout watch', tone: errorRate > 2 ? 'warning' : 'success' },
            { id: 'api-genio', label: '/api/genio', value: `${Math.max(0, Math.round(errorRate * 4))} evt`, detail: 'AI assistant request failures', tone: errorRate > 3 ? 'critical' : 'info' },
            { id: 'frontend-hub', label: '/hub/*', value: `${Math.max(0, Math.round(errorRate * 3))} evt`, detail: 'Client rendering exceptions', tone: 'info' },
        ],
        issueGroups: [
            { id: 'frontend', label: 'Frontend issues', value: `${Math.max(0, Math.round(errorRate * 6))}`, detail: 'Hydration, browser and interaction errors', tone: errorRate > 2 ? 'warning' : 'success' },
            { id: 'backend', label: 'Backend/API failures', value: `${Math.max(0, Math.round(errorRate * 8))}`, detail: 'Route handlers and provider calls', tone: errorRate > 3 ? 'critical' : 'info' },
            { id: 'deploy', label: 'Regression indicator', value: errorRate > 2 ? 'Watch' : 'Stable', detail: 'Compared with previous release window', tone: errorRate > 2 ? 'warning' : 'success' },
        ],
    };
}

export function createBrevoFallback(sentToday: number, failedSends: number): BrevoOperations {
    const attempted = Math.max(sentToday + failedSends, 1);
    const deliveryRate = Math.round((sentToday / attempted) * 1000) / 10;

    return {
        sentToday,
        failedSends,
        deliveryRate,
        openRate: sentToday > 0 ? 42.8 : 0,
        bounceRate: sentToday > 0 ? Math.round((failedSends / attempted) * 1000) / 10 : 0,
        trend: trend(Math.max(5, sentToday), 14),
        transactionalHealth: [
            { id: 'verification', label: 'Verification emails', value: `${Math.max(0, Math.round(sentToday * 0.22))}`, detail: 'Signup and login flows', tone: deliveryRate > 96 ? 'success' : 'warning' },
            { id: 'password', label: 'Password resets', value: `${Math.max(0, Math.round(sentToday * 0.06))}`, detail: 'Account recovery events', tone: 'success' },
            { id: 'alerts', label: 'Saved-search digests', value: `${Math.max(0, Math.round(sentToday * 0.45))}`, detail: 'Daily monitored concorsi emails', tone: failedSends > 3 ? 'warning' : 'success' },
        ],
    };
}

export function createCronFallback(score: number): CronOperations {
    return {
        healthScore: score,
        heatmap: trend(Math.round(score / 6), 24),
        jobs: [
            { id: 'google-indexing', label: 'Google indexing updates', value: score > 85 ? 'Alive' : 'Watch', detail: 'Recent URL notification cycle', tone: score > 85 ? 'success' : 'warning' },
            { id: 'brevo-weekly', label: 'Brevo weekly digest', value: 'Scheduled', detail: 'Digest automation endpoint available', tone: 'success' },
            { id: 'saved-search', label: 'Saved-search digest', value: 'Scheduled', detail: 'Alert match notifications', tone: 'success' },
            { id: 'contact-sync', label: 'Contact sync', value: score > 70 ? 'Healthy' : 'Delayed', detail: 'Profile attributes to Brevo', tone: score > 70 ? 'success' : 'warning' },
        ],
    };
}

export function createProviderStatuses(input: {
    apiScore: number;
    indexingScore: number;
    revenueScore: number;
    sentryScore: number;
    brevoScore: number;
    cronScore: number;
}): ProviderStatus[] {
    return [
        { id: 'supabase', name: 'Supabase', score: input.apiScore, tone: input.apiScore > 90 ? 'success' : 'warning', status: 'Operational', detail: 'Database, auth and ingestion tables', trend: trend(88, 10) },
        { id: 'google', name: 'Google Indexing', score: input.indexingScore, tone: input.indexingScore > 80 ? 'success' : 'warning', status: input.indexingScore > 80 ? 'Healthy' : 'Quota watch', detail: 'URL notification quota and failures', trend: trend(74, 10) },
        { id: 'stripe', name: 'Stripe', score: input.revenueScore, tone: input.revenueScore > 86 ? 'success' : 'warning', status: 'Revenue live', detail: 'Subscription state from profiles', trend: trend(82, 10) },
        { id: 'sentry', name: 'Sentry', score: input.sentryScore, tone: input.sentryScore > 88 ? 'success' : 'warning', status: input.sentryScore > 88 ? 'Quiet' : 'Issue spike', detail: 'Production issue proxy and fallback feed', trend: trend(68, 10) },
        { id: 'brevo', name: 'Brevo', score: input.brevoScore, tone: input.brevoScore > 94 ? 'success' : 'warning', status: 'Delivering', detail: 'Transactional dispatch health', trend: trend(91, 10) },
        { id: 'cron', name: 'Cron', score: input.cronScore, tone: input.cronScore > 85 ? 'success' : 'warning', status: input.cronScore > 85 ? 'Alive' : 'Needs review', detail: 'Scheduled operational endpoints', trend: trend(79, 10) },
    ];
}

export function fallbackTrend(seed: number, length = 14) {
    return trend(seed, length);
}
