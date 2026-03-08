import type { Metadata } from 'next';
import { GenioWorkspace } from '@/components/genio/GenioWorkspace';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Genio | Dashboard' };

export default async function GenioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName: string | null = null;
  let userAvatarUrl: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, full_name, avatar_url')
      .eq('id', user.id)
      .single();

    userName =
      profile?.first_name?.trim() ||
      profile?.full_name?.trim()?.split(' ')[0] ||
      null;
    userAvatarUrl = profile?.avatar_url?.trim() || null;
  }

  return <GenioWorkspace userName={userName} userAvatarUrl={userAvatarUrl} />;
}
