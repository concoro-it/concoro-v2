import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { GenioWorkspace } from '@/components/genio/GenioWorkspace';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { getUserProfile } from '@/lib/supabase/queries';

export const metadata: Metadata = { title: 'Genio | Dashboard' };

export default async function GenioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [tier, profile] = await Promise.all([
    getUserTier(supabase),
    getUserProfile(supabase, user.id),
  ]);

  let userName: string | null = null;
  let userAvatarUrl: string | null = null;

  const { data: slimProfile } = await supabase
    .from('profiles')
    .select('first_name, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  userName =
    slimProfile?.first_name?.trim() ||
    slimProfile?.full_name?.trim()?.split(' ')[0] ||
    null;
  userAvatarUrl = slimProfile?.avatar_url?.trim() || null;

  return (
    <GenioWorkspace
      tier={tier}
      profile={profile}
      userName={userName}
      userAvatarUrl={userAvatarUrl}
    />
  );
}
