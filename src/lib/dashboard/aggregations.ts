import type { SupabaseClient } from '@supabase/supabase-js';
import { formatShortDate, getDashboardDateRanges, toIso } from '@/lib/dashboard/date-ranges';
import { fallbackTrend } from '@/lib/dashboard/mock-integrations';
import type {
    ChartPoint,
    GoogleIndexingOperations,
    SupabaseOperations,
    TableRow,
    TimelineEvent,
} from '@/lib/dashboard/types';

type CountQueryResult = { count: number | null; error: { message: string } | null };
type SupabaseCountQuery = PromiseLike<CountQueryResult> & {
    eq(column: string, value: unknown): SupabaseCountQuery;
    gte(column: string, value: unknown): SupabaseCountQuery;
    lt(column: string, value: unknown): SupabaseCountQuery;
    in(column: string, values: unknown[]): SupabaseCountQuery;
    is(column: string, value: unknown): SupabaseCountQuery;
    not(column: string, operator: string, value: unknown): SupabaseCountQuery;
    ilike(column: string, pattern: string): SupabaseCountQuery;
    or(filters: string): SupabaseCountQuery;
};

async function countRows(
    supabase: SupabaseClient,
    table: string,
    build?: (query: SupabaseCountQuery) => SupabaseCountQuery
): Promise<number> {
    let query = supabase.from(table).select('*', { count: 'exact', head: true }) as unknown as SupabaseCountQuery;
    if (build) query = build(query);
    const { count, error } = await query;
    if (error) {
        console.error(`[admin-dashboard] count failed for ${table}`, error);
        return 0;
    }
    return count ?? 0;
}

async function countConcorsi(
    supabase: SupabaseClient,
    build?: (query: SupabaseCountQuery) => SupabaseCountQuery
) {
    return countRows(supabase, 'concorsi', build);
}

async function countProfiles(
    supabase: SupabaseClient,
    build?: (query: SupabaseCountQuery) => SupabaseCountQuery
) {
    return countRows(supabase, 'profiles', build);
}

async function countEnti(
    supabase: SupabaseClient,
    build?: (query: SupabaseCountQuery) => SupabaseCountQuery
) {
    return countRows(supabase, 'enti', build);
}

function percentage(part: number, total: number) {
    if (total <= 0) return 0;
    return Math.round((part / total) * 1000) / 10;
}

function toneFromCount(value: number, warningThreshold: number, criticalThreshold: number): TableRow['tone'] {
    if (value >= criticalThreshold) return 'critical';
    if (value >= warningThreshold) return 'warning';
    return 'success';
}

async function buildDailyTrend(
    supabase: SupabaseClient,
    table: string,
    dateColumn: string,
    days = 14
): Promise<ChartPoint[]> {
    const today = new Date();
    const points: ChartPoint[] = [];

    for (let index = days - 1; index >= 0; index -= 1) {
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - index);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const value = await countRows(supabase, table, (query) =>
            query.gte(dateColumn, toIso(start)).lt(dateColumn, toIso(end))
        );

        points.push({
            label: formatShortDate(start),
            value,
        });
    }

    return points;
}

export type CoreAggregation = {
    totalUsers: number;
    newUsersToday: number;
    newUsersWeek: number;
    newUsersMonth: number;
    payingUsers: number;
    activeConcorsi: number;
    newConcorsiToday: number;
    newConcorsiWeek: number;
    newConcorsiMonth: number;
    newEntiToday: number;
    totalEnti: number;
    profileTrend: ChartPoint[];
    concorsiTrend: ChartPoint[];
};

