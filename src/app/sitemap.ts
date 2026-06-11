import { MetadataRoute } from 'next';
import { createCachedPublicClient, createCachedServiceClient } from '@/lib/supabase/server';
import { getAllEnteSlugs, getAllProvinceSlugs, getAllRegioniSlugs, getAllSettoriSlugs, getOpenConcorsiSitemapEntries } from '@/lib/supabase/queries';
import { getCanonicalSiteUrl } from '@/lib/auth/url';

// Cache the sitemap at the Next.js layer. Search engines can call this endpoint
// aggressively, and rebuilding it requires several Supabase reads.
export const revalidate = 3600;
// Next.js dynamic sitemap generation
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = getCanonicalSiteUrl();
    const generatedAt = new Date();
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
        ? createCachedServiceClient({ revalidate, tags: ['public:sitemap'] })
        : createCachedPublicClient({ revalidate, tags: ['public:sitemap'] });

    // Keep the sitemap focused on canonical, index-worthy public pages.
    const staticRoutes = [
        '',
        '/concorsi',
        '/ente',
        '/regione',
        '/provincia',
        '/settore',
        '/pricing',
        '/privacy',
        '/cookie-policy',
        '/termini',
        '/chi-siamo',
        '/contatti',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: generatedAt,
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1.0 : 0.8,
    }));

    // 2. Fetch Dynamic Routes in parallel
    const [
        concorsiEntries,
        enteSlugs,
        regioniSlugs,
        provinceSlugs,
        settoriSlugs
    ] = await Promise.all([
        getOpenConcorsiSitemapEntries(supabase),
        getAllEnteSlugs(supabase),
        getAllRegioniSlugs(supabase),
        getAllProvinceSlugs(supabase),
        getAllSettoriSlugs(supabase)
    ]);

    // 3. Map Dynamic Routes
    const concorsiRoutes = concorsiEntries.map((entry) => ({
        url: `${baseUrl}/concorsi/${entry.slug}`,
        lastModified: entry.lastModified ? new Date(entry.lastModified) : generatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.9,
    }));

    const entiRoutes = enteSlugs.map((slug) => ({
        url: `${baseUrl}/ente/${slug}`,
        lastModified: generatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }));

    const regioniRoutes = regioniSlugs.map((slug) => ({
        url: `${baseUrl}/regione/${slug}`,
        lastModified: generatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    const provinceRoutes = provinceSlugs.map((slug) => ({
        url: `${baseUrl}/provincia/${slug}`,
        lastModified: generatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    const settoriRoutes = settoriSlugs.map((slug) => ({
        url: `${baseUrl}/settore/${slug}`,
        lastModified: generatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    return [
        ...staticRoutes,
        ...concorsiRoutes,
        ...entiRoutes,
        ...regioniRoutes,
        ...provinceRoutes,
        ...settoriRoutes,
    ];
}
