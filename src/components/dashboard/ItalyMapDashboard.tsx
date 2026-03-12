"use client";

import React, { useEffect, useState, useRef, useMemo, useLayoutEffect } from "react";
import Link from "next/link";
import styles from "./ItalyMapDashboard.module.css";
import { MAP_PATHS } from "./mapPaths";
import { REGION_META, type RegionInfo, getRegionColor, COLOR_SCALE } from "./mapData";
import { toUrlSlug } from "@/lib/utils/regioni";
import {
    ArrowLeft,
    ChevronRight,
    Plus,
    Minus,
    Maximize2
} from "lucide-react";

interface RegionCountRow {
    regione: string;
    count: number;
}

interface ProvinceResultRow {
    provincia: string;
    sigla?: string | null;
    regione: string;
    regioneSlug?: string;
    count: number;
}

interface ItalyMapDashboardProps {
    regionCounts: RegionCountRow[];
    activeTotalCount?: number;
    onRegionSelect?: (regionName: string | null) => void;
    provinceResults?: ProvinceResultRow[];
}

const MAP_VIEWBOX_WIDTH = 1480;
const MAP_VIEWBOX_HEIGHT = 1720;

const normalizeRegionName = (value: string): string =>
    value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/['']/g, "")
        .replace(/[\s-]+/g, " ")
        .trim();

