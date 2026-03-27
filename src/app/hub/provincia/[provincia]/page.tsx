import type { Metadata } from 'next';
import PublicProvinciaPage, { generateMetadata as generatePublicMetadata } from '@/app/provincia/[provincia]/page';
import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/auth/getUserContext';

interface Props {
    params: Promise<{ provincia: string }>;
    searchParams: Promise<{ stato?: string; page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { provincia } = await params;
    const publicMetadata = await generatePublicMetadata({ params: Promise.resolve({ provincia }), searchParams: Promise.resolve({}) });

    return {
        ...publicMetadata,
        alternates: {
            ...publicMetadata.alternates,
            canonical: `/provincia/${provincia}`,
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

export default async function HubProvinciaPage({ params, searchParams }: Props) {
    const supabase = await createClient();
    const { tier } = await getUserContext(supabase);
    const mergedSearchParams = (async () => ({
        ...(await searchParams),
        viewer_tier: tier,
    }))();
    return <PublicProvinciaPage params={params} searchParams={mergedSearchParams} />;
}
