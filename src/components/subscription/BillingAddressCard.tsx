import { MapPin } from 'lucide-react';

interface BillingAddressCardProps {
    address: {
        line1: string | null;
        line2: string | null;
        city: string | null;
        state: string | null;
        postal_code: string | null;
        country: string | null;
    } | null;
}

export function BillingAddressCard({ address }: BillingAddressCardProps) {
    if (!address || !address.line1) return null;

    return (
        <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Indirizzo di Fatturazione</h3>
            <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
                    <MapPin className="w-6 h-6" />
                </div>
                <div className="text-sm space-y-1">
                    <p className="font-medium text-base">{address.line1}</p>
                    {address.line2 && <p>{address.line2}</p>}
                    <p>
                        {address.postal_code} {address.city}
                        {address.state && `, ${address.state}`}
                    </p>
                    <p className="uppercase">{address.country}</p>
                </div>
            </div>
        </div>
    );
}
