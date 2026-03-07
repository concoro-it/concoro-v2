import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Clock, ArrowRight } from 'lucide-react';

interface ArticoloCardProps {
    articolo: any; // Ideally typed to match the markdown/CMS blog post type
    className?: string;
    compact?: boolean;
}

export function ArticoloCard({ articolo, className, compact = false }: ArticoloCardProps) {
    // Safe defaults
    const title = articolo.title || 'Nuovo Articolo';
    const slug = articolo.slug || '#';
    const description = articolo.description || '';
    const date = articolo.date || new Date().toISOString();
    const readTime = articolo.readTime || '5 min';
    const category = articolo.category || 'Guide';
    const image = articolo.image || '/images/blog-placeholder.jpg'; // Needs to exist in public/

    // Safe date formatting
    const formattedDate = new Intl.DateTimeFormat('it-IT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(new Date(date));

    return (
        <Card className={cn("overflow-hidden group flex flex-col h-full hover:shadow-md transition-all duration-300 border-border", className)}>
            <Link href={`/blog/${slug}`} className="flex flex-col h-full">
                {!compact && (
                    <div className="relative h-48 w-full overflow-hidden bg-muted">
                        <div className="absolute top-3 left-3 z-10">
                            <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-primary shadow-sm">
                                {category}
                            </span>
                        </div>
                        {/* Using a standard img tag for simplicity since next/image needs remote domains configured, but next/image works fine for local */}
                        <img
                            src={image}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                        />
                    </div>
                )}

                <CardContent className={cn("flex-1 flex flex-col p-5", compact && "pt-5")}>
                    {compact && (
                        <div className="mb-2">
                            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                                {category}
                            </span>
                        </div>
                    )}

                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {title}
                    </h3>

                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                        {description}
                    </p>

                    <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                        <div className="flex gap-3">
                            <span className="flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5" />
                                {formattedDate}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {readTime}
                            </span>
                        </div>

                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-primary" />
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
}
