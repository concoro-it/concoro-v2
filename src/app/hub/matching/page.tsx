import type { Metadata } from 'next';
import { ComingSoonPanel } from '@/components/dashboard/ComingSoonPanel';

export const metadata: Metadata = { title: 'Matching | Dashboard' };

export default function MatchingPage() {
    return (
        <ComingSoonPanel
            title="Matching"
            description="Feature Pro: l'abbinamento CV-concorsi arriverà presto con notifiche ed email automatiche."
            pro
        />
    );
}
