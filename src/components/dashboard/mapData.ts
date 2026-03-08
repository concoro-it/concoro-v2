
export interface RegionInfo {
    name: string;
    count: number;
    change: string;
}

export const REGION_META: Record<string, { name: string }> = {
    TAA: { name: "Trentino-Alto Adige" },
    VEN: { name: "Veneto" },
    FVG: { name: "Friuli-Venezia Giulia" },
    LOM: { name: "Lombardia" },
    VDA: { name: "Valle d'Aosta" },
    PIE: { name: "Piemonte" },
    EMR: { name: "Emilia-Romagna" },
    LIG: { name: "Liguria" },
    TOS: { name: "Toscana" },
    MAR: { name: "Marche" },
    UMB: { name: "Umbria" },
    ABR: { name: "Abruzzo" },
    LAZ: { name: "Lazio" },
    MOL: { name: "Molise" },
    PUG: { name: "Puglia" },
    CAM: { name: "Campania" },
    BAS: { name: "Basilicata" },
    CAL: { name: "Calabria" },
    SIC: { name: "Sicilia" },
    SAR: { name: "Sardegna" }
};

export const COLOR_SCALE = [
    { min: 0, max: 50, color: "#dce8f5" },
    { min: 51, max: 150, color: "#9dc4e8" },
    { min: 151, max: 300, color: "#5a9fd4" },
    { min: 301, max: 600, color: "#2271b3" },
    { min: 601, max: 1000, color: "#0d4d8a" }
];

export const getRegionColor = (count: number) => {
    const scale = COLOR_SCALE.find(s => count >= s.min && count <= s.max);
    return scale ? scale.color : "#072f5f";
};
