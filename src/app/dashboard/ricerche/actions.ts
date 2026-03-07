'use server';

import { createClient } from '@/lib/supabase/server';
import { deleteSavedSearch } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

export async function deleteSearchAction(searchId: string, formData?: FormData): Promise<void> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Non autorizzato');
    }

    const success = await deleteSavedSearch(supabase, searchId);
    if (!success) {
        throw new Error('Errore durante l\'eliminazione');
    }

    revalidatePath('/dashboard/ricerche');
}
