import { NextRequest, NextResponse } from 'next/server';
import { createClient, createStaticAdminClient } from '@/lib/supabase/server';
import { calculateProfileCompletionScore, type ProfileCompletionInput } from '@/lib/onboarding/profile-completion';

type SedePreferita = 'tutta_italia' | 'regione' | 'provincia' | 'remoto' | 'nessuna_preferenza';

interface OnboardingProfilePayload extends ProfileCompletionInput {
    regione_interesse?: string | null;
    provincia_interesse?: string | null;
    preferred_regioni?: string[] | null;
    sede_preferita?: SedePreferita | null;
    remote_preferito?: boolean | null;
    settori_interesse?: string[] | null;
    preferred_settori?: string[] | null;
    profilo_professionale?: string | null;
    titolo_studio?: string | null;
    anni_esperienza?: number | null;
    education_history?: Array<Record<string, unknown>> | null;
    experience_history?: Array<Record<string, unknown>> | null;
    obiettivo_concorso?: string | null;
    disponibilita_mobilita?: boolean | null;
    tempo_studio_settimanale?: number | null;
    disponibilita_trasferimento?: string | null;
    livello_preparazione?: string | null;
    public_admin_experience?: boolean | null;
    notification_email?: boolean | null;
    profile_source?: string | null;
    complete?: boolean;
}

interface RequestBody {
    data?: OnboardingProfilePayload;
}

function extractMissingColumn(errorMessage?: string): string | null {
    if (!errorMessage) return null;
    const match = errorMessage.match(/Could not find the '([^']+)' column/i);
    return match?.[1] ?? null;
}

function cleanText(value: unknown) {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

function cleanTextArray(value: unknown) {
    if (!Array.isArray(value)) return null;
    const items = value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);

    return items.length > 0 ? Array.from(new Set(items)) : null;
}

function cleanJsonArray(value: unknown) {
    return Array.isArray(value) && value.length > 0 ? value : null;
}

