import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = request.nextUrl.searchParams.get('status');

    let query = supabase
      .from('deliveries')
      .select('*, source_location:locations(id, name), delivery_items(id)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to include item_count
    const result = (data ?? []).map((d) => ({
      ...d,
      item_count: d.delivery_items?.length ?? 0,
      delivery_items: undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Deliveries GET error:', error);
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

    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // Allow empty body for quick draft creation
    }
    const { date, customer_name, source_location_id, notes } = body as {
      date?: string;
      customer_name?: string;
      source_location_id?: string;
      notes?: string;
    };

    // Generate reference
    const { data: counter } = await supabase
      .from('ref_counters')
      .select('last_number')
      .eq('type', 'DELIVERY')
      .single();

    let newNumber: number;
    if (counter) {
      newNumber = counter.last_number + 1;
      await supabase
        .from('ref_counters')
        .update({ last_number: newNumber })
        .eq('type', 'DELIVERY');
    } else {
      newNumber = 1;
      await supabase
        .from('ref_counters')
        .insert({ type: 'DELIVERY', last_number: 1 });
    }

    const reference = `DEL-${String(newNumber).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('deliveries')
      .insert({
        reference,
        date: date || new Date().toISOString(),
        customer_name: customer_name || 'Draft Customer',
        source_location_id: source_location_id || null,
        notes: notes || null,
        status: 'DRAFT',
        created_by: user.id,
      })
      .select('*, source_location:locations(id, name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Deliveries POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
