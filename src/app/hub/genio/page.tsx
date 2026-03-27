import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { GenioWorkspace } from '@/components/genio/GenioWorkspace';
import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/auth/getUserContext';
import type { Profile } from '@/types/profile';

export const metadata: Metadata = { title: 'Genio | Hub' };

export default async function GenioPage() {
  const supabase = await createClient();
  const { user, profile, tier } = await getUserContext<Profile>(supabase);

  if (!user) {
    redirect('/login');
  }

  const userName =
    profile?.first_name?.trim() ||
    profile?.full_name?.trim()?.split(' ')[0] ||
    null;
  const userAvatarUrl = profile?.avatar_url?.trim() || null;

  return (
    <GenioWorkspace
      tier={tier}
      profile={profile ?? null}
      userName={userName}
      userAvatarUrl={userAvatarUrl}
    />
  );
}
