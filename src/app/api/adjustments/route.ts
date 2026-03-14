import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('adjustments')
      .select('*, product:products(id, name, sku), location:locations(id, name, short_code)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Adjustments query error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Adjustments GET error:', error);
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
    const { product_id, location_id, counted_qty, reason } = body;

    if (!product_id || counted_qty === undefined) {
      return NextResponse.json(
        { error: 'product_id and counted_qty are required' },
        { status: 400 }
      );
    }

    // Get current on_hand for this product (optionally filtered by location)
    let previousQty = 0;
    let stockRecordId: string | null = null;

    if (location_id) {
      const { data: stockRecord } = await supabase
        .from('stock')
        .select('id, quantity')
        .eq('product_id', product_id)
        .eq('location_id', location_id)
        .maybeSingle();

      if (stockRecord) {
        previousQty = stockRecord.quantity;
        stockRecordId = stockRecord.id;
      }
    } else {
      const { data: stockRows } = await supabase
        .from('stock')
        .select('id, quantity')
        .eq('product_id', product_id);

      previousQty = (stockRows ?? []).reduce((sum, s) => sum + s.quantity, 0);
    }

    const difference = counted_qty - previousQty;

    // Generate reference number
    const { data: counter, error: counterError } = await supabase
      .from('ref_counters')
      .select('last_number')
      .eq('type', 'ADJUSTMENT')
      .single();

    if (counterError) {
      return NextResponse.json({ error: 'Failed to get reference counter' }, { status: 500 });
    }

    const newNumber = counter.last_number + 1;
    await supabase
      .from('ref_counters')
      .update({ last_number: newNumber })
      .eq('type', 'ADJUSTMENT');

    const reference = `ADJ-${String(newNumber).padStart(4, '0')}`;

    // Update stock
    if (location_id) {
      if (stockRecordId) {
        await supabase
          .from('stock')
          .update({ quantity: counted_qty })
          .eq('id', stockRecordId);
      } else {
        await supabase.from('stock').insert({
          product_id,
          location_id,
          quantity: counted_qty,
        });
      }
    }

    // Get location name for the move record
    let locationName = 'All Locations';
    if (location_id) {
      const { data: location } = await supabase
        .from('locations')
        .select('name')
        .eq('id', location_id)
        .single();

      locationName = location?.name ?? 'Unknown';
    }

    // Create adjustment record
    const { data: adjustment, error: adjError } = await supabase
      .from('adjustments')
      .insert({
        reference,
        date: new Date().toISOString(),
        product_id,
        location_id: location_id || null,
        previous_qty: previousQty,
        counted_qty,
        difference,
        reason: reason || 'Manual adjustment',
        created_by: user.id,
      })
      .select('*, product:products(id, name, sku), location:locations(id, name, short_code)')
      .single();

    if (adjError) {
      return NextResponse.json({ error: adjError.message }, { status: 500 });
    }

    // Create move record
    await supabase.from('moves').insert({
      date: new Date().toISOString(),
      type: 'ADJUSTMENT',
      reference,
      product_id,
      quantity: difference,
      from_location: locationName,
      to_location: locationName,
      created_by: user.id,
    });

    return NextResponse.json(adjustment, { status: 201 });
  } catch (error) {
    console.error('Adjustments POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
