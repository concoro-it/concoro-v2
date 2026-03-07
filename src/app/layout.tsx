import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import { ConditionalHeader } from '@/components/layout/ConditionalHeader';
import { ConditionalFooter } from '@/components/layout/ConditionalFooter';
import { createClient } from '@/lib/supabase/server';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
    title: {
        default: 'Concoro — Concorsi Pubblici in Italia',
        template: '%s | Concoro',
    },
    description: 'Trova i migliori concorsi pubblici in Italia. Cerca per regione, ente, settore o scadenza. Aggiornati ogni giorno dal portale InPA.',
    keywords: ['concorsi pubblici', 'concorso pubblico', 'bandi concorso', 'lavoro pubblico', 'PA', 'InPA'],
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    openGraph: {
        type: 'website',
        locale: 'it_IT',
        siteName: 'Concoro',
    },
    robots: { index: true, follow: true },
    icons: {
        icon: '/fav.png',
        apple: '/fav.png',
    },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <html lang="it" className={`${inter.variable}`}>
            <body className="bg-background text-foreground antialiased">
                <Suspense fallback={null}>
                    <ConditionalHeader user={user} />
                </Suspense>
                <main>{children}</main>
                <Suspense fallback={null}>
                    <ConditionalFooter />
                </Suspense>
            </body>
        </html>
    );
}