export async function getCoreAggregation(supabase: SupabaseClient): Promise<CoreAggregation> {
    const ranges = getDashboardDateRanges();
    const nowIso = toIso(ranges.now);

    const [
        totalUsers,
        newUsersToday,
        newUsersWeek,
        newUsersMonth,
        payingUsers,
        activeConcorsi,
        newConcorsiToday,
        newConcorsiWeek,
        newConcorsiMonth,
        newEntiToday,
        totalEnti,
        profileTrend,
        concorsiTrend,
    ] = await Promise.all([
        countProfiles(supabase),
        countProfiles(supabase, (query) => query.gte('created_at', toIso(ranges.todayStart))),
        countProfiles(supabase, (query) => query.gte('created_at', toIso(ranges.weekStart))),
        countProfiles(supabase, (query) => query.gte('created_at', toIso(ranges.monthStart))),
        countProfiles(supabase, (query) => query.in('subscription_status', ['active', 'trialing']).or('tier.eq.pro,tier.eq.admin')),
        countConcorsi(supabase, (query) => query.eq('is_active', true).gte('data_scadenza', nowIso)),
        countConcorsi(supabase, (query) => query.gte('created_at', toIso(ranges.todayStart))),
        countConcorsi(supabase, (query) => query.gte('created_at', toIso(ranges.weekStart))),
        countConcorsi(supabase, (query) => query.gte('created_at', toIso(ranges.monthStart))),
        countEnti(supabase, (query) => query.gte('created_at', toIso(ranges.todayStart))),
        countEnti(supabase),
        buildDailyTrend(supabase, 'profiles', 'created_at'),
        buildDailyTrend(supabase, 'concorsi', 'created_at'),
    ]);

    return {
        totalUsers,
        newUsersToday,
        newUsersWeek,
        newUsersMonth,
        payingUsers,
        activeConcorsi,
        newConcorsiToday,
        newConcorsiWeek,
        newConcorsiMonth,
        newEntiToday,
        totalEnti,
        profileTrend,
        concorsiTrend,
    };
}

