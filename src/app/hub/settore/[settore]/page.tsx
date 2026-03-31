import type { Metadata } from 'next';
import PublicSettorePage, { generateMetadata as generatePublicMetadata } from '@/app/settore/[settore]/page';

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
    return <PublicSettorePage params={params} searchParams={searchParams} />;
}
