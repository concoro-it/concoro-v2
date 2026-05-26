"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { buildProCheckoutUrl, PLANS } from "@/lib/stripe/prices";

const freeFeatures = [
    "Esplora i concorsi sul portale principale",
    "Accesso iniziale alle pagine per regione, ente e settore",
    "Salva i concorsi che vuoi monitorare",
    "Dashboard personale per ripartire subito",
    "Prova Concoro prima di attivare il monitoraggio completo",
];

export function PricingSection({
    userId,
    userEmail,
    initialBilling = "yearly",
    availableBillingCycles = { monthly: true, yearly: true },
}: {
    userId?: string;
    userEmail?: string;
    initialBilling?: "monthly" | "yearly";
    availableBillingCycles?: { monthly: boolean; yearly: boolean };
}) {
    const canUseMonthly = availableBillingCycles.monthly;
    const canUseYearly = availableBillingCycles.yearly;
    const [isYearly, setIsYearly] = useState(initialBilling === "yearly" && canUseYearly);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const yearlySavings = Math.round((1 - PLANS.pro.price_yearly / (PLANS.pro.price_monthly * 12)) * 100);

    const handleSubscribe = async () => {
        if (!userId) {
            // Se l'utente non è loggato, reindirizzalo al signup
            window.location.href = "/signup";
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (!canUseMonthly && !canUseYearly) {
                throw new Error("Piano non configurato al momento.");
            }

            const checkoutUrl = buildProCheckoutUrl(isYearly ? "yearly" : "monthly", {
                clientReferenceId: userId,
                email: userEmail,
            });
            window.location.href = checkoutUrl;
        } catch (err: unknown) {
            console.error("Subscription Error:", err);
            const message = err instanceof Error ? err.message : "Impossibile procedere al pagamento. Riprova più tardi.";
            setError(message);
            setIsLoading(false);
        }
    };

    return (
        <div className="container max-w-container mx-auto px-4 py-16">
            <div className="text-center mb-12 max-w-3xl mx-auto">
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-5">
                    7 giorni gratis, poi scegli il ritmo giusto
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-4">Monitora i bandi rilevanti, non solo i primi risultati</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Prova Concoro Pro gratis per {PLANS.pro.trial_days} giorni. Inserisci la carta al checkout, poi il piano si rinnova solo dopo il periodo di prova.
                </p>
                <div className="mt-5">
                    {userId ? (
                        <p className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                            Accesso effettuato come <span className="ml-1 font-semibold text-foreground">{userEmail ?? "utente autenticato"}</span>
                        </p>
                    ) : (
                        <p className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-800">
                            Non hai effettuato l&apos;accesso. Ti chiederemo il login prima del checkout.
                        </p>
                    )}
                </div>

                {/* Toggle Switch */}
                {canUseMonthly && canUseYearly ? (
                    <>
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
                                Annuale <span className="ml-1.5 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Risparmi {yearlySavings}%</span>
                            </span>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Entrambi i piani includono {PLANS.pro.trial_days} giorni di prova gratuita con carta richiesta al checkout.
                        </p>
                    </>
                ) : (
                    <p className="mt-6 text-sm text-muted-foreground">
                        {canUseMonthly ? "Al momento e disponibile solo la fatturazione mensile." : canUseYearly ? "Al momento e disponibile solo la fatturazione annuale." : "Il checkout e in configurazione, riprova a breve."}
                    </p>
                )}
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
                        <p className="text-sm text-muted-foreground mt-2">Per iniziare a esplorare e capire come funziona Concoro</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                        {freeFeatures.map(f => (
                            <li key={f} className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                <span className="text-muted-foreground">{f}</span>
                            </li>
                        ))}
                    </ul>
                    <Link href={userId ? "/hub/bacheca" : "/signup"}
                        className="block w-full text-center py-2.5 border border-border rounded-xl font-medium text-sm hover:bg-secondary transition-colors">
                        {userId ? "Vai alla Dashboard" : "Inizia gratis"}
                    </Link>
                </div>

                {/* Pro */}
                <div className="border-2 border-primary rounded-2xl p-8 bg-primary/5 relative shadow-lg transform transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
                            Consigliato
                        </span>
                    </div>
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">{PLANS.pro.name}</h2>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-4xl font-bold">
                                €{isYearly ? PLANS.pro.price_yearly.toFixed(2).replace('.', ',') : PLANS.pro.price_monthly.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-muted-foreground">{isYearly ? "/anno" : "/mese"}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            {isYearly
                                ? `${PLANS.pro.trial_days} giorni gratis, poi fatturato annualmente (€${PLANS.pro.price_yearly.toFixed(2).replace('.', ',')})`
                                : `${PLANS.pro.trial_days} giorni gratis, poi fatturato mensilmente`}
                        </p>
                        <p className="text-sm font-medium text-foreground mt-3">
                            Per chi vuole monitorare bandi utili con continuita e arrivare prima sulle scadenze.
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
                            isYearly ? "Prova gratis, poi annuale" : "Prova gratis, poi mensile"
                        )}
                    </button>
                    <p className="mt-3 text-xs text-center text-muted-foreground">
                        Carta richiesta per attivare la prova. Puoi disdire da Stripe prima del rinnovo.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto mt-8 rounded-2xl border border-border bg-muted/20 p-6">
                <h3 className="font-semibold text-base">Perche pagare per Concoro Pro</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Gli utenti passano a Pro quando smettono di cercare in modo occasionale e iniziano a monitorare opportunita concrete. Il valore non e vedere piu pagine: e ricevere meno rumore, piu segnali utili e piu velocita nel decidere.
                </p>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8 flex items-center justify-center gap-2">
                Pagamento sicuro tramite Stripe. Carta richiesta anche durante la prova gratuita.
            </p>
        </div>
    );
}
