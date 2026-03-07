"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { PLANS } from "@/lib/stripe/prices";

const freeFeatures = [
    "Accesso ai concorsi sul portale principale",
    "5 risultati nelle pagine SEO (regione/settore/ente)",
    "5 risultati di ricerca semantica",
    "Salva i tuoi concorsi preferiti",
    "Dashboard personale",
];

export function PricingSection({ userId }: { userId?: string }) {
    const [isYearly, setIsYearly] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubscribe = async () => {
        if (!userId) {
            // Se l'utente non è loggato, reindirizzalo al signup
            window.location.href = "/signup";
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const priceId = isYearly ? PLANS.pro.price_id_yearly : PLANS.pro.price_id_monthly;

            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    priceId,
                    userId,
                }),
            });

            if (!response.ok) {
                throw new Error("Errore durante la creazione del checkout");
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (err: any) {
            console.error("Subscription Error:", err);
            setError("Impossibile procedere al pagamento. Riprova più tardi.");
            setIsLoading(false);
        }
    };

    return (
        <div className="container max-w-container mx-auto px-4 py-16">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Scegli il tuo piano</h1>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    Inizia gratuitamente, passa a Pro quando sei pronto per sbloccare tutto.
                </p>

                {/* Toggle Switch */}
                <div className="mt-8 flex items-center justify-center gap-3">
                    <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>Mensile</span>
                    <button
                        onClick={() => setIsYearly(!isYearly)}
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        role="switch"
                        aria-checked={isYearly}
                    >
                        <span className="sr-only">Passa alla fatturazione {isYearly ? 'mensile' : 'annuale'}</span>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isYearly ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Annuale <span className="ml-1.5 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Risparmi 16%</span>
                    </span>
                </div>
            </div>

            {error && (
                <div className="max-w-3xl mx-auto mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Free */}
                <div className="border border-border rounded-2xl p-8 bg-white transition-all hover:shadow-md">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">Gratuito</h2>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-4xl font-bold">€0</span>
                            <span className="text-muted-foreground">/sempre</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Per chi vuole iniziare a esplorare</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                        {freeFeatures.map(f => (
                            <li key={f} className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                <span className="text-muted-foreground">{f}</span>
                            </li>
                        ))}
                    </ul>
                    <Link href={userId ? "/dashboard" : "/signup"}
                        className="block w-full text-center py-2.5 border border-border rounded-xl font-medium text-sm hover:bg-secondary transition-colors">
                        {userId ? "Vai alla Dashboard" : "Inizia gratis"}
                    </Link>
                </div>

                {/* Pro */}
                <div className="border-2 border-primary rounded-2xl p-8 bg-primary/5 relative shadow-lg transform transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
                            Più popolare
                        </span>
                    </div>
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">{PLANS.pro.name}</h2>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-4xl font-bold">
                                €{isYearly ? (PLANS.pro.price_yearly / 12).toFixed(2).replace('.', ',') : PLANS.pro.price_monthly.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-muted-foreground">/mese</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            {isYearly ? `Fatturato annualmente (€${PLANS.pro.price_yearly.toFixed(2).replace('.', ',')})` : "Fatturato mensilmente"}
                        </p>
                    </div>
                    <ul className="space-y-3 mb-8">
                        {PLANS.pro.features.map(f => (
                            <li key={f} className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                <span className="font-medium text-foreground">{f}</span>
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={handleSubscribe}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Attendere...
                            </>
                        ) : (
                            "Abbonati ora"
                        )}
                    </button>
                </div>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8 flex items-center justify-center gap-2">
                Pagamento sicuro tramite Stripe. Puoi disdire in qualsiasi momento.
            </p>
        </div>
    );
}
