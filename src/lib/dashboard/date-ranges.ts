export type DashboardDateRanges = {
    now: Date;
    todayStart: Date;
    yesterdayStart: Date;
    weekStart: Date;
    previousWeekStart: Date;
    monthStart: Date;
    previousMonthStart: Date;
    thirtyDaysAgo: Date;
};

export function getDashboardDateRanges(now = new Date()): DashboardDateRanges {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    const previousWeekStart = new Date(weekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const monthStart = new Date(todayStart);
    monthStart.setDate(1);

    const previousMonthStart = new Date(monthStart);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);

    const thirtyDaysAgo = new Date(todayStart);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return {
        now,
        todayStart,
        yesterdayStart,
        weekStart,
        previousWeekStart,
        monthStart,
        previousMonthStart,
        thirtyDaysAgo,
    };
}

export function toIso(date: Date) {
    return date.toISOString();
}

export function formatShortDate(date: Date) {
    return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short' }).format(date);
}
