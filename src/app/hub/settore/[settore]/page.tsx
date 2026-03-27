import type { Metadata } from 'next';
import PublicSettorePage, { generateMetadata as generatePublicMetadata } from '@/app/settore/[settore]/page';
import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/auth/getUserContext';

interface Props {
    params: Promise<{ settore: string }>;
    searchParams: Promise<{ stato?: string; page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { settore } = await params;
    const publicMetadata = await generatePublicMetadata({ params: Promise.resolve({ settore }), searchParams: Promise.resolve({}) });

    return {
        ...publicMetadata,
        alternates: {
            ...publicMetadata.alternates,
            canonical: `/settore/${settore}`,
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

export default async function HubSettorePage({ params, searchParams }: Props) {
    const supabase = await createClient();
    const { tier } = await getUserContext(supabase);
    const mergedSearchParams = (async () => ({
        ...(await searchParams),
        viewer_tier: tier,
    }))();
    return <PublicSettorePage params={params} searchParams={mergedSearchParams} />;
}
