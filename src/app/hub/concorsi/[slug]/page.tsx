import type { Metadata } from 'next';
import PublicConcorsoDetailPage, { generateMetadata as generatePublicMetadata } from '@/app/concorsi/[slug]/page';
import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/auth/getUserContext';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const publicMetadata = await generatePublicMetadata({ params: Promise.resolve({ slug }) });

    return {
        ...publicMetadata,
        alternates: {
            ...publicMetadata.alternates,
            canonical: `/concorsi/${slug}`,
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

export default async function HubConcorsoDetailPage({ params }: Props) {
    const supabase = await createClient();
    const { tier } = await getUserContext(supabase);

    return (
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 shadow-[0_32px_70px_-46px_rgba(15,23,42,0.65)]">
            <PublicConcorsoDetailPage params={params} searchParams={Promise.resolve({ viewer_tier: tier })} />
        </div>
    );
}
