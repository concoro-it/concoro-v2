import { dotClasses, formatTime } from '@/components/admin/admin-utils';
import type { TimelineEvent } from '@/lib/dashboard/types';

export function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
    return (
        <div className="space-y-0">
            {events.map((event, index) => (
                <div key={event.id} className="grid grid-cols-[1rem_1fr] gap-3">
                    <div className="flex flex-col items-center">
                        <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${dotClasses[event.tone]}`} />
                        {index < events.length - 1 ? <span className="mt-1 h-full min-h-10 w-px bg-slate-200" /> : null}
                    </div>
                    <article className="pb-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-950">{event.title}</h3>
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{event.description}</p>
                            </div>
                            <span className="shrink-0 text-[0.65rem] font-medium text-slate-400">{formatTime(event.timestamp)}</span>
                        </div>
                    </article>
                </div>
            ))}
        </div>
    );
}
