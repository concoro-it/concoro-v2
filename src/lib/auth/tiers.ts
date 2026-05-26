import type { UserTier } from '@/types/profile';

export function hasProAccess(tier: UserTier | null | undefined): boolean {
    return tier === 'trial' || tier === 'pro' || tier === 'admin';
}

export function isPaidProTier(tier: UserTier | null | undefined): boolean {
    return tier === 'pro' || tier === 'admin';
}

export function getTierLabel(tier: UserTier | null | undefined): string {
    if (tier === 'admin') return 'Admin';
    if (tier === 'pro') return 'Pro';
    if (tier === 'trial') return 'Trial';
    if (tier === 'free') return 'Gratuito';
    return 'Ospite';
}
