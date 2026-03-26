import type { UserTier } from '@/types/profile';

export const ALLOWED_DEADLINE_OFFSETS = [1, 3, 7] as const;
export const DEFAULT_PRO_DEADLINE_OFFSETS = [7, 3, 1] as const;
export const DEFAULT_FREE_DEADLINE_OFFSETS = [1] as const;

export type AlertPreferencesRow = {
    deadline_enabled: boolean | null;
    deadline_offsets: number[] | null;
};

export type EffectiveAlertPreferences = {
    deadlineEnabled: boolean;
    deadlineOffsets: number[];
};

export function isProTier(tier: UserTier): boolean {
    return tier === 'pro' || tier === 'admin';
}

function isAllowedOffset(value: number): value is (typeof ALLOWED_DEADLINE_OFFSETS)[number] {
    return ALLOWED_DEADLINE_OFFSETS.includes(value as (typeof ALLOWED_DEADLINE_OFFSETS)[number]);
}

export function normalizeDeadlineOffsets(input: unknown): number[] {
    if (!Array.isArray(input)) return [];
    const inputNumbers = input.filter((value): value is number => Number.isInteger(value));
    const unique = new Set(inputNumbers.filter(isAllowedOffset));
    return DEFAULT_PRO_DEADLINE_OFFSETS.filter((value) => unique.has(value));
}

export function resolveEffectiveAlertPreferences(
    tier: UserTier,
    row: AlertPreferencesRow | null
): EffectiveAlertPreferences {
    if (!isProTier(tier)) {
        return {
            deadlineEnabled: true,
            deadlineOffsets: [...DEFAULT_FREE_DEADLINE_OFFSETS],
        };
    }

    const normalizedOffsets = normalizeDeadlineOffsets(row?.deadline_offsets);
    const deadlineEnabled = row?.deadline_enabled ?? true;
    const fallbackOffsets = [...DEFAULT_PRO_DEADLINE_OFFSETS];
    const deadlineOffsets = normalizedOffsets.length > 0 ? normalizedOffsets : fallbackOffsets;

    return {
        deadlineEnabled,
        deadlineOffsets,
    };
}
