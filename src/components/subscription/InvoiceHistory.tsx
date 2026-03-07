import { FileText, Download } from 'lucide-react';

interface InvoiceHistoryProps {
    invoices: Array<{
        id: string;
        amount_paid: number;
        currency: string;
        status: string;
        created: number;
        pdf_url: string | null;
    }>;
}

export function InvoiceHistory({ invoices }: InvoiceHistoryProps) {
    if (!invoices || invoices.length === 0) return null;

    return (
        <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border/50">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cronologia Fatturazione</h3>
            </div>
            <div className="divide-y divide-border/50">
                {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 px-6 hover:bg-white/20 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-muted rounded-lg">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">
                                    {new Intl.NumberFormat('it-IT', { style: 'currency', currency: invoice.currency }).format(invoice.amount_paid / 100)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(invoice.created * 1000).toLocaleDateString('it-IT', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                        {invoice.pdf_url && (
                            <a
                                href={invoice.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-white rounded-lg transition-colors text-muted-foreground hover:text-primary"
                                title="Scarica PDF"
                            >
                                <Download className="w-5 h-5" />
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