function cleanNumber(value: unknown) {
    if (typeof value !== 'number' || Number.isNaN(value)) return null;
    return Math.max(0, Math.round(value));
}

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = (await req.json()) as RequestBody;
    const data = body.data;

    if (!data || typeof data !== 'object') {
        return NextResponse.json({ error: 'Payload non valido' }, { status: 400 });
    }

    const { data: existingProfile } = await supabase
        .from('profiles')
        .select(
            [
                'regione_interesse',
                'provincia_interesse',
                'preferred_regioni',
                'sede_preferita',
                'settori_interesse',
                'preferred_settori',
                'profilo_professionale',
                'titolo_studio',
                'anni_esperienza',
                'skills',
                'languages',
                'driving_licenses',
            ].join(',')
        )
        .eq('id', user.id)
        .maybeSingle();

    const regioni = cleanTextArray(data.preferred_regioni);
    const settori = cleanTextArray(data.settori_interesse);
    const preferredSettori = cleanTextArray(data.preferred_settori) ?? settori;
    const skills = cleanTextArray(data.skills);
    const languages = cleanTextArray(data.languages);
    const drivingLicenses = cleanTextArray(data.driving_licenses);
    const now = new Date().toISOString();

    const merged = {
        ...(existingProfile as Record<string, unknown> | null),
        ...Object.fromEntries(
            Object.entries({
                regione_interesse: cleanText(data.regione_interesse),
                provincia_interesse: cleanText(data.provincia_interesse),
                preferred_regioni: regioni,
                sede_preferita: cleanText(data.sede_preferita),
                settori_interesse: settori,
                preferred_settori: preferredSettori,
                profilo_professionale: cleanText(data.profilo_professionale),
                titolo_studio: cleanText(data.titolo_studio),
                anni_esperienza: cleanNumber(data.anni_esperienza),
                skills,
                languages,
                driving_licenses: drivingLicenses,
            }).filter(([key]) => Object.prototype.hasOwnProperty.call(data, key))
        ),
    } as Record<string, unknown>;

    const completionInput: ProfileCompletionInput = {
        regione_interesse: cleanText(merged.regione_interesse),
        provincia_interesse: cleanText(merged.provincia_interesse),
        preferred_regioni: cleanTextArray(merged.preferred_regioni),
        sede_preferita: cleanText(merged.sede_preferita),
        settori_interesse: cleanTextArray(merged.settori_interesse),
        preferred_settori: cleanTextArray(merged.preferred_settori),
        profilo_professionale: cleanText(merged.profilo_professionale),
        titolo_studio: cleanText(merged.titolo_studio),
        anni_esperienza: cleanNumber(merged.anni_esperienza),
        skills: cleanTextArray(merged.skills),
        languages: cleanTextArray(merged.languages),
        driving_licenses: cleanTextArray(merged.driving_licenses),
    };

    const profilePayload: Record<string, unknown> = {
        id: user.id,
        email: user.email ?? null,
        updated_at: now,
        profile_completion_score: calculateProfileCompletionScore(completionInput),
    };

    const assignIfPresent = (sourceKey: keyof OnboardingProfilePayload, column: string, value: unknown) => {
        if (Object.prototype.hasOwnProperty.call(data, sourceKey)) {
            profilePayload[column] = value;
        }
    };

    assignIfPresent('regione_interesse', 'regione_interesse', cleanText(data.regione_interesse));
    assignIfPresent('provincia_interesse', 'provincia_interesse', cleanText(data.provincia_interesse));
    assignIfPresent('preferred_regioni', 'preferred_regioni', regioni);
    assignIfPresent('sede_preferita', 'sede_preferita', cleanText(data.sede_preferita));
    assignIfPresent('remote_preferito', 'remote_preferito', Boolean(data.remote_preferito));
    assignIfPresent('settori_interesse', 'settori_interesse', settori);
    assignIfPresent('preferred_settori', 'preferred_settori', preferredSettori);
    assignIfPresent('profilo_professionale', 'profilo_professionale', cleanText(data.profilo_professionale));
    assignIfPresent('titolo_studio', 'titolo_studio', cleanText(data.titolo_studio));
    assignIfPresent('anni_esperienza', 'anni_esperienza', cleanNumber(data.anni_esperienza));
    assignIfPresent('education_history', 'education_history', cleanJsonArray(data.education_history));
    assignIfPresent('experience_history', 'experience_history', cleanJsonArray(data.experience_history));
    assignIfPresent('obiettivo_concorso', 'obiettivo_concorso', cleanText(data.obiettivo_concorso));
    assignIfPresent('disponibilita_mobilita', 'disponibilita_mobilita', Boolean(data.disponibilita_mobilita));
    assignIfPresent('tempo_studio_settimanale', 'tempo_studio_settimanale', cleanNumber(data.tempo_studio_settimanale));
    assignIfPresent('disponibilita_trasferimento', 'disponibilita_trasferimento', cleanText(data.disponibilita_trasferimento));
    assignIfPresent('livello_preparazione', 'livello_preparazione', cleanText(data.livello_preparazione));
    assignIfPresent(
        'public_admin_experience',
        'public_admin_experience',
        typeof data.public_admin_experience === 'boolean' ? data.public_admin_experience : null
    );
    assignIfPresent('skills', 'skills', skills);
    assignIfPresent('languages', 'languages', languages);
    assignIfPresent('driving_licenses', 'driving_licenses', drivingLicenses);
    assignIfPresent('profile_source', 'profile_source', cleanText(data.profile_source) ?? 'manual_onboarding');

    if (typeof data.notification_email === 'boolean') {
        profilePayload.notification_email = data.notification_email;
    }

    if (data.complete) {
        profilePayload.onboarding_completed = true;
        profilePayload.onboarding_completed_at = now;
    }

    const runUpsert = async (payload: Record<string, unknown>) => {
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return createStaticAdminClient().from('profiles').upsert(payload, { onConflict: 'id' });
        }

        return supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    };

    const safePayload = { ...profilePayload };
    let attempts = 0;
    let result = await runUpsert(safePayload);

    while (result.error && attempts < 8) {
        const missingColumn = extractMissingColumn(result.error.message);
        if (!missingColumn || !(missingColumn in safePayload)) break;
        delete safePayload[missingColumn];
        attempts += 1;
        result = await runUpsert(safePayload);
    }

    if (result.error) {
        console.error('[onboarding/profile] upsert failed', { userId: user.id, error: result.error });
        return NextResponse.json(
            { error: 'Errore durante il salvataggio. Riprova tra poco.', details: result.error.message ?? null },
            { status: 500 }
        );
    }

    return NextResponse.json({
        saved: true,
        profile_completion_score: safePayload.profile_completion_score,
        onboarding_completed: Boolean(safePayload.onboarding_completed),
    });
}
