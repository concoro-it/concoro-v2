import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Concoro - Concorsi Pubblici Italiani',
        short_name: 'Concoro',
        description: 'Il portale più avanzato per trovare e prepararsi ai concorsi pubblici in Italia. Notifiche, AI, e materiali di studio in un unico posto.',
        start_url: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#020617',
        icons: [
            {
                src: '/fav.png',
                sizes: 'any',
                type: 'image/png',
            },
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
