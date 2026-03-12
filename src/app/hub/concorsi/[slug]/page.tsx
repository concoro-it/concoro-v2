import type { Metadata } from 'next';
import PublicConcorsoDetailPage, { generateMetadata as generatePublicMetadata } from '@/app/concorsi/[slug]/page';

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
    return (
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 shadow-[0_32px_70px_-46px_rgba(15,23,42,0.65)]">
            <PublicConcorsoDetailPage params={params} />
        </div>
    );
}
