import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonCard() {
    return (
        <div className="flex flex-col space-y-3 p-4 border rounded-xl overflow-hidden shadow-sm h-full">
            <div className="flex justify-between items-start mb-2">
                <Skeleton className="h-4 w-1/4 rounded bg-muted/60" />
                <Skeleton className="h-6 w-16 rounded-full bg-muted/60" />
            </div>

            <div className="space-y-2 flex-grow">
                <Skeleton className="h-5 w-3/4 rounded bg-muted/60" />
                <Skeleton className="h-5 w-1/2 rounded bg-muted/60" />
            </div>

            <div className="mt-4 pt-4 border-t space-y-2">
                <Skeleton className="h-3 w-full rounded bg-muted/60" />
                <Skeleton className="h-3 w-5/6 rounded bg-muted/60" />
            </div>

            <div className="flex justify-between mt-auto pt-4">
                <Skeleton className="h-8 w-24 rounded bg-muted/60" />
                <Skeleton className="h-8 w-8 rounded bg-muted/60" />
            </div>
        </div>
    );
}
