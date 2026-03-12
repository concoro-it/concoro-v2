'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionStatusProps {
    subscription: any; // Ideally typed to match Stripe subscription model
}

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
    const [isLoading, setIsLoading] = useState(false);

    const isPremium = subscription?.status === 'active' || subscription?.status === 'trialing';
    const isCanceled = subscription?.cancel_at_period_end;

    // Format dates safely
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        try {
            return new Intl.DateTimeFormat('it-IT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(new Date(dateString));
        } catch (e) {
            return '';
        }
    };

    const handleManageSubscription = async () => {
        setIsLoading(true);
        try {
            // Call the customer portal endpoint to manage billing
            const response = await fetch('/api/stripe/create-portal-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (response.ok && data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Failed to open customer portal');
            }
        } catch (error) {
            console.error('Portal error:', error);
            toast.error('Impossibile accedere al portale di fatturazione in questo momento.');
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            Stato Abbonamento
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Gestisci il tuo piano e la fatturazione
                        </CardDescription>
                    </div>
                    {isPremium ? (
                        <Badge variant="default" className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 flex gap-1">
                            <Crown className="w-3.5 h-3.5" /> Premium
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground bg-slate-50">
                            Base (Gratuito)
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {isPremium ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-green-900">
                                    Il tuo piano Pro e attivo
                                </p>
                                <p className="text-sm text-green-700 mt-1">
                                    Hai pieno accesso ai concorsi, agli alert mirati e al supporto di Genio.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    <Calendar className="w-4 h-4 text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Prossimo rinnovo</p>
                                    <p className="font-medium">
                                        {subscription.current_period_end
                                            ? formatDate(subscription.current_period_end)
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {isCanceled && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Stato</p>
                                        <p className="font-medium text-amber-700">Abbonamento disdetto</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Stai usando il piano gratuito. Passa a Pro quando vuoi monitorare piu bandi senza limiti e con notifiche mirate.
                        </p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                {isPremium ? (
                    <>
                        <p className="text-xs text-muted-foreground text-center sm:text-left">
                            Gestisci pagamenti e fatture tramite il portale sicuro.
                        </p>
                        <Button
                            variant="outline"
                            onClick={handleManageSubscription}
                            disabled={isLoading}
                            className="w-full sm:w-auto"
                        >
                            {isLoading ? 'Apertura portale...' : 'Gestisci Abbonamento'}
                        </Button>
                    </>
                ) : (
                    <>
                        <p className="text-xs text-muted-foreground text-center sm:text-left">
                            Passa a Pro per seguire i concorsi senza interruzioni
                        </p>
                        <Button
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-opacity text-white"
                            onClick={() => window.location.href = '/pricing'}
                        >
                            Passa a Pro
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    );
}
