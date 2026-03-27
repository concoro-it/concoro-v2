import type { Metadata } from 'next';
import PublicRegionePage, { generateMetadata as generatePublicMetadata } from '@/app/regione/[regione]/page';
import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/auth/getUserContext';

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
    const supabase = await createClient();
    const { tier } = await getUserContext(supabase);
    const mergedSearchParams = (async () => ({
        ...(await searchParams),
        viewer_tier: tier,
    }))();
    return <PublicRegionePage params={params} searchParams={mergedSearchParams} />;
}
