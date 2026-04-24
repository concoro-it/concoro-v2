'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BookmarkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { UpgradeModal } from '@/components/paywall/UpgradeModal';
import { UpgradeProModal } from '@/components/paywall/UpgradeProModal';

interface SaveButtonProps {
    concorsoId: string;
    initialSaved?: boolean;
    className?: string;
    iconOnly?: boolean;
    skipStatusHydrationCheck?: boolean;
}

export function SaveButton({
    concorsoId,
    initialSaved,
    className,
    iconOnly = false,
    skipStatusHydrationCheck = false,
}: SaveButtonProps) {
    const [isSaved, setIsSaved] = useState(Boolean(initialSaved));
    const [isLoading, setIsLoading] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showUpgradeProModal, setShowUpgradeProModal] = useState(false);
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        if (typeof initialSaved === 'boolean') {
            setIsSaved(initialSaved);
        }
    }, [initialSaved]);

    useEffect(() => {
        if (skipStatusHydrationCheck || typeof initialSaved === 'boolean') return;

        const checkSavedStatus = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await supabase
                .from('saved_concorsi')
                .select('id')
                .eq('user_id', session.user.id)
                .eq('concorso_id', concorsoId)
                .maybeSingle();

            if (data && !error) {
                setIsSaved(true);
            }
        };

        checkSavedStatus();
    }, [concorsoId, skipStatusHydrationCheck, initialSaved, supabase]);

    const handleSaveToggle = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation if button is inside a Link
        e.stopPropagation();

        setIsLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setShowRegisterModal(true);
                setIsLoading(false);
                return;
            }

            if (isSaved) {
                const { error } = await supabase
                    .from('saved_concorsi')
                    .delete()
                    .eq('user_id', session.user.id)
                    .eq('concorso_id', concorsoId);

                if (error) throw error;
                setIsSaved(false);
                toast.success('Concorso rimosso dai salvati');
            } else {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('tier')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if ((profile?.tier ?? 'free') === 'free') {
                    const { count } = await supabase
                        .from('saved_concorsi')
                        .select('id', { count: 'exact', head: true })
                        .eq('user_id', session.user.id);

                    if ((count ?? 0) >= 1) {
                        setShowUpgradeProModal(true);
                        toast.error('Con il piano gratuito puoi salvare un solo concorso.');
                        setIsLoading(false);
                        return;
                    }
                }

                const { error } = await supabase
                    .from('saved_concorsi')
                    .insert({
                        user_id: session.user.id,
                        concorso_id: concorsoId
                    });

                if (error) throw error;
                setIsSaved(true);
                toast.success('Concorso salvato con successo');
            }
        } catch (error) {
            console.error('Error toggling save:', error);
            toast.error('Si è verificato un errore. Riprova più tardi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Button
                variant={iconOnly ? 'ghost' : (isSaved ? 'secondary' : 'outline')}
                size={iconOnly ? 'icon' : 'sm'}
                onClick={handleSaveToggle}
                disabled={isLoading}
                className={cn(
                    "transition-all",
                    iconOnly ? "h-8 w-8 rounded-full" : "rounded-full",
                    isSaved && !iconOnly ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" : "",
                    className
                )}
                title={isSaved ? "Rimuovi dai salvati" : "Salva concorso"}
            >
                <BookmarkIcon
                    className={cn(
                        iconOnly ? "h-4 w-4" : "h-4 w-4 mr-2",
                        isSaved ? "fill-primary text-primary" : "text-muted-foreground"
                    )}
                />
                {!iconOnly && (isSaved ? 'Salvato' : 'Salva')}
            </Button>
            <UpgradeModal isOpen={showRegisterModal} onOpenChange={setShowRegisterModal} />
            <UpgradeProModal isOpen={showUpgradeProModal} onOpenChange={setShowUpgradeProModal} />
        </>
    );
}
