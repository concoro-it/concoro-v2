import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeProvinceKey, provinceToRegionSlug } from '@/lib/utils/province-region-map';

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const regione = (searchParams.get('regione') ?? '').trim();

    if (!regione) {
        return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabase
        .from('concorsi_view')
        .select('province_names')
        .eq('is_active', true)
        .contains('regioni_names', [regione]);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
        const provinces = Array.isArray(row.province_names) ? row.province_names : [];
        for (const provincia of provinces) {
            if (!provincia) continue;
            counts[provincia] = (counts[provincia] ?? 0) + 1;
        }
    }

    const normalizedRegion = normalizeProvinceKey(regione);
    const mapped = Object.entries(counts)
        .filter(([provincia]) => provinceToRegionSlug(provincia) === normalizedRegion)
        .map(([value, count]) => ({ value, label: `${value} (${count})` }))
        .sort((a, b) => a.value.localeCompare(b.value, 'it'));

    return NextResponse.json({ data: mapped });
}
