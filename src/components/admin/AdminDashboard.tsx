import {
    AlertList,
} from '@/components/admin/AlertList';
import { ActivityTimeline } from '@/components/admin/ActivityTimeline';
import { HealthScoreCard } from '@/components/admin/HealthScoreCard';
import { MetricCard } from '@/components/admin/MetricCard';
import { OperationalTable } from '@/components/admin/OperationalTable';
import { ProviderStatusGrid } from '@/components/admin/ProviderStatusGrid';
import { SectionPanel } from '@/components/admin/SectionPanel';
import { AreaTrend } from '@/components/charts/AreaTrend';
import { MiniBarChart } from '@/components/charts/MiniBarChart';
import { StackedBars } from '@/components/charts/StackedBars';
import { StatusHeatmap } from '@/components/charts/StatusHeatmap';
import type { AdminDashboardSnapshot } from '@/lib/dashboard/types';

function StatLine({ label, value, helper }: { label: string; value: string; helper: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white/75 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
    );
}

export function AdminDashboard({ snapshot }: { snapshot: AdminDashboardSnapshot }) {
    return (
        <div className="space-y-5">
            <div id="overview">
                <HealthScoreCard score={snapshot.healthScore} providers={snapshot.providers} />
            </div>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {snapshot.kpis.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} />
                ))}
            </section>

            <div className="grid gap-5 xl:grid-cols-[1.55fr_0.95fr]">
                <div className="space-y-5">
                    <SectionPanel
                        title="Supabase Operational Metrics"
                        description="Database ingestion, AI indexing queue, stale records, and core table health."
                        className="scroll-mt-24"
                    >
                        <div id="supabase" className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="space-y-4">
                                <AreaTrend data={snapshot.supabase.ingestionTrend} tone="success" />
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Open vs closed concorsi</p>
                                    <StackedBars data={snapshot.supabase.openClosedTrend} />
                                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                                        {snapshot.supabase.openClosedTrend.map((point) => (
                                            <span key={point.label}>{point.label}: <strong className="text-slate-900">{point.value.toLocaleString('it-IT')}</strong></span>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <StatLine label="Pending AI indexing" value={snapshot.supabase.pendingAiIndexing.toLocaleString('it-IT')} helper="Records queued for semantic refresh" />
                                    <StatLine label="Ingestion latency" value={`${snapshot.supabase.ingestionLatencyMinutes}m`} helper="Since newest concorso record" />
                                    <StatLine label="Failed enrichments" value={snapshot.supabase.failedEnrichments.toLocaleString('it-IT')} helper="Enti enrichment failures" />
                                    <StatLine label="Stale records" value={snapshot.supabase.staleRecords.toLocaleString('it-IT')} helper="Not updated in 14 days" />
                                </div>
                            </div>
                            <OperationalTable rows={snapshot.supabase.tableHealth} />
                        </div>
                    </SectionPanel>

                    <SectionPanel
                        title="Google Indexing API"
                        description="Quota usage, URL notification health, pending pages, and recent indexing events."
                        className="scroll-mt-24"
                    >
                        <div id="indexing" className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                            <div className="space-y-3">
                                <div className="rounded-lg border border-slate-200 bg-white/75 p-4">
                                    <div className="flex items-end justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Daily quota</p>
                                            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{snapshot.googleIndexing.quotaUsed}/{snapshot.googleIndexing.quotaLimit}</p>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-500">{Math.round((snapshot.googleIndexing.quotaUsed / Math.max(snapshot.googleIndexing.quotaLimit, 1)) * 100)}%</p>
                                    </div>
                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(100, (snapshot.googleIndexing.quotaUsed / Math.max(snapshot.googleIndexing.quotaLimit, 1)) * 100)}%` }} />
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <StatLine label="Successful today" value={snapshot.googleIndexing.successfulRequestsToday.toLocaleString('it-IT')} helper="Accepted URL updates" />
                                    <StatLine label="Failed today" value={snapshot.googleIndexing.failedRequestsToday.toLocaleString('it-IT')} helper="Rejected or errored" />
                                    <StatLine label="Indexed estimate" value={snapshot.googleIndexing.indexedEstimate.toLocaleString('it-IT')} helper="Successful notification rows" />
                                    <StatLine label="Pending pages" value={snapshot.googleIndexing.pendingPages.toLocaleString('it-IT')} helper="No successful notification yet" />
                                </div>
                                <MiniBarChart data={snapshot.googleIndexing.trend} tone="info" />
                            </div>
                            <OperationalTable rows={snapshot.googleIndexing.recentUrls} />
                        </div>
                    </SectionPanel>

                    <SectionPanel title="Stripe Revenue Intelligence" description="Subscription revenue, payment recovery, conversion proxy, and recent revenue events." className="scroll-mt-24">
                        <div id="revenue" className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <StatLine label="MRR" value={`€${snapshot.stripe.mrr.toLocaleString('it-IT')}`} helper="Estimated from active users" />
                                <StatLine label="ARR estimate" value={`€${snapshot.stripe.arr.toLocaleString('it-IT')}`} helper="MRR annualized" />
                                <StatLine label="Active subscriptions" value={snapshot.stripe.activeSubscriptions.toLocaleString('it-IT')} helper={`${snapshot.stripe.trialingSubscriptions} trialing`} />
                                <StatLine label="Past due" value={snapshot.stripe.pastDueSubscriptions.toLocaleString('it-IT')} helper={`${snapshot.stripe.churnRisk}% churn risk proxy`} />
                                <StatLine label="Conversion rate" value={`${snapshot.stripe.conversionRate}%`} helper="Trial/free to paid proxy" />
                                <StatLine label="Failed payments" value={snapshot.stripe.pastDueSubscriptions.toLocaleString('it-IT')} helper="Payment recovery warnings" />
                            </div>
                            <div className="space-y-4">
                                <AreaTrend data={snapshot.stripe.trend} tone="success" />
                                <OperationalTable rows={snapshot.stripe.recentPayments} />
                            </div>
                        </div>
                    </SectionPanel>

                    <div className="grid gap-5 xl:grid-cols-2">
                        <SectionPanel title="Sentry Monitoring" description="Production error groups and regression indicators." className="scroll-mt-24">
                            <div id="sentry" className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <StatLine label="Error rate" value={`${snapshot.sentry.errorRate}%`} helper="Current production proxy" />
                                    <StatLine label="Critical unresolved" value={snapshot.sentry.unresolvedCritical.toLocaleString('it-IT')} helper="Needs review now" />
                                </div>
                                <MiniBarChart data={snapshot.sentry.issueTrend} tone={snapshot.sentry.unresolvedCritical > 0 ? 'critical' : 'warning'} />
                                <OperationalTable rows={snapshot.sentry.topFailingEndpoints} />
                                <OperationalTable rows={snapshot.sentry.issueGroups} />
                            </div>
                        </SectionPanel>

                        <SectionPanel title="Brevo Email Intelligence" description="Transactional email volume, delivery, bounce, and campaign health." className="scroll-mt-24">
                            <div id="brevo" className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <StatLine label="Emails sent" value={snapshot.brevo.sentToday.toLocaleString('it-IT')} helper="Today" />
                                    <StatLine label="Delivery" value={`${snapshot.brevo.deliveryRate}%`} helper={`${snapshot.brevo.failedSends} failed sends`} />
                                    <StatLine label="Open rate" value={`${snapshot.brevo.openRate}%`} helper="Provider fallback estimate" />
                                    <StatLine label="Bounce rate" value={`${snapshot.brevo.bounceRate}%`} helper="Transactional risk" />
                                </div>
                                <AreaTrend data={snapshot.brevo.trend} tone={snapshot.brevo.deliveryRate >= 96 ? 'success' : 'warning'} />
                                <OperationalTable rows={snapshot.brevo.transactionalHealth} />
                            </div>
                        </SectionPanel>
                    </div>
                </div>

                <aside className="space-y-5">
                    <SectionPanel title="Provider Status" description="Cross-system health scores and trend signals.">
                        <ProviderStatusGrid providers={snapshot.providers} />
                    </SectionPanel>

                    <SectionPanel title="Alerts Center" description="Operational anomalies requiring attention." className="scroll-mt-24">
                        <div id="alerts">
                            <AlertList alerts={snapshot.alerts} />
                        </div>
                    </SectionPanel>

                    <SectionPanel title="Cron Integrity" description="Scheduled job liveness and execution intensity.">
                        <div className="space-y-4">
                            <div className="rounded-lg border border-slate-200 bg-white/75 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Cron health score</p>
                                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{snapshot.cron.healthScore}%</p>
                                <p className="mt-1 text-xs text-slate-500">Derived from ingestion, indexing, and email signals</p>
                            </div>
                            <StatusHeatmap data={snapshot.cron.heatmap} />
                            <OperationalTable rows={snapshot.cron.jobs} />
                        </div>
                    </SectionPanel>

                    <SectionPanel title="Activity Timeline" description="Unified operational event stream." className="scroll-mt-24">
                        <div id="timeline">
                            <ActivityTimeline events={snapshot.timeline} />
                        </div>
                    </SectionPanel>
                </aside>
            </div>
        </div>
    );
}
