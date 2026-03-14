import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: warehouses, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get location counts per warehouse
    const { data: locations } = await supabase
      .from('locations')
      .select('warehouse_id');

    const countMap: Record<string, number> = {};
    for (const loc of locations ?? []) {
      countMap[loc.warehouse_id] = (countMap[loc.warehouse_id] ?? 0) + 1;
    }

    const enriched = (warehouses ?? []).map((w) => ({
      ...w,
      location_count: countMap[w.id] ?? 0,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Warehouses GET error:', error);
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
    const { name, main_policy, address } = body;

    if (!name) {
      return NextResponse.json({ error: 'Warehouse name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('warehouses')
      .insert({
        name,
        main_policy: main_policy || 'FIFO',
        address: address || null,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Warehouses POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
