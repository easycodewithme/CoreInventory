import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: locations, error } = await supabase
      .from('locations')
      .select('*, warehouse:warehouses(id, name)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(locations ?? []);
  } catch (error) {
    console.error('Locations GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, short_code, warehouse_id } = body;

    if (!name || !short_code || !warehouse_id) {
      return NextResponse.json(
        { error: 'Name, short code, and warehouse are required' },
        { status: 400 }
      );
    }

    // Check short_code uniqueness
    const { data: existing } = await supabase
      .from('locations')
      .select('id')
      .eq('short_code', short_code)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'A location with this short code already exists' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('locations')
      .insert({
        name,
        short_code,
        warehouse_id,
      })
      .select('*, warehouse:warehouses(id, name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Locations POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
