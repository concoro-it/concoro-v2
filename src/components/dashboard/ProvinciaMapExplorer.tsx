"use client";

import { useMemo } from "react";
import ItalyMapDashboard from "@/components/dashboard/ItalyMapDashboard";
import { provinceToRegionSlug } from "@/lib/utils/province-region-map";
import { toUrlSlug } from "@/lib/utils/regioni";

type RegionCountRow = {
    regione: string;
    count: number;
};

type ProvinciaRow = {
    provincia: string;
    sigla: string;
    regione: string | null;
    count: number;
};

type ProvinciaMapExplorerProps = {
    regionCounts: RegionCountRow[];
    provinces: ProvinciaRow[];
};

const NORMALIZED_REGION_SLUG: Record<string, string> = {
    emiliaromagna: "emilia-romagna",
    friuliveneziagiulia: "friuli-venezia-giulia",
    trentinoaltoadige: "trentino-alto-adige",
    valledaosta: "valle-daosta",
};

const REGION_LABEL_BY_SLUG: Record<string, string> = {
    abruzzo: "Abruzzo",
    basilicata: "Basilicata",
    calabria: "Calabria",
    campania: "Campania",
    "emilia-romagna": "Emilia Romagna",
    "friuli-venezia-giulia": "Friuli Venezia Giulia",
    lazio: "Lazio",
    liguria: "Liguria",
    lombardia: "Lombardia",
    marche: "Marche",
    molise: "Molise",
    piemonte: "Piemonte",
    puglia: "Puglia",
    sardegna: "Sardegna",
    sicilia: "Sicilia",
    toscana: "Toscana",
    "trentino-alto-adige": "Trentino Alto Adige",
    umbria: "Umbria",
    "valle-d-aosta": "Valle d'Aosta",
    "valle-daosta": "Valle d'Aosta",
    veneto: "Veneto",
};

function resolveRegionLabel(regione: string | null | undefined, provincia: string): string {
    if (regione) return regione;
    const normalized = provinceToRegionSlug(provincia);
    if (!normalized) return "Regione";
    const canonicalSlug = NORMALIZED_REGION_SLUG[normalized] ?? normalized;
    return REGION_LABEL_BY_SLUG[canonicalSlug] ?? canonicalSlug;
}

function resolveRegionSlug(regione: string | null | undefined, provincia: string): string {
    if (regione) return toUrlSlug(regione);
    const normalized = provinceToRegionSlug(provincia);
    if (!normalized) return "";
    return NORMALIZED_REGION_SLUG[normalized] ?? normalized;
}

export default function ProvinciaMapExplorer({ regionCounts, provinces }: ProvinciaMapExplorerProps) {
    const provinceResults = useMemo(() => {
        return provinces.map((item) => ({
            provincia: item.provincia,
            sigla: item.sigla,
            count: item.count,
            regione: resolveRegionLabel(item.regione, item.provincia),
            regioneSlug: resolveRegionSlug(item.regione, item.provincia),
        }));
    }, [provinces]);

    return (
        <ItalyMapDashboard
            regionCounts={regionCounts}
            provinceResults={provinceResults}
            activeTotalCount={provinceResults.reduce((sum, item) => sum + item.count, 0)}
        />
    );
}
