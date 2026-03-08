import { redirect } from 'next/navigation';

interface Props {
    params: Promise<{ slug: string[] }>;
}

export default async function LegacyDashboardCatchAllPage({ params }: Props) {
    const { slug } = await params;
    const target = Array.isArray(slug) && slug.length > 0 ? `/hub/${slug.join('/')}` : '/hub/bacheca';
    redirect(target);
}
