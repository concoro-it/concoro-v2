import { cache } from 'react';
import { getDashboardDateRanges } from '@/lib/dashboard/date-ranges';
import {
    getCoreAggregation,
    getEmailDispatchCounts,
    getGoogleIndexingOperations,
    getRecentTimelineEvents,
    getSupabaseOperations,
    percentage,
} from '@/lib/dashboard/aggregations';
import {
    createBrevoFallback,
    createCronFallback,
    createProviderStatuses,
    createSentryFallback,
    createStripeRevenueFallback,
    fallbackTrend,
} from '@/lib/dashboard/mock-integrations';
import { createStaticAdminClient } from '@/lib/supabase/server';
import type { AdminDashboardSnapshot, Delta, KpiMetric, OperationalAlert } from '@/lib/dashboard/types';

function delta(label: string, value: number, toneWhenUp: Delta['tone'] = 'success'): Delta {
    const direction: Delta['direction'] = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
    return {
        label,
        value: `${value > 0 ? '+' : ''}${value}`,
        direction,
        tone: direction === 'flat' ? 'neutral' : toneWhenUp,
    };
}

function percentDelta(label: string, value: number, toneWhenUp: Delta['tone'] = 'success'): Delta {
    const direction: Delta['direction'] = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
    return {
        label,
        value: `${value > 0 ? '+' : ''}${value}%`,
        direction,
        tone: direction === 'flat' ? 'neutral' : toneWhenUp,
    };
}

function formatEuro(value: number) {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(value);
}

function scoreFromSignals(signals: number[]) {
    if (signals.length === 0) return 100;
    return Math.max(0, Math.min(100, Math.round(signals.reduce((sum, value) => sum + value, 0) / signals.length)));
}

function buildAlerts(snapshot: Omit<AdminDashboardSnapshot, 'alerts'>): OperationalAlert[] {
    const now = snapshot.generatedAt;
    const alerts: OperationalAlert[] = [];

    if (snapshot.googleIndexing.quotaUsed / Math.max(snapshot.googleIndexing.quotaLimit, 1) > 0.8) {
        alerts.push({
            id: 'google-quota',
            title: 'Google quota near limit',
            description: `${snapshot.googleIndexing.quotaUsed}/${snapshot.googleIndexing.quotaLimit} daily URL notifications consumed.`,
            severity: 'warning',
            source: 'google',
            timestamp: now,
        });
    }

    if (snapshot.supabase.ingestionLatencyMinutes > 240) {
        alerts.push({
            id: 'ingestion-latency',
            title: 'Ingestion latency is high',
            description: `Newest concorso record is ${snapshot.supabase.ingestionLatencyMinutes} minutes old.`,
            severity: snapshot.supabase.ingestionLatencyMinutes > 720 ? 'critical' : 'warning',
            source: 'supabase',
            timestamp: now,
        });
    }

    if (snapshot.supabase.pendingAiIndexing > 250) {
        alerts.push({
            id: 'ai-backlog',
            title: 'AI indexing backlog growing',
            description: `${snapshot.supabase.pendingAiIndexing.toLocaleString('it-IT')} concorsi need AI reindexing.`,
            severity: snapshot.supabase.pendingAiIndexing > 750 ? 'critical' : 'warning',
            source: 'api',
            timestamp: now,
        });
    }

    if (snapshot.sentry.unresolvedCritical > 0) {
        alerts.push({
            id: 'sentry-critical',
            title: 'Critical production issues unresolved',
            description: `${snapshot.sentry.unresolvedCritical} critical issue groups need review.`,
            severity: 'critical',
            source: 'sentry',
            timestamp: now,
        });
    }

    if (snapshot.brevo.deliveryRate < 96 && snapshot.brevo.sentToday > 0) {
        alerts.push({
            id: 'brevo-delivery',
            title: 'Brevo delivery degradation',
            description: `Delivery rate is ${snapshot.brevo.deliveryRate}% across transactional sends today.`,
            severity: 'warning',
            source: 'brevo',
            timestamp: now,
        });
    }

    if (snapshot.stripe.pastDueSubscriptions > 0) {
        alerts.push({
            id: 'stripe-past-due',
            title: 'Payment recovery queue active',
            description: `${snapshot.stripe.pastDueSubscriptions} subscriptions are estimated past due.`,
            severity: 'info',
            source: 'stripe',
            timestamp: now,
        });
    }

    if (alerts.length === 0) {
        alerts.push({
            id: 'all-clear',
            title: 'No critical anomalies detected',
            description: 'Scraping, indexing, revenue, email, and cron signals are inside expected bounds.',
            severity: 'info',
            source: 'api',
            timestamp: now,
        });
    }

    return alerts;
}

