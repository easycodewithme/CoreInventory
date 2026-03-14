import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch receipt with items
    const { data: receipt, error: fetchError } = await supabase
      .from('receipts')
      .select('*, destination_location:locations(id, name), receipt_items(*, product:products(id, name, sku))')
      .eq('id', id)
      .single();

    if (fetchError || !receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    if (receipt.status === 'DONE') {
      return NextResponse.json({ error: 'Receipt is already validated' }, { status: 400 });
    }

    if (receipt.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot validate a cancelled receipt' }, { status: 400 });
    }

    if (!receipt.destination_location_id) {
      return NextResponse.json({ error: 'Receipt must have a destination location' }, { status: 400 });
    }

    const items = receipt.receipt_items ?? [];
    if (items.length === 0) {
      return NextResponse.json({ error: 'Receipt has no items' }, { status: 400 });
    }

    const destinationLocation = receipt.destination_location as { id: string; name: string } | null;
    const locationName = destinationLocation?.name ?? 'Unknown';

    // Process each item
    for (const item of items) {
      const receivedQty = item.received_qty > 0 ? item.received_qty : item.ordered_qty;

      // Update received_qty if it was 0
      if (item.received_qty === 0) {
        await supabase
          .from('receipt_items')
          .update({ received_qty: receivedQty })
          .eq('id', item.id);
      }

      // Upsert stock: check if stock record exists for product + location
      const { data: existingStock } = await supabase
        .from('stock')
        .select('id, quantity')
        .eq('product_id', item.product_id)
        .eq('location_id', receipt.destination_location_id)
        .maybeSingle();

      if (existingStock) {
        // Increment existing stock
        await supabase
          .from('stock')
          .update({ quantity: existingStock.quantity + receivedQty })
          .eq('id', existingStock.id);
      } else {
        // Create new stock record
        await supabase
          .from('stock')
          .insert({
            product_id: item.product_id,
            location_id: receipt.destination_location_id,
            quantity: receivedQty,
          });
      }

      // Insert move record
      await supabase.from('moves').insert({
        date: new Date().toISOString(),
        type: 'RECEIPT',
        reference: receipt.reference,
        product_id: item.product_id,
        quantity: receivedQty,
        from_location: `Vendor (${receipt.supplier_name})`,
        to_location: locationName,
        created_by: user.id,
      });
    }

    // Mark receipt as DONE
    const { data: updatedReceipt, error: updateError } = await supabase
      .from('receipts')
      .update({
        status: 'DONE',
        validated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, destination_location:locations(id, name, short_code), receipt_items(*, product:products(id, name, sku, unit_of_measure))')
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedReceipt);
  } catch (error) {
    console.error('Receipt validate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
