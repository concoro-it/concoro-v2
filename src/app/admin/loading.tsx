import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
    return (
        <div className="space-y-5">
            <Skeleton className="h-64 rounded-lg bg-slate-200/80" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 12 }, (_, index) => (
                    <Skeleton key={index} className="h-36 rounded-lg bg-slate-200/80" />
                ))}
            </div>
            <div className="grid gap-5 xl:grid-cols-[1.55fr_0.95fr]">
                <Skeleton className="h-[38rem] rounded-lg bg-slate-200/80" />
                <Skeleton className="h-[38rem] rounded-lg bg-slate-200/80" />
            </div>
        </div>
    );
}
