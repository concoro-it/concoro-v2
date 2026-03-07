import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { isExpiringSoon, isExpired } from '@/lib/utils/concorso';

interface ScadenzaBadgeProps {
    dataScadenza: string | Date | null | undefined;
    className?: string;
    showIcon?: boolean;
}

export function ScadenzaBadge({
    dataScadenza,
    className,
    showIcon = true,
}: ScadenzaBadgeProps) {
    if (!dataScadenza) return null;

    const expired = isExpired(dataScadenza);
    const expiringSoon = !expired && isExpiringSoon(dataScadenza, 7); // within 7 days

    let variant: 'default' | 'destructive' | 'secondary' | 'outline' = 'secondary';
    let label = 'Aperto';

    if (expired) {
        variant = 'outline';
        label = 'Scaduto';
    } else if (expiringSoon) {
        variant = 'destructive';
        label = 'In scadenza';
    } else {
        variant = 'default';
    }

    return (
        <Badge
            variant={variant}
            className={cn(
                'px-2 py-0.5 text-xs font-semibold uppercase tracking-wider',
                expired && 'text-muted-foreground border-muted-foreground/30',
                expiringSoon && 'animate-pulse',
                className
            )}
        >
            {showIcon && <Clock className="mr-1 h-3 w-3" />}
            {label}
        </Badge>
    );
}
