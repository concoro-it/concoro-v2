export const CONSENT_STORAGE_KEY = 'concoro_google_consent_v1';

export type ConsentState = 'granted' | 'denied';

export function buildConsentUpdate(consentState: ConsentState) {
    return {
        ad_storage: consentState,
        analytics_storage: consentState,
        ad_user_data: consentState,
        ad_personalization: consentState,
    };
}
