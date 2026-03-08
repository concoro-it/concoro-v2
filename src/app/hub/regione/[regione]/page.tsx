import type { Metadata } from 'next';
import PublicRegionePage, { generateMetadata as generatePublicMetadata } from '@/app/regione/[regione]/page';

interface Props {
    params: Promise<{ regione: string }>;
    searchParams: Promise<{ stato?: string; page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { regione } = await params;
    const publicMetadata = await generatePublicMetadata({ params: Promise.resolve({ regione }), searchParams: Promise.resolve({}) });

    return {
        ...publicMetadata,
        alternates: {
            ...publicMetadata.alternates,
            canonical: `/regione/${regione}`,
        },
        robots: {
            index: false,
            follow: false,
            nocache: true,
            googleBot: {
                index: false,
                follow: false,
                noimageindex: true,
            },
        },
    };
}

export default async function HubRegionePage({ params, searchParams }: Props) {
    return <PublicRegionePage params={params} searchParams={searchParams} />;
}
