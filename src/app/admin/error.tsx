'use client';

import { RefreshCw, TriangleAlert } from 'lucide-react';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-xl rounded-lg border border-red-200 bg-white p-6 shadow-xl">
                <div className="flex items-start gap-4">
                    <span className="inline-flex rounded-lg bg-red-50 p-3 text-red-600">
                        <TriangleAlert className="h-6 w-6" />
                    </span>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-slate-950">Admin dashboard failed to load</h1>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            {error.message || 'The metrics snapshot could not be generated.'}
                        </p>
                        <button
                            type="button"
                            onClick={reset}
                            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
