import { MetadataRoute } from 'next';
import { getCanonicalSiteUrl } from '@/lib/auth/url';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = getCanonicalSiteUrl();

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/hub/',
                '/impostazioni/',
                '/_next/',
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
