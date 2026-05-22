'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export function AdminMobileNav() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open admin navigation"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
            >
                <Menu className="h-5 w-5" />
            </button>
            {open ? (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button type="button" aria-label="Close admin navigation overlay" className="absolute inset-0 bg-slate-950/35" onClick={() => setOpen(false)} />
                    <div className="absolute inset-y-0 left-0 w-[min(86vw,20rem)] bg-white shadow-2xl">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Close admin navigation"
                            className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <AdminSidebar className="w-full" onNavigate={() => setOpen(false)} />
                    </div>
                </div>
            ) : null}
        </>
    );
}
