import { format, formatDistance, isAfter, isBefore, startOfDay, endOfDay, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';

export function formatDateIT(date: string | null): string {
    if (!date) return '—';
    try {
        return format(new Date(date), 'd MMMM yyyy', { locale: it });
    } catch { return '—'; }
}

export function formatDateShort(date: string | null): string {
    if (!date) return '—';
    try {
        return format(new Date(date), 'dd/MM/yyyy', { locale: it });
    } catch { return '—'; }
}

export function isExpired(dataScadenza: string | null): boolean {
    if (!dataScadenza) return false;
    return isBefore(new Date(dataScadenza), new Date());
}

export function isClosingSoon(dataScadenza: string | null, days = 7): boolean {
    if (!dataScadenza) return false;
    const deadline = new Date(dataScadenza);
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return isAfter(deadline, now) && isBefore(deadline, future);
}

export function getTimeAgo(date: string): string {
    try {
        return formatDistance(new Date(date), new Date(), { addSuffix: true, locale: it });
    } catch { return ''; }
}

export function getTodayRange(): { start: string; end: string } {
    const now = new Date();
    return {
        start: startOfDay(now).toISOString(),
        end: endOfDay(now).toISOString(),
    };
}

export function getThisWeekRange(): { start: string; end: string } {
    const now = new Date();
    return {
        start: now.toISOString(),
        end: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
}

export function getThisMonthRange(): { start: string; end: string } {
    const now = new Date();
    return {
        start: now.toISOString(),
        end: endOfMonth(now).toISOString(),
    };
}
