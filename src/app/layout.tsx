import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Suspense } from 'react';
import { ConditionalHeader } from '@/components/layout/ConditionalHeader';
import { ConditionalFooter } from '@/components/layout/ConditionalFooter';
import { ConsentBanner } from '@/components/analytics/ConsentBanner';
import { getServerAppUrl } from '@/lib/auth/url';
import { CONSENT_STORAGE_KEY } from '@/lib/analytics/consent';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600', '700', '800'] });
const GA_MEASUREMENT_ID = 'G-KRQJ1WJJ8Y';

export const metadata: Metadata = {
    title: {
        default: 'Concoro — Concorsi Pubblici in Italia',
        template: '%s | Concoro',
    },
    description: 'Trova i migliori concorsi pubblici in Italia. Cerca per regione, ente, settore o scadenza. Aggiornati ogni giorno dal portale InPA.',
    keywords: ['concorsi pubblici', 'concorso pubblico', 'bandi concorso', 'lavoro pubblico', 'PA', 'InPA'],
    metadataBase: new URL(getServerAppUrl()),
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
    return (
        <html lang="it" className={`${inter.variable}`}>
            <head>
                <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="beforeInteractive" />
                <Script id="google-gtag" strategy="beforeInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('consent', 'default', {
                            ad_storage: 'denied',
                            analytics_storage: 'denied',
                            ad_user_data: 'denied',
                            ad_personalization: 'denied',
                            wait_for_update: 500
                        });

                        try {
                            var savedConsent = window.localStorage.getItem('${CONSENT_STORAGE_KEY}');
                            if (savedConsent === 'granted' || savedConsent === 'denied') {
                                gtag('consent', 'update', {
                                    ad_storage: savedConsent,
                                    analytics_storage: savedConsent,
                                    ad_user_data: savedConsent,
                                    ad_personalization: savedConsent
                                });
                            }
                        } catch (error) {}

                        gtag('config', '${GA_MEASUREMENT_ID}');
                    `}
                </Script>
            </head>
            <body className="bg-background text-foreground antialiased">
                <Suspense fallback={null}>
                    <ConditionalHeader />
                </Suspense>
                <main>{children}</main>
                <ConsentBanner />
                <Suspense fallback={null}>
                    <ConditionalFooter />
                </Suspense>
            </body>
        </html>
    );
}
