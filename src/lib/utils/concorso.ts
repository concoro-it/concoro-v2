export function parseRegioni(concorso: import('@/types/concorso').Concorso): string[] {
    if (!concorso.regioni_array) return [];
    return concorso.regioni_array.map(r => {
        try {
            const parsed = typeof r === 'string' ? JSON.parse(r) : r;
            return parsed.nome || parsed.regione?.denominazione || parsed.denominazione || (typeof r === 'string' ? r : JSON.stringify(r));
        } catch {
            return typeof r === 'string' ? r : JSON.stringify(r);
        }
    });
}

export function parseProvince(concorso: import('@/types/concorso').Concorso): string[] {
    if (!concorso.province_array) return [];
    return concorso.province_array.map(p => {
        try {
            const parsed = typeof p === 'string' ? JSON.parse(p) : p;
            return parsed.nome || parsed.provincia?.denominazione || parsed.denominazione || parsed.sigla || (typeof p === 'string' ? p : JSON.stringify(p));
        } catch {
            return typeof p === 'string' ? p : JSON.stringify(p);
        }
    });
}

export function parseSedi(sediStr: string | null | undefined): string[] {
    if (!sediStr) return [];
    return sediStr
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

export function normaliseLink(url: string | null | undefined): string {
    if (!url) return '';
    // Basic validation/normalization of URLs
    let normalized = url.trim();
    if (normalized && !normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        normalized = `https://${normalized}`;
    }
    return normalized;
}

export function isExpiringSoon(dataChiusura: string | Date | null | undefined, daysThreshold: number = 7): boolean {
    if (!dataChiusura) return false;

    const closingDate = new Date(dataChiusura);
    const now = new Date();

    // Reset times to compare just the dates
    closingDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = closingDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays <= daysThreshold;
}

export function isExpired(dataChiusura: string | Date | null | undefined): boolean {
    if (!dataChiusura) return false;

    const closingDate = new Date(dataChiusura);
    const now = new Date();

    closingDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    return closingDate.getTime() < now.getTime();
}

// Helper to determine the urgency level (0-4) for a deadline
export function getUrgencyLevel(dataChiusura: string | Date | null | undefined, status?: string | null): number {
    if (status === 'CLOSED' || isExpired(dataChiusura)) return 0;
    if (!dataChiusura) return 4;

    const closingDate = new Date(dataChiusura);
    const now = new Date();
    closingDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = closingDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 1; // Today
    if (diffDays <= 7) return 2; // 1-7 days
    if (diffDays <= 30) return 3; // 8-30 days
    return 4; // > 30 days
}

// Helper for UI label based on urgency
export function getUrgencyLabel(dataChiusura: string | Date | null | undefined, status?: string | null): string | null {
    const level = getUrgencyLevel(dataChiusura, status);

    if (level === 0) return "Scaduto";
    if (!dataChiusura) return null;

    const closingDate = new Date(dataChiusura);
    const now = new Date();
    closingDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((closingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (level === 1) return "Scade oggi";
    if (level === 2 || level === 3) {
        return `Scade in ${diffDays} ${diffDays === 1 ? 'giorno' : 'giorni'}`;
    }

    // Level 4: > 30 days
    const d = new Date(dataChiusura);
    const months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    return `Scade il ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Helper for UI color based on urgency
export function getUrgencyColor(dataChiusura: string | Date | null | undefined, status?: string | null): string {
    const level = getUrgencyLevel(dataChiusura, status);
    if (level === 0) return "bg-gray-100 text-gray-500 border-gray-200";
    if (level === 1) return "bg-red-50 text-red-600 border-red-100";
    if (level === 2) return "bg-orange-50 text-orange-600 border-orange-100";
    if (level === 3) return "bg-yellow-50 text-yellow-600 border-yellow-100";
    return "bg-emerald-50 text-emerald-600 border-emerald-100";
}

// Extract the first region name 
export function getFirstRegione(concorso: import('@/types/concorso').Concorso): string | null {
    const regioni = parseRegioni(concorso);
    return regioni.length > 0 ? regioni[0] : null;
}

// Extract the first province name
export function getFirstProvincia(concorso: import('@/types/concorso').Concorso): string | null {
    const province = parseProvince(concorso);
    return province.length > 0 ? province[0] : null;
}

// Parse settori into an array of string descriptions
export function parseSettori(concorso: import('@/types/concorso').Concorso): string[] {
    if (concorso.settori && concorso.settori.length > 0) {
        return concorso.settori.map(s => {
            try {
                const parsed = JSON.parse(s);
                return parsed.descrizione || s;
            } catch {
                return s;
            }
        });
    }
    return [];
}

// Parse requisiti generali
export function parseRequisiti(concorso: import('@/types/concorso').Concorso): string[] {
    if (!concorso.requisiti_generali) return [];
    return concorso.requisiti_generali.map(r => {
        const text = typeof r === 'string' ? r : (r as any).descrizione || JSON.stringify(r);
        // Remove leading hyphen(s) and accompanying whitespace
        return text.replace(/^-+\s*/, '').trim();
    });
}

/**
 * Cleanup function for badges (Capacità & Conoscenze)
 * - Removes JSON artifacts like brackets and quotes
 * - Trims whitespace
 * - Applies Sentence case
 */
function formatBadge(text: string): string {
    if (!text) return '';

    // Remove literal [ ] " ' characters that might be present if it's a stringified list
    let cleaned = text.replace(/[\[\]"']/g, '').trim();

    if (!cleaned) return '';

    // Apply Sentence Case
    // We can reuse the word logic from formatConcorsoTitle if we want to be very thorough,
    // but for badges, a simpler approach is usually what's expected for "Sentence case".
    // Let's use a version that preserves the acronyms we already defined.
    return formatConcorsoTitle(cleaned);
}

// Helper to handle both string and JSON array cases for badges
function parseBadgeList(input: any): string[] {
    if (!input) return [];

    let items: string[] = [];

    // Try to parse as JSON first (common if data is stored as JSONB but returned as string)
    if (typeof input === 'string' && (input.startsWith('[') || input.startsWith('{'))) {
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) {
                items = parsed.map(String);
            } else if (typeof parsed === 'string') {
                items = parsed.split(',');
            }
        } catch {
            items = input.split(',');
        }
    } else if (typeof input === 'string') {
        items = input.split(',');
    } else if (Array.isArray(input)) {
        items = input.map(String);
    }

    return items
        .map(formatBadge)
        .filter(Boolean);
}

// Extract capacita
export function parseCapacita(concorso: import('@/types/concorso').Concorso): string[] {
    return parseBadgeList(concorso.capacita_richieste);
}

// Extract conoscenze
export function parseConoscenze(concorso: import('@/types/concorso').Concorso): string[] {
    return parseBadgeList(concorso.conoscenze_tecnico_specialistiche);
}

// Parse link allegati
export function parseLinkAllegati(concorso: import('@/types/concorso').Concorso): string[] {
    if (!concorso.link_allegati) return [];
    try {
        const parsed = JSON.parse(concorso.link_allegati);
        if (Array.isArray(parsed)) return parsed as string[];
    } catch {
        // Fallback if not JSON string
    }
    return [];
}

// Safe parsing of allegato count
export function getAllegatoCount(concorso: import('@/types/concorso').Concorso): number {
    if (typeof concorso.allegatoCount === 'number') return concorso.allegatoCount;
    return concorso.allegati?.length || 0;
}

/**
 * Eliminates all inline styling from HTML (style and class attributes)
 * but keeps the tags themselves.
 */
export function stripHtmlStyling(html: any): string {
    if (!html || typeof html !== 'string') return '';

    // Remove style="..." and class="..." attributes
    // This regex looks for attributes and removes them
    let cleaned = html.replace(/\s+(style|class)="[^"]*"/gi, '');

    // Also remove single quote versions
    cleaned = cleaned.replace(/\s+(style|class)='[^']*'/gi, '');

    return cleaned;
}

/**
 * Formats a title or text to Sentence case while preserving Italian special names.
 * Handles multiple sentences by looking for . ! ? delimiters.
 */
export function formatConcorsoTitle(text: any): string {
    if (!text || typeof text !== 'string') return '';

    // List of common Italian special names/acronyms that should stay capitalized
    const preserve = [
        'INPS', 'CNR', 'ASL', 'INAIL', 'ISTAT', 'ANAC', 'ENAC', 'ENAV', 'BCC',
        'RAI', 'MIT', 'MEF', 'MIUR', 'MISE', 'MAECI', 'MAAS', 'PNSD', 'PNRR',
        'Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze',
        'Bari', 'Catania', 'Venezia', 'Verona', 'Messina', 'Padova', 'Trieste',
        'Taranto', 'Brescia', 'Prato', 'Modena', 'Reggio', 'Emilia', 'Calabria',
        'Lazio', 'Lombardia', 'Piemonte', 'Sicilia', 'Sardegna', 'Toscana',
        'Umbria', 'Veneto', 'Liguria', 'Molise', 'Basilicata', 'Puglia', 'Campania',
        'Abruzzo', 'Marche', 'Friuli', 'Giulia', 'Trentino', 'Adige', 'Aosta',
        'Italia', 'Europea', 'Unione', 'Bolzano'
    ];

    // Convert everything to lowercase first
    const lowercase = text.toLowerCase();

    // Split by sentence boundaries but keep the delimiters
    // This regex looks for . ! ? followed by space (or end of content)
    const parts = lowercase.split(/([.!?]+\s*)/);

    return parts.map(part => {
        if (!part) return '';
        if (/^[.!?]+\s*$/.test(part)) return part; // Keep delimiters as is

        const words = part.split(/\s+/);
        const formattedWords = words.map((word, index) => {
            if (!word) return '';

            // Clean word for matching (remove punctuation but keep apostrophes for l'INPS etc.)
            // We only remove trailing punctuation for the match check
            const cleanWord = word.replace(/[,.;:!?()]+$/, '').toLowerCase();

            // Try matching with or without prefix (like l', d')
            const match = preserve.find(p => {
                const lp = p.toLowerCase();
                return lp === cleanWord || cleanWord === `l'${lp}` || cleanWord === `d'${lp}`;
            });

            if (match) {
                // Determine the correct casing for the match
                let formattedMatch = match;
                if (cleanWord.startsWith("l'")) formattedMatch = "l'" + match;
                else if (cleanWord.startsWith("d'")) formattedMatch = "d'" + match;

                // Restore trailing punctuation
                const punctuation = word.slice(word.replace(/[,.;:!?()]+$/, '').length);
                return formattedMatch + punctuation;
            }

            // Capitalize if it's the first word of the sentence
            if (index === 0) {
                return word.charAt(0).toUpperCase() + word.slice(1);
            }

            return word;
        });

        return formattedWords.join(' ');
    }).join('');
}

/**
 * Strips HTML styling and applies sentence case to text content.
 */
export function formatHtmlDescription(html: any): string {
    if (!html || typeof html !== 'string') return '';

    // 1. Strip style and class
    let cleaned = stripHtmlStyling(html);

    // 2. Process text nodes while ignoring tags
    const regex = /(<[^>]+>|[^<]+)/g;
    let result = '';
    let match;

    while ((match = regex.exec(cleaned)) !== null) {
        const part = match[0];
        if (part.startsWith('<')) {
            result += part;
        } else {
            result += formatConcorsoTitle(part);
        }
    }

    return result;
}
