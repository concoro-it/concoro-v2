
export interface RegionInfo {
    name: string;
    count: number;
    change: string;
}

export const REGION_DATA: Record<string, RegionInfo> = {
    TAA: { name: "Trentino-Alto Adige", count: 124, change: "+5" },
    VEN: { name: "Veneto", count: 456, change: "+12" },
    FVG: { name: "Friuli Venezia Giulia", count: 89, change: "+2" },
    LOM: { name: "Lombardia", count: 832, change: "+24" },
    VDA: { name: "Valle d'Aosta", count: 12, change: "0" },
    PIE: { name: "Piemonte", count: 312, change: "+8" },
    EMR: { name: "Emilia-Romagna", count: 421, change: "+15" },
    LIG: { name: "Liguria", count: 156, change: "+4" },
    TOS: { name: "Toscana", count: 342, change: "+9" },
    MAR: { name: "Marche", count: 128, change: "+3" },
    UMB: { name: "Umbria", count: 76, change: "-1" },
    ABR: { name: "Abruzzo", count: 145, change: "+6" },
    LAZ: { name: "Lazio", count: 754, change: "+31" },
    MOL: { name: "Molise", count: 34, change: "0" },
    PUG: { name: "Puglia", count: 287, change: "+14" },
    CAM: { name: "Campania", count: 395, change: "+18" },
    BAS: { name: "Basilicata", count: 54, change: "+1" },
    CAL: { name: "Calabria", count: 167, change: "+5" },
    SIC: { name: "Sicilia", count: 234, change: "+11" },
    SAR: { name: "Sardegna", count: 112, change: "+4" }
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
