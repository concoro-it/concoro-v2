import type { Metadata } from 'next';
import { ComingSoonPanel } from '@/components/dashboard/ComingSoonPanel';

export const metadata: Metadata = { title: 'Impostazioni | Dashboard' };

export default function ImpostazioniPage() {
    return (
        <ComingSoonPanel
            title="Impostazioni"
            description="Questa sezione sarà disponibile nelle prossime iterazioni."
        />
    );
}
