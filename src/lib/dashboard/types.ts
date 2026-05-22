export type DashboardTone = 'success' | 'warning' | 'critical' | 'info' | 'neutral';

export type Delta = {
    label: string;
    value: string;
    direction: 'up' | 'down' | 'flat';
    tone: DashboardTone;
};

export type ChartPoint = {
    label: string;
    value: number;
    secondaryValue?: number;
};

export type KpiMetric = {
    id: string;
    label: string;
    value: string;
    helper: string;
    tone: DashboardTone;
    dailyDelta: Delta;
    weeklyDelta: Delta;
    monthlyDelta: Delta;
    trend: ChartPoint[];
};

export type ProviderStatus = {
    id: string;
    name: string;
    score: number;
    tone: DashboardTone;
    status: string;
    detail: string;
    trend: ChartPoint[];
};

export type OperationalAlert = {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    source: 'supabase' | 'google' | 'stripe' | 'sentry' | 'brevo' | 'cron' | 'api';
    timestamp: string;
};

export type TimelineEvent = {
    id: string;
    title: string;
    description: string;
    source: OperationalAlert['source'];
    tone: DashboardTone;
    timestamp: string;
};

export type TableRow = {
    id: string;
    label: string;
    value: string;
    detail: string;
    tone: DashboardTone;
};

export type SupabaseOperations = {
    ingestionTrend: ChartPoint[];
    openClosedTrend: ChartPoint[];
    tableHealth: TableRow[];
    staleRecords: number;
    pendingAiIndexing: number;
    failedEnrichments: number;
    ingestionLatencyMinutes: number;
};

export type GoogleIndexingOperations = {
    quotaUsed: number;
    quotaLimit: number;
    successfulRequestsToday: number;
    failedRequestsToday: number;
    pendingPages: number;
    indexedEstimate: number;
    trend: ChartPoint[];
    recentUrls: TableRow[];
};

export type StripeRevenueOperations = {
    mrr: number;
    arr: number;
    activeSubscriptions: number;
    trialingSubscriptions: number;
    pastDueSubscriptions: number;
    churnRisk: number;
    conversionRate: number;
    trend: ChartPoint[];
    recentPayments: TableRow[];
};

export type SentryOperations = {
    unresolvedCritical: number;
    errorRate: number;
    topFailingEndpoints: TableRow[];
    issueTrend: ChartPoint[];
    issueGroups: TableRow[];
};

export type BrevoOperations = {
    sentToday: number;
    deliveryRate: number;
    openRate: number;
    bounceRate: number;
    failedSends: number;
    trend: ChartPoint[];
    transactionalHealth: TableRow[];
};

export type CronOperations = {
    healthScore: number;
    jobs: TableRow[];
    heatmap: ChartPoint[];
};

export type AdminDashboardSnapshot = {
    generatedAt: string;
    healthScore: number;
    kpis: KpiMetric[];
    providers: ProviderStatus[];
    supabase: SupabaseOperations;
    googleIndexing: GoogleIndexingOperations;
    stripe: StripeRevenueOperations;
    sentry: SentryOperations;
    brevo: BrevoOperations;
    cron: CronOperations;
    alerts: OperationalAlert[];
    timeline: TimelineEvent[];
};
