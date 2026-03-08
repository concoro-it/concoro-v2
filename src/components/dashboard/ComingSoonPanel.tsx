import Link from 'next/link';
import { Crown } from 'lucide-react';

interface ComingSoonPanelProps {
    title: string;
    description: string;
    pro?: boolean;
}

export function ComingSoonPanel({ title, description, pro = false }: ComingSoonPanelProps) {
    return (
        <div className="container max-w-container mx-auto px-4 py-8">
            <div className="rounded-2xl border border-dashed border-border bg-white p-8 sm:p-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground mb-4">
                    {pro && <Crown className="w-3.5 h-3.5 text-primary" />}
                    Coming soon
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">{description}</p>
                {pro && (
                    <Link href="/pricing" className="inline-block mt-5 text-sm font-medium text-primary hover:underline">
                        Scopri Concoro Pro
                    </Link>
                )}
            </div>
        </div>
    );
}
