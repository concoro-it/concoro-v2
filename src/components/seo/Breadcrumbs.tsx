import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
    homeUrl?: string;
}

export function Breadcrumbs({
    items,
    className,
    homeUrl = '/',
}: BreadcrumbsProps) {
    if (!items || items.length === 0) return null;

    return (
        <nav
            aria-label="Breadcrumb"
            className={cn(
                'flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground mb-4 sm:mb-6',
                className
            )}
        >
            <Link
                href={homeUrl}
                className="flex items-center hover:text-foreground transition-colors"
                aria-label="Home"
            >
                <Home className="w-4 h-4" />
            </Link>

            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <div key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                        <ChevronRight className="w-4 h-4 opacity-50 flex-shrink-0" />
                        {isLast || !item.href ? (
                            <span
                                className="text-foreground font-medium line-clamp-1"
                                aria-current="page"
                            >
                                {item.label}
                            </span>
                        ) : (
                            <Link
                                href={item.href}
                                className="hover:text-foreground transition-colors line-clamp-1 hover:underline underline-offset-4"
                            >
                                {item.label}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