const ItalyMapDashboard = ({ regionCounts, activeTotalCount, onRegionSelect, provinceResults }: ItalyMapDashboardProps) => {
    // Map State
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [fitScales, setFitScales] = useState({ contain: 1 });
    const [isMapReady, setIsMapReady] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [mapBounds, setMapBounds] = useState({ x: 0, y: 0, width: MAP_VIEWBOX_WIDTH, height: MAP_VIEWBOX_HEIGHT });
    const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Tooltip state
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, regionId: "" });

    const mapGroupRef = useRef<SVGGElement>(null);
    const mapCanvasRef = useRef<HTMLDivElement>(null);
    const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
    const regionData = useMemo<Record<string, RegionInfo>>(() => {
        const dbCountsByName = new Map<string, number>();
        for (const row of regionCounts) {
            dbCountsByName.set(normalizeRegionName(row.regione), row.count);
        }

        return Object.fromEntries(
            Object.entries(REGION_META).map(([code, meta]) => {
                const count = dbCountsByName.get(normalizeRegionName(meta.name)) ?? 0;
                return [code, { name: meta.name, count, change: "—" }];
            })
        ) as Record<string, RegionInfo>;
    }, [regionCounts]);

    // Sorted regions for the sidebar
    const sortedRegions = useMemo(() => {
        return Object.entries(regionData)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([id, data]) => ({ id, ...data }));
    }, [regionData]);

    const totalCount = useMemo(() => {
        return Object.values(regionData).reduce((acc, curr) => acc + curr.count, 0);
    }, [regionData]);
    const displayedTotalCount = activeTotalCount ?? totalCount;

    const rankingStats = useMemo(() => {
        const values = sortedRegions.map((r) => r.count).sort((a, b) => a - b);
        const max = sortedRegions[0]?.count ?? 0;
        const avg = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
        const mid = Math.floor(values.length / 2);
        const median =
            values.length === 0
                ? 0
                : values.length % 2 === 0
                    ? (values[mid - 1] + values[mid]) / 2
                    : values[mid];
        return { max, avg, median };
    }, [sortedRegions]);

    const detailBars = useMemo(() => {
        if (!selectedRegion) return [];
        const selectedCount = regionData[selectedRegion]?.count ?? 0;
        const max = Math.max(rankingStats.max, 1);
        const toHeight = (value: number) => `${Math.max((value / max) * 100, 8)}%`;

        return [
            { key: "selected", label: "Regione", value: selectedCount, height: toHeight(selectedCount), current: true },
            { key: "avg", label: "Media", value: Math.round(rankingStats.avg), height: toHeight(rankingStats.avg), current: false },
            { key: "median", label: "Mediana", value: Math.round(rankingStats.median), height: toHeight(rankingStats.median), current: false },
            { key: "top", label: "Top", value: rankingStats.max, height: "100%", current: false },
        ];
    }, [selectedRegion, regionData, rankingStats]);

    const scale = useMemo(() => {
        return fitScales.contain * zoom;
    }, [fitScales, zoom]);

    const svgViewportScale = useMemo(() => {
        if (!canvasSize.width || !canvasSize.height) {
            return 1;
        }
        return Math.min(canvasSize.width / MAP_VIEWBOX_WIDTH, canvasSize.height / MAP_VIEWBOX_HEIGHT);
    }, [canvasSize]);

    const effectiveScale = useMemo(() => {
        return scale / (svgViewportScale || 1);
    }, [scale, svgViewportScale]);

    const baseTranslate = useMemo(() => {
        if (!canvasSize.width || !canvasSize.height) {
            return { x: 0, y: 0 };
        }

        const scaledWidth = mapBounds.width * scale;
        const scaledHeight = mapBounds.height * scale;

        return {
            x: (canvasSize.width - scaledWidth) / 2 - mapBounds.x * scale,
            y: (canvasSize.height - scaledHeight) / 2 - mapBounds.y * scale
        };
    }, [canvasSize, mapBounds, scale]);

    useLayoutEffect(() => {
        const canvas = mapCanvasRef.current;
        const mapGroup = mapGroupRef.current;
        if (!canvas || !mapGroup) return;

        const calculateLayout = () => {
            const rect = canvas.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            const bbox = mapGroup.getBBox();
            if (!bbox.width || !bbox.height) return;

            const contain = Math.min(rect.width / bbox.width, rect.height / bbox.height);
            setFitScales({ contain });
            setCanvasSize({ width: rect.width, height: rect.height });
            setMapBounds({ x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height });
            setIsMapReady(true);
        };

        calculateLayout();

        const resizeObserver = new ResizeObserver(() => calculateLayout());
        resizeObserver.observe(canvas);
        return () => resizeObserver.disconnect();
    }, []);

    // Handlers
    const handleZoom = (delta: number) => {
        setZoom(prev => Math.min(Math.max(prev + delta, 0.6), 4));
    };

    const resetZoom = () => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const onRegionHover = (e: React.MouseEvent, id: string) => {
        setHoveredRegion(id);
        setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            regionId: id
        });
    };

    const onRegionLeave = () => {
        setHoveredRegion(null);
        setTooltip(prev => ({ ...prev, visible: false }));
    };

    const onRegionClick = (id: string) => {
        setSelectedRegion(selectedRegion === id ? null : id);
    };

    const selectedRegionRank = selectedRegion
        ? sortedRegions.findIndex((region) => region.id === selectedRegion) + 1
        : 0;
    const selectedRegionName = selectedRegion ? (regionData[selectedRegion]?.name ?? null) : null;
    const selectedRegionSlug = selectedRegionName ? toUrlSlug(selectedRegionName) : null;

    const selectedRegionProvinces = useMemo(() => {
        if (!selectedRegionName || !provinceResults?.length) return [];
        const selectedKey = normalizeRegionName(selectedRegionName);

        return provinceResults
            .filter((item) => {
                if (selectedRegionSlug && item.regioneSlug) return item.regioneSlug === selectedRegionSlug;
                return normalizeRegionName(item.regione) === selectedKey;
            })
            .sort((a, b) => b.count - a.count || a.provincia.localeCompare(b.provincia));
    }, [provinceResults, selectedRegionName, selectedRegionSlug]);

    useEffect(() => {
        if (!onRegionSelect) return;
        onRegionSelect(selectedRegionName);
    }, [onRegionSelect, selectedRegionName]);

    useEffect(() => {
        if (!canvasSize.width || !canvasSize.height) return;
        if (!fitScales.contain) return;
        if (!svgViewportScale) return;

        if (!selectedRegion) {
            setZoom(1);
            setOffset({ x: 0, y: 0 });
            return;
        }

        const pathNode = pathRefs.current[selectedRegion];
        if (!pathNode) return;

        const bbox = pathNode.getBBox();
        if (!bbox.width || !bbox.height) return;

        // Fit selected region into viewport with breathing room.
        const paddingFactor = 1.9;
        const desiredEffectiveScale = Math.min(
            canvasSize.width / (bbox.width * paddingFactor),
            canvasSize.height / (bbox.height * paddingFactor)
        );

        const nextZoom = Math.min(
            Math.max((desiredEffectiveScale * svgViewportScale) / fitScales.contain, 1.25),
            3.4
        );

        const nextScale = fitScales.contain * nextZoom;
        const nextEffectiveScale = nextScale / svgViewportScale;
        const scaledWidth = mapBounds.width * nextScale;
        const scaledHeight = mapBounds.height * nextScale;
        const nextBaseTranslateX = (canvasSize.width - scaledWidth) / 2 - mapBounds.x * nextScale;
        const nextBaseTranslateY = (canvasSize.height - scaledHeight) / 2 - mapBounds.y * nextScale;

        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;

        setZoom(nextZoom);
        setOffset({
            x: canvasSize.width / 2 - nextBaseTranslateX - centerX * nextEffectiveScale,
            y: canvasSize.height / 2 - nextBaseTranslateY - centerY * nextEffectiveScale,
        });
    }, [selectedRegion, canvasSize, fitScales.contain, mapBounds, svgViewportScale]);

    return (
        <div className={styles.italyMapDashboard}>
            <div className={styles.layoutContainer}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    {selectedRegionName && provinceResults ? (
                        <>
                            <button
                                type="button"
                                className={styles.sidebarBack}
                                onClick={() => setSelectedRegion(null)}
                            >
                                <ArrowLeft size={14} />
                                Torna a Ranking Regioni
                            </button>

                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>{selectedRegionName}</h2>
                                <span className={styles.sectionCount}>{selectedRegionProvinces.length} province</span>
                            </div>

                            <div className={styles.provinceList}>
                                {selectedRegionProvinces.map((item, index) => (
                                    <Link
                                        key={item.provincia}
                                        href={`/hub/provincia/${toUrlSlug(item.provincia)}`}
                                        className={styles.provinceItem}
                                    >
                                        <span className={styles.regionRank}>{index + 1}</span>
                                        <span className={styles.provinceNameText}>
                                            {item.provincia} {item.sigla ? `(${item.sigla})` : ""}
                                        </span>
                                        <span className={styles.regionNum}>{item.count}</span>
                                    </Link>
                                ))}
                            </div>

                            <Link href={`/hub/regione/${toUrlSlug(selectedRegionName)}`} className={styles.seeAll}>
                                Vedi pagina regione <ChevronRight size={14} />
                            </Link>
                        </>
                    ) : (
                        <>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Ranking Regioni</h2>
                                <span className={styles.sectionCount}>Aggiornato a oggi</span>
                            </div>

                            <div className={styles.regionList}>
                                {sortedRegions.map((region, index) => (
                                    <div
                                        key={region.id}
                                        className={`${styles.regionItem} ${selectedRegion === region.id ? styles.active : ""}`}
                                        onMouseEnter={() => setHoveredRegion(region.id)}
                                        onMouseLeave={() => setHoveredRegion(null)}
                                        onClick={() => onRegionClick(region.id)}
                                    >
                                        <span className={styles.regionRank}>{index + 1}</span>
                                        <span
                                            className={styles.regionColorDot}
                                            style={{ backgroundColor: getRegionColor(region.count) }}
                                        />
                                        <span className={styles.regionNameText}>{region.name}</span>
                                        <span className={styles.regionNum}>{region.count}</span>
                                        <div className={styles.regionBarWrap}>
                                            <div
                                                className={styles.regionBarFill}
                                                style={{ width: `${sortedRegions[0]?.count ? (region.count / sortedRegions[0].count) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                className={styles.seeAll}
                                onClick={() => {
                                    window.location.href = "/hub/concorsi";
                                }}
                            >
                                Vedi tutti i concorsi <Plus size={14} />
                            </button>
                        </>
                    )}
                </aside>

                {/* Map Area */}
                <main className={styles.mapArea}>
                    <div className={styles.mapToolbar}>
                        <div className={styles.legend}>
                            <span>Pochi</span>
                            <div className={styles.legendScale}>
                                {COLOR_SCALE.map((s, i) => (
                                    <div
                                        key={i}
                                        className={styles.legendSwatch}
                                        style={{ backgroundColor: s.color }}
                                    />
                                ))}
                            </div>
                            <span>Molti</span>
                        </div>
                        <div className={styles.statPill}>
                            <span>Concorsi Attivi:</span>
                            <strong>{displayedTotalCount.toLocaleString()}</strong>
                            <span className={`${styles.badge} ${styles.badgeUp}`}>Dati live</span>
                        </div>
                    </div>

                    <div
                        ref={mapCanvasRef}
                        className={`${styles.mapCanvas} ${!isMapReady ? styles.mapCanvasPending : ""}`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={(e) => {
                            e.preventDefault();
                            handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
                        }}
                    >
                        <div className={styles.zoomControls}>
                            <button className={styles.zoomBtn} onClick={() => handleZoom(0.2)}><Plus size={20} /></button>
                            <button className={styles.zoomBtn} onClick={() => handleZoom(-0.2)}><Minus size={20} /></button>
                            <button className={styles.zoomBtn} onClick={resetZoom}><Maximize2 size={18} /></button>
                        </div>

                        <svg
                            viewBox="0 0 1480 1720"
                            className={styles.italySvg}
                            preserveAspectRatio="xMidYMid meet"
                        >
                            <g
                                ref={mapGroupRef}
                                className={styles.mapGroup}
                                style={{
                                    transform: `translate(${baseTranslate.x + offset.x}px, ${baseTranslate.y + offset.y}px) scale(${effectiveScale})`,
                                    transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)"
                                }}
                            >
                                {Object.entries(MAP_PATHS).map(([id, path]) => {
                                    const data = regionData[id];
                                    const isHovered = hoveredRegion === id;
                                    const isSelected = selectedRegion === id;
                                    const isDimmed = (hoveredRegion || selectedRegion) && !(isHovered || isSelected);

                                    return (
                                        <path
                                            key={id}
                                            ref={(node) => {
                                                pathRefs.current[id] = node;
                                            }}
                                            d={path}
                                            fill={getRegionColor(data.count)}
                                            className={`${styles.regionPath} ${isDimmed ? styles.dimmed : ""} ${isSelected ? styles.highlighted : ""}`}
                                            onMouseEnter={(e) => onRegionHover(e, id)}
                                            onMouseMove={(e) => setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }))}
                                            onMouseLeave={onRegionLeave}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRegionClick(id);
                                            }}
                                        />
                                    );
                                })}
                            </g>
                        </svg>

                        {/* Tooltip */}
                        <div
                            className={`${styles.tooltip} ${tooltip.visible ? styles.tooltipVisible : ""}`}
                            style={{ left: tooltip.x, top: tooltip.y }}
                        >
                            {tooltip.regionId && (
                                <>
                                    <div className={styles.tooltipRegion}>{regionData[tooltip.regionId]?.name}</div>
                                    <div className={styles.tooltipValue}>{regionData[tooltip.regionId]?.count ?? 0}</div>
                                    <div className={styles.tooltipSub}>Concorsi attivi</div>
                                    <div className={styles.tooltipRank}>#{sortedRegions.findIndex(r => r.id === tooltip.regionId) + 1} Nazionale</div>
                                </>
                            )}
                        </div>

                        {/* Detail Card (visible when selected) */}
                        <div className={`${styles.detailCard} ${selectedRegion ? styles.detailCardVisible : ""}`}>
                            {selectedRegion && (
                                <div className={styles.animateFadeUp}>
                                    <div className={styles.detailCardRegion}>{regionData[selectedRegion]?.name}</div>
                                    <div className={styles.detailCardValue}>
                                        {regionData[selectedRegion]?.count ?? 0}
                                        <span className={styles.detailCardChange}>
                                            {selectedRegionRank > 0 ? `#${selectedRegionRank}` : "—"}
                                        </span>
                                    </div>
                                    <div className={styles.detailCardSub}>Confronto live: regione vs media nazionale</div>

                                    <div className={styles.detailChart}>
                                        {detailBars.map((bar) => (
                                            <div key={bar.key} className={styles.detailBarGroup}>
                                                <div
                                                    className={`${styles.detailBar} ${bar.current ? styles.detailBarCurrent : styles.detailBarPrev}`}
                                                    style={{ height: bar.height }}
                                                />
                                                <span className={styles.detailBarLabel}>{bar.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={styles.detailCta} onClick={() => window.location.href = `/hub/regione/${toUrlSlug(regionData[selectedRegion]?.name ?? "")}`}>
                                        Vedi tutti i concorsi <ChevronRight size={16} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ItalyMapDashboard;
