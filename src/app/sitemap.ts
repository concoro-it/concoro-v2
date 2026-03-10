import { MetadataRoute } from 'next';
import { createStaticClient } from '@/lib/supabase/server';
import { getAllConcorsiSlugs, getAllProvinceSlugs, getAllRegioniSlugs, getAllSettoriSlugs } from '@/lib/supabase/queries';

// Vercel/Next.js dynamic sitemap generation
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://concoro.it';
    const supabase = createStaticClient();

    // 1. Static Routes
    const staticRoutes = [
        '',
        '/concorsi',
        '/salvati',
        '/pricing',
        '/login',
        '/signup',
        '/privacy',
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
        regioniSlugs,
        provinceSlugs,
        settoriSlugs
    ] = await Promise.all([
        getAllConcorsiSlugs(supabase),
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
        ...regioniRoutes,
        ...provinceRoutes,
        ...settoriRoutes,
    ];
}
