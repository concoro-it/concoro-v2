import type { Metadata } from 'next';
import PublicEntePage, { generateMetadata as generatePublicMetadata } from '@/app/ente/[ente-slug]/page';
import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/auth/getUserContext';

interface Props {
    params: Promise<{ 'ente-slug': string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { 'ente-slug': slug } = await params;
    const publicMetadata = await generatePublicMetadata({ params: Promise.resolve({ 'ente-slug': slug }) });

    return {
        ...publicMetadata,
        alternates: {
            ...publicMetadata.alternates,
            canonical: `/ente/${slug}`,
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

export default async function HubEntePage({ params }: Props) {
    const supabase = await createClient();
    const { tier } = await getUserContext(supabase);
    return <PublicEntePage params={params} searchParams={Promise.resolve({ viewer_tier: tier })} />;
}
