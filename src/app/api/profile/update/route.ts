import { NextRequest, NextResponse } from 'next/server';
import { createClient, createStaticAdminClient } from '@/lib/supabase/server';
import { mapFormValuesToProfileUpdate, type ProfileFormValues } from '@/types/profile';

interface UpdateProfileRequestBody {
    formData?: ProfileFormValues;
}

function extractMissingColumn(errorMessage?: string): string | null {
    if (!errorMessage) return null;
    const match = errorMessage.match(/Could not find the '([^']+)' column/i);
    return match?.[1] ?? null;
}

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = (await req.json()) as UpdateProfileRequestBody;
    if (!body?.formData || typeof body.formData !== 'object') {
        return NextResponse.json({ error: 'Payload non valido' }, { status: 400 });
    }

    const updatePayload = mapFormValuesToProfileUpdate(body.formData);
    const fullName = [body.formData.first_name?.trim(), body.formData.last_name?.trim()]
        .filter(Boolean)
        .join(' ')
        .trim();

    const profilePayload = {
        id: user.id,
        email: user.email ?? null,
        ...updatePayload,
        full_name: fullName.length > 0 ? fullName : null,
        updated_at: new Date().toISOString(),
    };

    const runUpsert = async (payload: Record<string, unknown>) => {
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const supabaseAdmin = createStaticAdminClient();
            return supabaseAdmin
                .from('profiles')
                .upsert(payload, { onConflict: 'id' });
        }

        return supabase
            .from('profiles')
            .upsert(payload, { onConflict: 'id' });
    };

    const safePayload: Record<string, unknown> = { ...profilePayload };
    let attempts = 0;
    let result = await runUpsert(safePayload);

    // Backward-compatible save when some profile columns are missing in DB schema.
    while (result.error && attempts < 5) {
        const missingColumn = extractMissingColumn(result.error.message);
        if (!missingColumn || !(missingColumn in safePayload)) {
            break;
        }
        delete safePayload[missingColumn];
        attempts += 1;
        result = await runUpsert(safePayload);
    }

    const error = result.error;
    if (error) {
        console.error('[profile/update] upsert failed', { userId: user.id, error });
        return NextResponse.json(
            { error: 'Errore durante il salvataggio del profilo', details: error.message ?? null },
            { status: 500 }
        );
    }

    return NextResponse.json({ saved: true });
}
