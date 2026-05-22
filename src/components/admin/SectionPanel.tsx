import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SectionPanel({
    title,
    description,
    action,
    children,
    className,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('rounded-lg border border-slate-200/80 bg-white/88 p-4 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur sm:p-5', className)}>
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold tracking-tight text-slate-950">{title}</h2>
                    {description ? <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p> : null}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}
