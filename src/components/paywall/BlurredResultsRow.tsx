import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface BlurredResultsRowProps {
    count?: number;
}

export function BlurredResultsRow({ count = 3 }: BlurredResultsRowProps) {
    // Create an array of dummy items based on count
    const items = Array.from({ length: count }, (_, i) => i);

    return (
        <div className="space-y-4">
            {items.map((i) => (
                <Card key={i} className="overflow-hidden border-border bg-white shadow-sm opacity-50 relative pointer-events-none">
                    <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row gap-4 h-full relative z-0 filter blur-[4px]">

                            <div className="w-12 h-12 bg-slate-200 rounded shrink-0 hidden sm:block"></div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-slate-200 rounded w-full mb-1"></div>
                                    <div className="h-4 bg-slate-200 rounded w-5/6 mb-4"></div>
                                </div>

                                <div className="flex gap-2">
                                    <div className="h-6 w-20 bg-slate-200 rounded"></div>
                                    <div className="h-6 w-24 bg-slate-200 rounded"></div>
                                    <div className="h-6 w-16 bg-slate-200 rounded ml-auto"></div>
                                </div>
                            </div>

                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
