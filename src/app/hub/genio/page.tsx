import type { Metadata } from 'next';
import { ComingSoonPanel } from '@/components/dashboard/ComingSoonPanel';

export const metadata: Metadata = { title: 'Genio | Dashboard' };

export default function GenioPage() {
    return (
        <ComingSoonPanel
            title="Genio"
            description="Assistente AI in arrivo: ti aiuterà a capire bandi, requisiti e prossime azioni."
            pro
        />
    );
}
