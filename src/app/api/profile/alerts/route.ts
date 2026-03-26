import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import {
    isProTier,
    normalizeDeadlineOffsets,
    resolveEffectiveAlertPreferences,
} from '@/lib/alerts/preferences';

type AlertsUpdateBody = {
    deadline_enabled?: unknown;
    deadline_offsets?: unknown;
};

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getUserTier(supabase);
    const pro = isProTier(tier);

    if (!pro) {
        return NextResponse.json({
            deadline_enabled: true,
            deadline_offsets: [1],
            is_pro: false,
        });
    }

    const { data, error } = await supabase
        .from('user_alert_preferences')
        .select('deadline_enabled, deadline_offsets')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const effective = resolveEffectiveAlertPreferences(tier, data);
    return NextResponse.json({
        deadline_enabled: effective.deadlineEnabled,
        deadline_offsets: effective.deadlineOffsets,
        is_pro: true,
    });
}

export async function PUT(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getUserTier(supabase);
    if (!isProTier(tier)) {
        return NextResponse.json(
            { error: 'Gli alert avanzati sono disponibili solo per gli utenti Pro.' },
            { status: 403 }
        );
    }

    const body = (await req.json()) as AlertsUpdateBody;
    if (typeof body.deadline_enabled !== 'boolean' || !Array.isArray(body.deadline_offsets)) {
        return NextResponse.json(
            { error: 'deadline_enabled (boolean) e deadline_offsets (number[]) sono obbligatori.' },
            { status: 400 }
        );
    }

    if (!body.deadline_offsets.every((value) => Number.isInteger(value))) {
        return NextResponse.json({ error: 'deadline_offsets deve contenere solo interi.' }, { status: 400 });
    }

    const normalizedOffsets = normalizeDeadlineOffsets(body.deadline_offsets);
    if (normalizedOffsets.length !== body.deadline_offsets.length) {
        return NextResponse.json(
            { error: 'Sono consentiti solo i valori 1, 3, 7 in deadline_offsets.' },
            { status: 400 }
        );
    }

    if (body.deadline_enabled && normalizedOffsets.length === 0) {
        return NextResponse.json(
            { error: 'Se deadline_enabled e true devi selezionare almeno un promemoria.' },
            { status: 400 }
        );
    }

    const { error } = await supabase
        .from('user_alert_preferences')
        .upsert({
            user_id: user.id,
            deadline_enabled: body.deadline_enabled,
            deadline_offsets: normalizedOffsets,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        saved: true,
        deadline_enabled: body.deadline_enabled,
        deadline_offsets: normalizedOffsets,
        is_pro: true,
    });
}
