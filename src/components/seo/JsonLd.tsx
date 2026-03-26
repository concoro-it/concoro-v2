import Script from 'next/script';

type JsonLdValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | JsonLdValue[]
    | { [key: string]: JsonLdValue };

export interface JsonLdProps {
    data: Record<string, JsonLdValue>;
}

export function JsonLd({ data }: JsonLdProps) {
    return (
        <Script
            id="json-ld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
            strategy="afterInteractive"
        />
    );
}

// Common schemas
export const getOrganizationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Concoro',
    url: 'https://concoro.it',
    logo: 'https://concoro.it/icon-512x512.png',
    sameAs: [
        'https://www.facebook.com/concoro',
        'https://twitter.com/concoro',
        'https://www.instagram.com/concoro',
    ],
});

export const getBreadcrumbSchema = (items: { name: string; item: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((breadcrumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: breadcrumb.name,
        item: breadcrumb.item,
    })),
});

export const getJobPostingSchema = (concorso: {
    titolo_breve?: string | null;
    titolo?: string | null;
    descrizione?: string | null;
    data_pubblicazione?: string | null;
    data_scadenza?: string | null;
    ente_nome?: string | null;
    link_sito_pa?: string | null;
    favicon_url?: string | null;
    regioni?: unknown;
}) => ({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: concorso.titolo_breve || concorso.titolo,
    description: concorso.descrizione || concorso.titolo,
    datePosted: concorso.data_pubblicazione,
    validThrough: concorso.data_scadenza,
    employmentType: 'FULL_TIME',
    hiringOrganization: {
        '@type': 'Organization',
        name: concorso.ente_nome,
        sameAs: concorso.link_sito_pa,
        logo: concorso.favicon_url,
    },
    jobLocation: {
        '@type': 'Place',
        address: {
            '@type': 'PostalAddress',
            addressCountry: 'IT',
            addressRegion: Array.isArray(concorso.regioni) ? concorso.regioni[0] : 'Italia',
        },
    },
});
