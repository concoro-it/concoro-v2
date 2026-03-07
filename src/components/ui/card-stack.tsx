"use client"

import { useState } from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { cn } from "@/lib/utils/cn"

export interface CardData {
    id: string
    title: string
    description: string
    color?: string
    badge?: string
    badgeColor?: string
}

export interface CardStackProps {
    cards?: CardData[]
    className?: string
}

const SWIPE_THRESHOLD = 50

export function CardStack({
    cards = [],
    className,
}: CardStackProps) {
    const [activeIndex, setActiveIndex] = useState(0)
    const [isDragging, setIsDragging] = useState(false)

    if (!cards || cards.length === 0) {
        return null
    }

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const { offset, velocity } = info
        const swipe = Math.abs(offset.x) * velocity.x

        if (offset.x < -SWIPE_THRESHOLD || swipe < -1000) {
            // Swiped left - go to next card
            setActiveIndex((prev) => (prev + 1) % cards.length)
        } else if (offset.x > SWIPE_THRESHOLD || swipe > 1000) {
            // Swiped right - go to previous card
            setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length)
        }
        setIsDragging(false)
    }

    const getStackOrder = () => {
        const reordered = []
        for (let i = 0; i < cards.length; i++) {
            const index = (activeIndex + i) % cards.length
            reordered.push({ ...cards[index], stackPosition: i })
        }
        return reordered.reverse() // Reverse so top card renders last
    }

    const displayCards = getStackOrder()

    return (
        <div className={cn("flex flex-col items-center", className)}>
            <div className="relative h-[280px] w-full max-w-[280px]">
                <AnimatePresence mode="popLayout">
                    {displayCards.map((card) => {
                        const isTopCard = card.stackPosition === 0

                        return (
                            <motion.div
                                key={card.id}
                                layoutId={card.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    x: 0,
                                    top: card.stackPosition * 8,
                                    left: card.stackPosition * 8,
                                    zIndex: cards.length - card.stackPosition,
                                    rotate: (card.stackPosition - 1) * 2,
                                }}
                                exit={{ opacity: 0, scale: 0.8, x: -200 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 25,
                                }}
                                drag={isTopCard ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.7}
                                onDragStart={() => setIsDragging(true)}
                                onDragEnd={handleDragEnd}
                                whileDrag={{ scale: 1.05, cursor: "grabbing" }}
                                className={cn(
                                    "absolute w-full h-48 cursor-pointer rounded-2xl border bg-white p-6 shadow-sm overflow-hidden border-slate-200",
                                    isTopCard && "cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors"
                                )}
                                style={{ backgroundColor: card.color || undefined }}
                            >
                                <div className="flex flex-col gap-3 h-full">
                                    {card.badge && (
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full w-fit",
                                            card.badgeColor || "bg-slate-100 text-slate-700"
                                        )}>
                                            {card.badge}
                                        </span>
                                    )}
                                    <div className="min-w-0 flex-1 mt-2">
                                        <h5 className="text-slate-900 leading-snug text-base md:text-sm lg:text-sm xl:text-sm">
                                            {card.description}
                                        </h5>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>

            {cards.length > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                    {cards.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                index === activeIndex
                                    ? "w-6 bg-blue-600"
                                    : "w-2 bg-slate-200 hover:bg-slate-300"
                            )}
                            aria-label={`Go to card ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
