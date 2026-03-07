export interface Articolo {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    excerpt: string | null;
    cover_image: string | null;
    categoria: string | null;
    published_at: string;
    is_published: boolean;
    created_at: string;
}
