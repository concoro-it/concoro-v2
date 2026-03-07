import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Calendar, Tag } from 'lucide-react';
import { createClient, createStaticClient } from '@/lib/supabase/server';
import { getArticoloBySlug } from '@/lib/supabase/queries';
import { formatDateIT } from '@/lib/utils/date';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    const supabase = createStaticClient();
    const articolo = await getArticoloBySlug(supabase, slug);

    if (!articolo) return { title: 'Articolo non trovato' };

    return {
        title: articolo.title,
        description: articolo.excerpt || `Leggi l'articolo ${articolo.title} su Concoro.`,
        openGraph: articolo.cover_image ? {
            images: [{ url: articolo.cover_image }]
        } : undefined
    };
}

export const revalidate = 3600; // revalidate every hour

export default async function BlogPage({ params }: Props) {
    const { slug } = await params;

    const supabase = await createClient();
    const articolo = await getArticoloBySlug(supabase, slug);

    if (!articolo) {
        notFound();
    }

    return (
        <article className="container max-w-4xl mx-auto px-4 py-8">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
                <Link href="/" className="hover:text-foreground">Home</Link>
                <ChevronRight className="w-4 h-4" />
                <Link href="/blog" className="hover:text-foreground">Blog</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground truncate max-w-[200px] sm:max-w-none">{articolo.title}</span>
            </nav>

            <header className="mb-10 text-center">
                {articolo.categoria && (
                    <div className="flex justify-center mb-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            <Tag className="w-3.5 h-3.5" />
                            {articolo.categoria}
                        </span>
                    </div>
                )}

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
                    {articolo.title}
                </h1>

                <div className="flex items-center justify-center gap-4 text-muted-foreground text-sm">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <time dateTime={articolo.published_at}>
                            {formatDateIT(articolo.published_at)}
                        </time>
                    </div>
                </div>
            </header>

            {articolo.cover_image && (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-12 bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={articolo.cover_image}
                        alt={articolo.title}
                        className="object-cover w-full h-full"
                    />
                </div>
            )}

            <div className="prose prose-slate dark:prose-invert prose-lg max-w-none mx-auto">
                {articolo.content ? (
                    <div dangerouslySetInnerHTML={{ __html: articolo.content }} />
                ) : (
                    <p className="text-muted-foreground italic">Nessun contenuto disponibile.</p>
                )}
            </div>
        </article>
    );
}