export async function getSupabaseOperations(supabase: SupabaseClient): Promise<SupabaseOperations> {
    const ranges = getDashboardDateRanges();
    const staleCutoff = new Date(ranges.now);
    staleCutoff.setDate(staleCutoff.getDate() - 14);

    const nowIso = toIso(ranges.now);
    const [
        openConcorsi,
        closedConcorsi,
        pendingAiIndexing,
        failedEnrichments,
        staleRecords,
        totalConcorsi,
        totalEnti,
        totalProfiles,
        activeSubscriptions,
        ingestionTrend,
    ] = await Promise.all([
        countConcorsi(supabase, (query) => query.eq('is_active', true).gte('data_scadenza', nowIso)),
        countConcorsi(supabase, (query) => query.or(`data_scadenza.lt.${nowIso},status.eq.CLOSED,is_active.eq.false`)),
        countConcorsi(supabase, (query) => query.eq('ai_needs_reindex', true)),
        countEnti(supabase, (query) => query.eq('ai_enrichment_status', 'FAILED')),
        countConcorsi(supabase, (query) => query.lt('updated_at', toIso(staleCutoff))),
        countConcorsi(supabase),
        countEnti(supabase),
        countProfiles(supabase),
        countProfiles(supabase, (query) => query.in('subscription_status', ['active', 'trialing']).or('tier.eq.pro,tier.eq.admin')),
        buildDailyTrend(supabase, 'concorsi', 'created_at'),
    ]);

    const newest = await supabase
        .from('concorsi')
        .select('created_at')
        .order('created_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
    const newestCreatedAt = newest.data?.created_at ? new Date(newest.data.created_at).getTime() : ranges.now.getTime();
    const ingestionLatencyMinutes = Math.max(0, Math.round((ranges.now.getTime() - newestCreatedAt) / 60000));

    return {
        ingestionTrend,
        openClosedTrend: [
            { label: 'Aperti', value: openConcorsi },
            { label: 'Chiusi', value: closedConcorsi },
        ],
        tableHealth: [
            { id: 'concorsi', label: 'concorsi', value: totalConcorsi.toLocaleString('it-IT'), detail: `${openConcorsi.toLocaleString('it-IT')} aperti`, tone: totalConcorsi > 0 ? 'success' : 'warning' },
            { id: 'enti', label: 'enti', value: totalEnti.toLocaleString('it-IT'), detail: `${failedEnrichments} enrichment falliti`, tone: toneFromCount(failedEnrichments, 5, 20) },
            { id: 'profiles', label: 'profiles', value: totalProfiles.toLocaleString('it-IT'), detail: `${activeSubscriptions} paying/trialing`, tone: 'success' },
            { id: 'ai-indexing', label: 'ai processing queues', value: pendingAiIndexing.toLocaleString('it-IT'), detail: 'record da reindicizzare', tone: toneFromCount(pendingAiIndexing, 100, 500) },
        ],
        staleRecords,
        pendingAiIndexing,
        failedEnrichments,
        ingestionLatencyMinutes,
    };
}

export async function getGoogleIndexingOperations(supabase: SupabaseClient): Promise<GoogleIndexingOperations> {
    const ranges = getDashboardDateRanges();
    const [
        successfulRequestsToday,
        failedRequestsToday,
        pendingPages,
        indexedEstimate,
        rows,
    ] = await Promise.all([
        countRows(supabase, 'google_indexing_notifications', (query) => query.gte('last_success_at', toIso(ranges.todayStart))),
        countRows(supabase, 'google_indexing_notifications', (query) => query.gte('last_attempt_at', toIso(ranges.todayStart)).not('last_error', 'is', null)),
        countRows(supabase, 'google_indexing_notifications', (query) => query.is('last_success_at', null)),
        countRows(supabase, 'google_indexing_notifications', (query) => query.not('last_success_at', 'is', null)),
        supabase
            .from('google_indexing_notifications')
            .select('id, url, last_status, last_error, last_success_at, last_attempt_at')
            .order('last_attempt_at', { ascending: false, nullsFirst: false })
            .limit(5),
    ]);

    const quotaLimit = Number.parseInt(process.env.GOOGLE_INDEXING_DAILY_QUOTA ?? '200', 10);
    const quotaUsed = successfulRequestsToday + failedRequestsToday;
    const recentUrls: TableRow[] = ((rows.data ?? []) as Array<{
        id: string;
        url: string;
        last_status: number | null;
        last_error: string | null;
        last_success_at: string | null;
        last_attempt_at: string | null;
    }>).map((row) => ({
        id: row.id,
        label: row.url.replace(/^https?:\/\//, ''),
        value: row.last_status ? String(row.last_status) : 'queued',
        detail: row.last_error ?? (row.last_success_at ? 'Indexed notification accepted' : 'Awaiting first success'),
        tone: row.last_error ? 'warning' : 'success',
    }));

    return {
        quotaUsed,
        quotaLimit,
        successfulRequestsToday,
        failedRequestsToday,
        pendingPages,
        indexedEstimate,
        trend: fallbackTrend(Math.max(8, quotaUsed), 14),
        recentUrls,
    };
}

export async function getEmailDispatchCounts(supabase: SupabaseClient) {
    const ranges = getDashboardDateRanges();
    const [sentToday, failedSends] = await Promise.all([
        countRows(supabase, 'brevo_event_dispatches', (query) => query.gte('dispatched_at', toIso(ranges.todayStart))),
        countRows(supabase, 'brevo_event_dispatches', (query) => query.gte('dispatched_at', toIso(ranges.todayStart)).ilike('payload::text', '%error%')),
    ]);

    return { sentToday, failedSends };
}

export async function getRecentTimelineEvents(supabase: SupabaseClient): Promise<TimelineEvent[]> {
    const [concorsi, users, indexing] = await Promise.all([
        supabase.from('concorsi').select('concorso_id, titolo, created_at, ente_nome').order('created_at', { ascending: false }).limit(4),
        supabase.from('profiles').select('id, email, created_at, subscription_status').order('created_at', { ascending: false }).limit(4),
        supabase.from('google_indexing_notifications').select('id, url, last_status, last_attempt_at, last_error').order('last_attempt_at', { ascending: false, nullsFirst: false }).limit(4),
    ]);

    const events: TimelineEvent[] = [];
    for (const row of (concorsi.data ?? []) as Array<{ concorso_id: string; titolo: string | null; ente_nome: string | null; created_at: string | null }>) {
        events.push({
            id: `concorso-${row.concorso_id}`,
            title: 'Nuovo concorso acquisito',
            description: `${row.titolo ?? 'Bando senza titolo'}${row.ente_nome ? ` · ${row.ente_nome}` : ''}`,
            source: 'supabase',
            tone: 'success',
            timestamp: row.created_at ?? new Date().toISOString(),
        });
    }
    for (const row of (users.data ?? []) as Array<{ id: string; email: string | null; created_at: string | null; subscription_status: string | null }>) {
        events.push({
            id: `user-${row.id}`,
            title: row.subscription_status === 'active' ? 'Nuovo utente pagante' : 'Nuova registrazione',
            description: row.email ?? 'Profilo senza email',
            source: 'stripe',
            tone: row.subscription_status === 'active' ? 'success' : 'info',
            timestamp: row.created_at ?? new Date().toISOString(),
        });
    }
    for (const row of (indexing.data ?? []) as Array<{ id: string; url: string | null; last_status: number | null; last_attempt_at: string | null; last_error: string | null }>) {
        events.push({
            id: `indexing-${row.id}`,
            title: row.last_error ? 'Indexing API warning' : 'Google indexing request',
            description: row.url?.replace(/^https?:\/\//, '') ?? 'URL notification',
            source: 'google',
            tone: row.last_error ? 'warning' : 'success',
            timestamp: row.last_attempt_at ?? new Date().toISOString(),
        });
    }

    return events
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
}

export { percentage };
