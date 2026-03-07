import { CreditCard } from 'lucide-react';

interface PaymentMethodCardProps {
    paymentMethod: {
        brand: string;
        last4: string;
        exp_month: number;
        exp_year: number;
    } | null;
}

export function PaymentMethodCard({ paymentMethod }: PaymentMethodCardProps) {
    if (!paymentMethod) return null;

    return (
        <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Metodo di Pagamento</h3>
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <CreditCard className="w-6 h-6" />
                </div>
                <div>
                    <p className="font-bold text-lg capitalize">
                        {paymentMethod.brand} •••• {paymentMethod.last4}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Scade il {paymentMethod.exp_month.toString().padStart(2, '0')}/{paymentMethod.exp_year}
                    </p>
                </div>
            </div>
        </div>
    );
}
