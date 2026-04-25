import { MetadataRoute } from 'next';
import { createStaticAdminClient, createStaticClient } from '@/lib/supabase/server';
import { getAllConcorsiSlugs, getAllEnteSlugs, getAllProvinceSlugs, getAllRegioniSlugs, getAllSettoriSlugs } from '@/lib/supabase/queries';
import { getCanonicalSiteUrl } from '@/lib/auth/url';

// Regenerate sitemap periodically so new/removed concorsi URLs are reflected automatically.
export const revalidate = 86400; // 24 hours
// Next.js dynamic sitemap generation
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = getCanonicalSiteUrl();
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
        ? createStaticAdminClient()
        : createStaticClient();

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
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1.0 : 0.8,
    }));

    // 2. Fetch Dynamic Routes in parallel
    const [
        concorsiSlugs,
        enteSlugs,
        regioniSlugs,
        provinceSlugs,
        settoriSlugs
    ] = await Promise.all([
        getAllConcorsiSlugs(supabase),
        getAllEnteSlugs(supabase),
        getAllRegioniSlugs(supabase),
        getAllProvinceSlugs(supabase),
        getAllSettoriSlugs(supabase)
    ]);

    // 3. Map Dynamic Routes
    const concorsiRoutes = concorsiSlugs.map((slug) => ({
        url: `${baseUrl}/concorsi/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
    }));

    const entiRoutes = enteSlugs.map((slug) => ({
        url: `${baseUrl}/ente/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }));

    const regioniRoutes = regioniSlugs.map((slug) => ({
        url: `${baseUrl}/regione/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    const provinceRoutes = provinceSlugs.map((slug) => ({
        url: `${baseUrl}/provincia/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    const settoriRoutes = settoriSlugs.map((slug) => ({
        url: `${baseUrl}/settore/${slug}`,
        lastModified: new Date(),
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
