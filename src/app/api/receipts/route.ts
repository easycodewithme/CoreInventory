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
      .from('receipts')
      .select('*, destination_location:locations(id, name), receipt_items(id)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to include item_count
    const result = (data ?? []).map((r) => ({
      ...r,
      item_count: r.receipt_items?.length ?? 0,
      receipt_items: undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Receipts GET error:', error);
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
    const { date, supplier_name, destination_location_id, notes } = body as {
      date?: string;
      supplier_name?: string;
      destination_location_id?: string;
      notes?: string;
    };

    // Generate reference
    const { data: counter } = await supabase
      .from('ref_counters')
      .select('last_number')
      .eq('type', 'RECEIPT')
      .single();

    let newNumber: number;
    if (counter) {
      newNumber = counter.last_number + 1;
      await supabase
        .from('ref_counters')
        .update({ last_number: newNumber })
        .eq('type', 'RECEIPT');
    } else {
      // Counter row doesn't exist yet — create it
      newNumber = 1;
      await supabase
        .from('ref_counters')
        .insert({ type: 'RECEIPT', last_number: 1 });
    }

    const reference = `RCP-${String(newNumber).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('receipts')
      .insert({
        reference,
        date: date || new Date().toISOString(),
        supplier_name: supplier_name || 'Draft Supplier',
        destination_location_id: destination_location_id || null,
        notes: notes || null,
        status: 'DRAFT',
        created_by: user.id,
      })
      .select('*, destination_location:locations(id, name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Receipts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
