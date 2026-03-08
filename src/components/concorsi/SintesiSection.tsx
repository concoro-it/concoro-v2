import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SintesiItem {
    id: string;
    type: 'Punto di forza' | 'Importante';
    description: string;
    colorClass: string;
}

interface SintesiSectionProps {
    items: SintesiItem[];
}

function SummaryCard({ type, description, colorClass }: Omit<SintesiItem, 'id'>) {
    return (
        <figure
            className={cn(
                "relative w-full overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm",
                "transition-colors hover:bg-gray-50 cursor-default",
                "dark:border-slate-700 dark:bg-slate-800/80 dark:backdrop-blur-md dark:hover:bg-slate-800/50"
            )}
        >
            <div className="flex flex-col gap-1.5">
                <span className={cn("text-xs font-bold uppercase tracking-wider", colorClass)}>
                    {type}
                </span>
                <p className="text-sm font-medium leading-snug text-slate-700 dark:text-slate-200">
                    {description}
                </p>
            </div>
        </figure>
    );
}

export function SintesiSection({ items }: SintesiSectionProps) {
    if (!items.length) return null;

    return (
        <div className="w-full rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm backdrop-blur-xl sm:p-5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    In sintesi
                </h2>
            </div>

            <div className="flex flex-col gap-3">
                {items.map((item, idx) => (
                    <div
                        key={item.id}
                        className="opacity-0 animate-fade-in-up"
                        style={{
                            animationDelay: `${idx * 0.12}s`,
                            animationFillMode: 'forwards'
                        }}
                    >
                        <SummaryCard
                            type={item.type}
                            description={item.description}
                            colorClass={item.colorClass}
                        />
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
