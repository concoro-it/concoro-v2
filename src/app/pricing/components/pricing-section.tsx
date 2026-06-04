"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buildProCheckoutUrl, PLANS } from "@/lib/stripe/prices";
import { buildAuthQueryParams } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils";

const freeFeatures = [
    "Ricerca e consultazione dei concorsi pubblici",
    "Pagine per regione, provincia, ente e settore",
    "Dashboard personale con concorsi salvati",
    "Accesso iniziale agli strumenti di monitoraggio",
];

export function PricingSection({
    userId,
    userEmail,
    initialBilling = "monthly",
    availableBillingCycles = { monthly: true, yearly: true },
}: {
    userId?: string;
    userEmail?: string;
    initialBilling?: "monthly" | "yearly";
    availableBillingCycles?: { monthly: boolean; yearly: boolean };
}) {
    const canUseMonthly = availableBillingCycles.monthly;
    const canUseYearly = availableBillingCycles.yearly;
    const [isYearly, setIsYearly] = useState(() => {
        if (!canUseMonthly && canUseYearly) return true;
        if (!canUseYearly) return false;
        return initialBilling === "yearly";
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const yearlySavings = Math.round((1 - PLANS.pro.price_yearly / (PLANS.pro.price_monthly * 12)) * 100);
    const selectedCycle = isYearly ? "yearly" : "monthly";
    const selectedPrice = isYearly ? PLANS.pro.price_yearly : PLANS.pro.price_monthly;

    const handleSubscribe = async () => {
        if (!userId) {
            window.location.href = `/login?${buildAuthQueryParams({
                redirectTo: `/pricing?billing=${selectedCycle}&checkout=pro`,
                source: "pricing",
                intent: "pro",
            })}`;
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (!canUseMonthly && !canUseYearly) {
                throw new Error("Piano non configurato al momento.");
            }

            const checkoutUrl = buildProCheckoutUrl(selectedCycle, {
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
        <section className="bg-[hsl(210,55%,98%)] py-14 text-slate-900 md:py-20 [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
            <div className="mx-auto max-w-[78rem] px-4">
                <div className="mx-auto max-w-4xl space-y-5 text-center">
                    <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-balance text-center text-4xl font-semibold leading-[1.04] tracking-tight text-slate-900 md:text-6xl">
                        Prezzi semplici per seguire i concorsi giusti
                    </h1>
                    <p className="mx-auto max-w-3xl text-base leading-relaxed text-slate-700 md:text-lg">
                        Parti gratis, passa a Pro quando vuoi monitorare piu bandi, ricevere alert completi e usare Genio per leggere i concorsi piu velocemente.
                    </p>
                    {canUseMonthly && canUseYearly ? (
                        <div className="mx-auto mt-6 grid w-full max-w-xs grid-cols-2 rounded-full border border-slate-300 bg-white p-1 shadow-sm">
                            <button
                                type="button"
                                onClick={() => setIsYearly(false)}
                                className={cn(
                                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                                    !isYearly ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                                )}
                            >
                                Mensile
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsYearly(true)}
                                className={cn(
                                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                                    isYearly ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                                )}
                            >
                                Annuale
                                <span className={cn("ml-1.5 rounded-full px-1.5 py-0.5 text-[11px]", isYearly ? "bg-white/15 text-white" : "bg-[#0A4E88]/10 text-[#0A4E88]")}>
                                    -{yearlySavings}%
                                </span>
                            </button>
                        </div>
                    ) : null}
                    {!canUseMonthly || !canUseYearly ? (
                        <p className="text-sm text-slate-500">
                            {canUseMonthly ? "Al momento e disponibile solo la fatturazione mensile." : canUseYearly ? "Al momento e disponibile solo la fatturazione annuale." : "Il checkout e in configurazione, riprova a breve."}
                        </p>
                    ) : null}
                </div>

                {error && (
                    <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-12 grid gap-0 md:mt-16 md:grid-cols-5">
                    <div className="flex flex-col justify-between space-y-6 rounded-2xl border border-slate-200 bg-white/90 p-6 md:col-span-2 md:my-3 md:rounded-r-none md:border-r-0 lg:p-8">
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Gratuito</h2>
                                <span className="my-4 block text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">€0 / mese</span>
                                <p className="text-sm text-slate-500">Per candidato</p>
                            </div>

                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="w-full rounded-xl"
                            >
                                <Link href={userId ? "/hub/bacheca" : "/signup"}>
                                    {userId ? "Vai alla dashboard" : "Inizia gratis"}
                                </Link>
                            </Button>

                            <hr className="border-dashed border-slate-200" />

                            <ul className="space-y-3 text-sm text-slate-700">
                                {freeFeatures.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <Check className="mt-0.5 size-4 shrink-0 text-[#0A4E88]" strokeWidth={2.5} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_22px_50px_-35px_rgba(15,23,42,0.55)] md:col-span-3 lg:p-8">
                        <div className="grid gap-8 sm:grid-cols-2">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">{PLANS.pro.name}</h2>
                                    <span className="my-4 block text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                        €{selectedPrice.toFixed(2).replace(".", ",")} {isYearly ? "/ anno" : "/ mese"}
                                    </span>
                                    <p className="text-sm text-slate-500">Per candidato</p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        {PLANS.pro.trial_days} giorni gratis, poi rinnovo {isYearly ? "annuale" : "mensile"}.
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    onClick={handleSubscribe}
                                    disabled={isLoading || (!canUseMonthly && !canUseYearly)}
                                    size="lg"
                                    className="w-full rounded-xl"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="size-5 animate-spin" />
                                            Attendere...
                                        </>
                                    ) : (
                                        "Prova gratis"
                                    )}
                                </Button>
                            </div>

                            <div>
                                <div className="text-lg font-semibold tracking-tight text-slate-900">Tutto nel piano gratuito, piu:</div>

                                <ul className="mt-5 space-y-3 text-sm text-slate-700">
                                    {PLANS.pro.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <Check className="mt-0.5 size-4 shrink-0 text-[#0A4E88]" strokeWidth={2.5} />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
