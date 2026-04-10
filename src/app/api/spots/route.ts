import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SPOT_EXPIRY_MINUTES } from '@/lib/constants';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { lat, lng } = body;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + SPOT_EXPIRY_MINUTES * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('parking_spots')
    .insert({ user_id: user.id, lat, lng, expires_at: expiresAt })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
