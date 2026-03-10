'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
    title: string;
    slug: string;
    className?: string;
    iconOnly?: boolean;
}

export function ShareButton({ title, slug, className, iconOnly = false }: ShareButtonProps) {
    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/concorsi/${slug}`;
        try {
            if (navigator.share) {
                await navigator.share({ title, url: shareUrl });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                toast.success('Link copiato negli appunti');
            }
        } catch {
            // Ignore cancellation and share errors.
        }
    };

    return (
        <Button
            type="button"
            variant={iconOnly ? 'ghost' : 'outline'}
            size={iconOnly ? 'icon' : 'sm'}
            onClick={handleShare}
            className={className}
            title="Condividi concorso"
            aria-label="Condividi concorso"
        >
            <Share2 className={iconOnly ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
            {!iconOnly && 'Condividi'}
        </Button>
    );
}
