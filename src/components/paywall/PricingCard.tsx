'use client';

import { Check, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface PricingFeature {
    name: string;
    included: boolean;
}

interface PricingCardProps {
    name: string;
    description: string;
    price: number;
    interval?: 'month' | 'year';
    features: PricingFeature[];
    isPopular?: boolean;
    buttonText?: string;
    onSubscribe?: () => void;
    isLoading?: boolean;
    className?: string;
}

export function PricingCard({
    name,
    description,
    price,
    interval = 'month',
    features,
    isPopular,
    buttonText = 'Scegli questo piano',
    onSubscribe,
    isLoading,
    className,
}: PricingCardProps) {
    return (
        <div
            className={cn(
                'relative flex flex-col p-6 sm:p-8 bg-white rounded-2xl border transition-all duration-200',
                isPopular ? 'border-primary shadow-lg shadow-primary/10 scale-100 sm:scale-[1.02] z-10' : 'border-border shadow-sm',
                className
            )}
        >
            {isPopular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" />
                        Più scelto
                    </span>
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-xl font-bold">{name}</h3>
                <p className="text-sm text-muted-foreground mt-2 min-h-[40px]">{description}</p>
            </div>

            <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">€{price.toFixed(2)}</span>
                <span className="text-muted-foreground font-medium">/{interval === 'month' ? 'mese' : 'anno'}</span>
            </div>

            <Button
                className={cn(
                    'w-full mb-8 font-semibold',
                    isPopular ? 'bg-primary text-primary-foreground hover:opacity-90' : ''
                )}
                variant={isPopular ? 'default' : 'outline'}
                size="lg"
                onClick={onSubscribe}
                disabled={isLoading}
            >
                {isLoading ? 'Elaborazione...' : buttonText}
            </Button>

            <div className="space-y-4 flex-1">
                {features.map((feature, i) => (
                    <div key={i} className={cn("flex items-start gap-3", !feature.included && "opacity-50")}>
                        <div className="mt-0.5 flex-shrink-0">
                            {feature.included ? (
                                <Check className="w-4 h-4 text-green-500" strokeWidth={3} />
                            ) : (
                                <X className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
                            )}
                        </div>
                        <span className={cn("text-sm", !feature.included && "text-muted-foreground line-through")}>
                            {feature.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
