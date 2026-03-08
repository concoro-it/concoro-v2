import type { Metadata } from 'next';
import { ComingSoonPanel } from '@/components/dashboard/ComingSoonPanel';

export const metadata: Metadata = { title: 'Assistenza | Dashboard' };

export default function AssistenzaPage() {
    return (
        <ComingSoonPanel
            title="Assistenza"
            description="La sezione assistenza sarà disponibile presto."
        />
    );
}
