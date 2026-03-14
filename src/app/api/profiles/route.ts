import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get existing profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Auto-create profile if it doesn't exist
    if (!profile) {
      const newProfile = {
        id: user.id,
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: 'MANAGER',
      };

      const { data: created, error: insertError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }
      profile = created;
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
