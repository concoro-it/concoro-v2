export const SITE_NAME = 'Concoro';
export const SITE_LOGO_PATH = '/google-jobs-logo.png';
export const SITE_LOGO_WIDTH = 512;
export const SITE_LOGO_HEIGHT = 512;

export function getSiteLogoUrl(appUrl: string): string {
    return `${appUrl}${SITE_LOGO_PATH}`;
}

export function getSiteOrganizationSchema(appUrl: string) {
    const logoUrl = getSiteLogoUrl(appUrl);

    return {
        '@type': 'Organization',
        '@id': `${appUrl}/#organization`,
        name: SITE_NAME,
        url: appUrl,
        logo: {
            '@type': 'ImageObject',
            url: logoUrl,
            width: SITE_LOGO_WIDTH,
            height: SITE_LOGO_HEIGHT,
        },
        image: logoUrl,
    };
}

export function getSiteWebSiteSchema(appUrl: string) {
    return {
        '@type': 'WebSite',
        '@id': `${appUrl}/#website`,
        name: SITE_NAME,
        url: appUrl,
        publisher: {
            '@id': `${appUrl}/#organization`,
        },
    };
}
