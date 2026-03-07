'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GlowingEffectProps {
    className?: string;
    glowColor?: string;
    disabled?: boolean;
}

/**
 * A reusable glowing effect meant to be placed behind cards or active elements.
 * Best used with absolute positioning inside a relative container.
 */
export function GlowingEffect({
    className,
    glowColor = 'bg-primary/20',
    disabled = false,
}: GlowingEffectProps) {
    if (disabled) return null;

    return (
        <div
            className={cn(
                'absolute -inset-0.5 rounded-xl blur-lg transition duration-1000 group-hover:duration-200',
                glowColor,
                'opacity-0 group-hover:opacity-100',
                className
            )}
            aria-hidden="true"
        />
    );
}
