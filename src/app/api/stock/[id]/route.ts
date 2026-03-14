import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { quantity, product_id, location_id } = body;

    if (quantity === undefined || !product_id || !location_id) {
      return NextResponse.json(
        { error: 'quantity, product_id, and location_id are required' },
        { status: 400 }
      );
    }

    // Get current stock quantity for calculating difference
    const { data: currentStock, error: stockError } = await supabase
      .from('stock')
      .select('quantity')
      .eq('id', id)
      .single();

    if (stockError) {
      return NextResponse.json({ error: 'Stock record not found' }, { status: 404 });
    }

    const previousQty = currentStock.quantity;
    const difference = quantity - previousQty;

    // Update stock quantity
    const { data: updatedStock, error: updateError } = await supabase
      .from('stock')
      .update({ quantity })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Generate adjustment reference
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

    // Get location name for the move record
    const { data: location } = await supabase
      .from('locations')
      .select('name')
      .eq('id', location_id)
      .single();

    const locationName = location?.name ?? 'Unknown';

    // Create adjustment record
    await supabase.from('adjustments').insert({
      reference,
      date: new Date().toISOString(),
      product_id,
      location_id,
      previous_qty: previousQty,
      counted_qty: quantity,
      difference,
      reason: 'Manual stock update from Stock page',
      created_by: user.id,
    });

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

    return NextResponse.json(updatedStock);
  } catch (error) {
    console.error('Stock PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
