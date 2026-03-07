"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import styles from "./ItalyMapDashboard.module.css";
import { MAP_PATHS } from "./mapPaths";
import { REGION_DATA, getRegionColor, COLOR_SCALE } from "./mapData";
import {
    ChevronRight,
    Plus,
    Minus,
    Maximize2,
    Search,
    Settings,
    BookmarkIcon,
    Map as MapIcon,
    List,
    Target
} from "lucide-react";

const ItalyMapDashboard = () => {
    // Map State
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Tooltip state
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, regionId: "" });

    const svgRef = useRef<SVGSVGElement>(null);

    // Sorted regions for the sidebar
    const sortedRegions = useMemo(() => {
        return Object.entries(REGION_DATA)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([id, data]) => ({ id, ...data }));
    }, []);

    const totalCount = useMemo(() => {
        return Object.values(REGION_DATA).reduce((acc, curr) => acc + curr.count, 0);
    }, []);

    // Handlers
    const handleZoom = (delta: number) => {
        setScale(prev => Math.min(Math.max(prev + delta, 0.5), 5));
    };

    const resetZoom = () => {
        setScale(1);
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
        const rect = e.currentTarget.getBoundingClientRect();
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

    return (
        <div className={styles.italyMapDashboard}>
            {/* Title Bar */}
            <header className={styles.titleBar}>
                <div className={styles.statPill}>
                    <span>Concorsi Attivi:</span>
                    <strong>{totalCount.toLocaleString()}</strong>
                    <span className={`${styles.badge} ${styles.badgeUp}`}>+42 oggi</span>
                </div>
                <div className={styles.statPill}>
                    <span>Regioni monitoring:</span>
                    <strong>20</strong>
                </div>
                <h1>inPA – Concorsi per Regione</h1>
            </header>

            <div className={styles.layoutContainer}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
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
                                        style={{ width: `${(region.count / sortedRegions[0].count) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.seeAll}>
                        Mostra tutte le 20 regioni <Plus size={14} />
                    </div>
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

                        <div className={styles.mapControls}>
                            <button className={`${styles.mapBtn} ${styles.active}`} title="Vista Mappa">
                                <MapIcon size={18} />
                            </button>
                            <button className={styles.mapBtn} title="Vista Lista">
                                <List size={18} />
                            </button>
                            <button className={styles.mapBtn} title="Filtri">
                                <Search size={18} />
                            </button>
                        </div>
                    </div>

                    <div
                        className={styles.mapCanvas}
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
                            ref={svgRef}
                            viewBox="0 0 1480 1720"
                            className={styles.italySvg}
                            style={{
                                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                                transition: isDragging ? "none" : "transform 0.1s ease-out"
                            }}
                        >
                            <g className={styles.mapGroup}>
                                {Object.entries(MAP_PATHS).map(([id, path]) => {
                                    const data = REGION_DATA[id];
                                    const isHovered = hoveredRegion === id;
                                    const isSelected = selectedRegion === id;
                                    const isDimmed = (hoveredRegion || selectedRegion) && !(isHovered || isSelected);

                                    return (
                                        <path
                                            key={id}
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
                                    <div className={styles.tooltipRegion}>{REGION_DATA[tooltip.regionId].name}</div>
                                    <div className={styles.tooltipValue}>{REGION_DATA[tooltip.regionId].count}</div>
                                    <div className={styles.tooltipSub}>Concorsi attivi</div>
                                    <div className={styles.tooltipRank}>#{sortedRegions.findIndex(r => r.id === tooltip.regionId) + 1} Nazionale</div>
                                </>
                            )}
                        </div>

                        {/* Detail Card (visible when selected) */}
                        <div className={`${styles.detailCard} ${selectedRegion ? styles.detailCardVisible : ""}`}>
                            {selectedRegion && (
                                <div className={styles.animateFadeUp}>
                                    <div className={styles.detailCardRegion}>{REGION_DATA[selectedRegion].name}</div>
                                    <div className={styles.detailCardValue}>
                                        {REGION_DATA[selectedRegion].count}
                                        <span className={styles.detailCardChange}>{REGION_DATA[selectedRegion].change}</span>
                                    </div>
                                    <div className={styles.detailCardSub}>Concorsi pubblicati negli ultimi 30 giorni</div>

                                    <div className={styles.detailChart}>
                                        <div className={`${styles.detailBar} ${styles.detailBarCurrent}`} style={{ height: "100%" }} />
                                        <div className={`${styles.detailBar} ${styles.detailBarPrev}`} style={{ height: "65%" }} />
                                        <div className={`${styles.detailBar} ${styles.detailBarPrev}`} style={{ height: "45%" }} />
                                        <div className={`${styles.detailBar} ${styles.detailBarPrev}`} style={{ height: "80%" }} />
                                    </div>

                                    <div className={styles.detailCta} onClick={() => window.location.href = `/regione/${REGION_DATA[selectedRegion].name.toLowerCase().replace(/ /g, '-')}`}>
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