export const getAdminDashboardSnapshot = cache(async (): Promise<AdminDashboardSnapshot> => {
    const supabase = createStaticAdminClient();
    const ranges = getDashboardDateRanges();

    const [core, supabaseOps, googleIndexing, emailCounts, timeline] = await Promise.all([
        getCoreAggregation(supabase),
        getSupabaseOperations(supabase),
        getGoogleIndexingOperations(supabase),
        getEmailDispatchCounts(supabase),
        getRecentTimelineEvents(supabase),
    ]);

    const stripe = createStripeRevenueFallback(core.payingUsers, core.payingUsers);
    const brevo = createBrevoFallback(emailCounts.sentToday, emailCounts.failedSends);
    const errorRate = Math.max(0, Math.round((googleIndexing.failedRequestsToday / Math.max(googleIndexing.successfulRequestsToday + googleIndexing.failedRequestsToday, 1)) * 1000) / 10);
    const sentry = createSentryFallback(errorRate);

    const indexingScore = Math.max(0, Math.round(100 - percentage(googleIndexing.failedRequestsToday, Math.max(googleIndexing.quotaUsed, 1)) - percentage(googleIndexing.quotaUsed, googleIndexing.quotaLimit) / 5));
    const brevoScore = Math.round(brevo.deliveryRate);
    const apiScore = Math.max(0, 100 - Math.min(35, Math.round(supabaseOps.ingestionLatencyMinutes / 45)) - Math.min(20, Math.round(supabaseOps.pendingAiIndexing / 100)));
    const sentryScore = Math.max(0, 100 - Math.round(sentry.errorRate * 8) - sentry.unresolvedCritical * 12);
    const revenueScore = Math.max(70, 100 - stripe.pastDueSubscriptions * 5 - Math.round(stripe.churnRisk / 2));
    const cronScore = Math.max(0, Math.round((apiScore + indexingScore + brevoScore) / 3));
    const cron = createCronFallback(cronScore);
    const healthScore = scoreFromSignals([apiScore, indexingScore, brevoScore, sentryScore, revenueScore, cronScore]);

    const scraperSuccess = Math.max(0, Math.min(100, 100 - Math.round(supabaseOps.failedEnrichments / Math.max(core.totalEnti, 1) * 1000) / 10));
    const kpis: KpiMetric[] = [
        {
            id: 'total-users',
            label: 'Total users',
            value: core.totalUsers.toLocaleString('it-IT'),
            helper: 'Registered profiles',
            tone: 'info',
            dailyDelta: delta('today', core.newUsersToday),
            weeklyDelta: delta('7d', core.newUsersWeek),
            monthlyDelta: delta('MTD', core.newUsersMonth),
            trend: core.profileTrend,
        },
        {
            id: 'new-users-today',
            label: 'New users today',
            value: core.newUsersToday.toLocaleString('it-IT'),
            helper: 'Fresh registrations',
            tone: core.newUsersToday > 0 ? 'success' : 'neutral',
            dailyDelta: delta('today', core.newUsersToday),
            weeklyDelta: delta('7d', core.newUsersWeek),
            monthlyDelta: delta('MTD', core.newUsersMonth),
            trend: core.profileTrend,
        },
        {
            id: 'paying-users',
            label: 'Paying users',
            value: core.payingUsers.toLocaleString('it-IT'),
            helper: 'Active/trialing plus pro tier',
            tone: core.payingUsers > 0 ? 'success' : 'warning',
            dailyDelta: delta('today', Math.max(0, Math.round(core.payingUsers * 0.02))),
            weeklyDelta: delta('7d', Math.max(0, Math.round(core.payingUsers * 0.08))),
            monthlyDelta: delta('MTD', Math.max(0, Math.round(core.payingUsers * 0.16))),
            trend: stripe.trend,
        },
        {
            id: 'mrr',
            label: 'MRR',
            value: formatEuro(stripe.mrr),
            helper: 'Estimated subscription revenue',
            tone: stripe.mrr > 0 ? 'success' : 'warning',
            dailyDelta: percentDelta('today', 0),
            weeklyDelta: percentDelta('7d', Math.max(0, Math.round(stripe.conversionRate / 2))),
            monthlyDelta: percentDelta('MTD', Math.max(0, Math.round(stripe.conversionRate))),
            trend: stripe.trend,
        },
        {
            id: 'active-concorsi',
            label: 'Active concorsi',
            value: core.activeConcorsi.toLocaleString('it-IT'),
            helper: 'Open and visible opportunities',
            tone: core.activeConcorsi > 0 ? 'success' : 'critical',
            dailyDelta: delta('today', core.newConcorsiToday),
            weeklyDelta: delta('7d', core.newConcorsiWeek),
            monthlyDelta: delta('MTD', core.newConcorsiMonth),
            trend: core.concorsiTrend,
        },
        {
            id: 'new-concorsi-today',
            label: 'New concorsi today',
            value: core.newConcorsiToday.toLocaleString('it-IT'),
            helper: 'Fresh ingestion volume',
            tone: core.newConcorsiToday > 0 ? 'success' : 'warning',
            dailyDelta: delta('today', core.newConcorsiToday),
            weeklyDelta: delta('7d', core.newConcorsiWeek),
            monthlyDelta: delta('MTD', core.newConcorsiMonth),
            trend: core.concorsiTrend,
        },
        {
            id: 'new-enti-today',
            label: 'New enti today',
            value: core.newEntiToday.toLocaleString('it-IT'),
            helper: `${core.totalEnti.toLocaleString('it-IT')} enti tracked`,
            tone: 'info',
            dailyDelta: delta('today', core.newEntiToday),
            weeklyDelta: delta('7d', Math.max(core.newEntiToday, Math.round(core.totalEnti * 0.01))),
            monthlyDelta: delta('MTD', Math.max(core.newEntiToday, Math.round(core.totalEnti * 0.03))),
            trend: fallbackTrend(Math.max(4, core.newEntiToday + 6)),
        },
        {
            id: 'api-health',
            label: 'API health score',
            value: `${apiScore}%`,
            helper: 'Supabase, ingestion and API signals',
            tone: apiScore > 85 ? 'success' : 'warning',
            dailyDelta: percentDelta('today', apiScore - 92, apiScore >= 92 ? 'success' : 'warning'),
            weeklyDelta: percentDelta('7d', apiScore - 89, apiScore >= 89 ? 'success' : 'warning'),
            monthlyDelta: percentDelta('MTD', apiScore - 87, apiScore >= 87 ? 'success' : 'warning'),
            trend: fallbackTrend(apiScore),
        },
        {
            id: 'google-indexed',
            label: 'Google indexed pages',
            value: googleIndexing.indexedEstimate.toLocaleString('it-IT'),
            helper: `${googleIndexing.pendingPages.toLocaleString('it-IT')} pending`,
            tone: googleIndexing.failedRequestsToday > 0 ? 'warning' : 'success',
            dailyDelta: delta('today', googleIndexing.successfulRequestsToday),
            weeklyDelta: delta('7d', Math.max(googleIndexing.successfulRequestsToday, Math.round(googleIndexing.indexedEstimate * 0.04))),
            monthlyDelta: delta('MTD', Math.max(googleIndexing.successfulRequestsToday, Math.round(googleIndexing.indexedEstimate * 0.12))),
            trend: googleIndexing.trend,
        },
        {
            id: 'email-delivery',
            label: 'Email delivery %',
            value: `${brevo.deliveryRate}%`,
            helper: `${brevo.sentToday.toLocaleString('it-IT')} sends today`,
            tone: brevo.deliveryRate >= 96 ? 'success' : 'warning',
            dailyDelta: percentDelta('today', Math.round(brevo.deliveryRate - 97), brevo.deliveryRate >= 97 ? 'success' : 'warning'),
            weeklyDelta: percentDelta('7d', -1, 'warning'),
            monthlyDelta: percentDelta('MTD', 2),
            trend: brevo.trend,
        },
        {
            id: 'error-rate',
            label: 'Error rate',
            value: `${sentry.errorRate}%`,
            helper: 'Indexing/API proxy plus Sentry fallback',
            tone: sentry.errorRate > 2 ? 'warning' : 'success',
            dailyDelta: percentDelta('today', Math.round(sentry.errorRate), 'warning'),
            weeklyDelta: percentDelta('7d', -1),
            monthlyDelta: percentDelta('MTD', 0),
            trend: sentry.issueTrend,
        },
        {
            id: 'scraper-success',
            label: 'Scraper success %',
            value: `${scraperSuccess}%`,
            helper: 'Enrichment and ingestion proxy',
            tone: scraperSuccess >= 95 ? 'success' : 'warning',
            dailyDelta: percentDelta('today', Math.round(scraperSuccess - 96), scraperSuccess >= 96 ? 'success' : 'warning'),
            weeklyDelta: percentDelta('7d', Math.round(scraperSuccess - 94), scraperSuccess >= 94 ? 'success' : 'warning'),
            monthlyDelta: percentDelta('MTD', Math.round(scraperSuccess - 93), scraperSuccess >= 93 ? 'success' : 'warning'),
            trend: supabaseOps.ingestionTrend,
        },
    ];

    const partialSnapshot = {
        generatedAt: ranges.now.toISOString(),
        healthScore,
        kpis,
        providers: createProviderStatuses({ apiScore, indexingScore, revenueScore, sentryScore, brevoScore, cronScore }),
        supabase: supabaseOps,
        googleIndexing,
        stripe,
        sentry,
        brevo,
        cron,
        timeline,
    };

    return {
        ...partialSnapshot,
        alerts: buildAlerts(partialSnapshot),
    };
});
