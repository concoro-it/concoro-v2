import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { PaywallBanner } from '@/components/paywall/PaywallBanner';
import { Bot, Send, Sparkles } from 'lucide-react';

export const metadata: Metadata = { title: 'Genio - Assistente AI | Concoro' };

export default async function ChatPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const tier = await getUserTier(supabase);
    const hasAccess = tier === 'pro' || tier === 'admin';

    if (!hasAccess) {
        return (
            <div className="container max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-4 text-center">Incontra Genio</h1>
                <p className="text-muted-foreground text-center mb-8 max-w-lg mx-auto">
                    Il tuo assistente AI personale per interpretare i bandi, calcolare i punteggi, generare quiz di preparazione e consigliarti il percorso migliore.
                </p>
                <div className="w-full max-w-xl mx-auto">
                    <div className="relative overflow-hidden rounded-xl border border-border shadow-sm mb-6 bg-white shrink-0 aspect-video">
                        <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-b from-transparent to-white/90 z-10" />
                        <div className="p-4 flex flex-col gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm">
                                    Ciao! Sono Genio. Come posso aiutarti oggi con i concorsi pubblici?
                                </div>
                            </div>
                            <div className="flex items-start gap-3 justify-end">
                                <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm">
                                    Ho bisogno di un quiz per prepararmi al concorso INPS.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm">
                                    Certamente! Sto generando un quiz basato sui materi d&apos;esame previsti...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-full max-w-xl mx-auto">
                    <PaywallBanner lockedCount={1} isLoggedIn={true} />
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
            <header className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-tight">Genio AI</h1>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-success rounded-full block"></span> Online
                    </p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-6">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-surface border border-border px-4 py-3 rounded-2xl rounded-tl-sm text-sm max-w-[85%]">
                        <p>Benvenuto nell&apos;assistente Genio! Cerca tra le FAQ, chiedi supporto per compilare una domanda di partecipazione o richiedi riassunti di bandi complessi.</p>
                        <hr className="my-2 border-border" />
                        <p className="text-xs text-muted-foreground">Nota: La funzionalità AI completa verrà attivata a breve. Al momento puoi chiedermi domande esplorative.</p>
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-4 relative">
                <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                <form className="relative flex items-center">
                    <input
                        type="text"
                        placeholder="Chiedi a Genio..."
                        disabled
                        className="w-full bg-surface border border-input rounded-full py-3.5 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                    <button
                        type="button"
                        disabled
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
                <div className="text-center mt-3">
                    <p className="text-xs text-muted-foreground">Genio può sbagliare. Verifica sempre le informazioni sui bandi ufficiali.</p>
                </div>
            </div>
        </div>
    );
}
