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

    // Fetch delivery with items
    const { data: delivery, error: fetchError } = await supabase
      .from('deliveries')
      .select('*, source_location:locations(id, name), delivery_items(*, product:products(id, name, sku))')
      .eq('id', id)
      .single();

    if (fetchError || !delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    if (delivery.status === 'DONE') {
      return NextResponse.json({ error: 'Delivery is already validated' }, { status: 400 });
    }

    if (delivery.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot validate a cancelled delivery' }, { status: 400 });
    }

    if (!delivery.source_location_id) {
      return NextResponse.json({ error: 'Delivery must have a source location' }, { status: 400 });
    }

    const items = delivery.delivery_items ?? [];
    if (items.length === 0) {
      return NextResponse.json({ error: 'Delivery has no items' }, { status: 400 });
    }

    const sourceLocation = delivery.source_location as { id: string; name: string } | null;
    const locationName = sourceLocation?.name ?? 'Unknown';

    // Check stock sufficiency and process each item
    for (const item of items) {
      const shippedQty = item.shipped_qty > 0 ? item.shipped_qty : item.demand_qty;

      // Get current stock at source location
      const { data: stockRecord } = await supabase
        .from('stock')
        .select('id, quantity')
        .eq('product_id', item.product_id)
        .eq('location_id', delivery.source_location_id)
        .maybeSingle();

      const availableQty = stockRecord?.quantity ?? 0;

      if (availableQty < shippedQty) {
        const productName = item.product?.name ?? item.product_id;
        return NextResponse.json(
          {
            error: `Insufficient stock for "${productName}". Available: ${availableQty}, Required: ${shippedQty}`,
          },
          { status: 400 }
        );
      }
    }

    // All stock checks passed, now process
    for (const item of items) {
      const shippedQty = item.shipped_qty > 0 ? item.shipped_qty : item.demand_qty;

      // Update shipped_qty if it was 0
      if (item.shipped_qty === 0) {
        await supabase
          .from('delivery_items')
          .update({ shipped_qty: shippedQty })
          .eq('id', item.id);
      }

      // Deduct from stock
      const { data: stockRecord } = await supabase
        .from('stock')
        .select('id, quantity')
        .eq('product_id', item.product_id)
        .eq('location_id', delivery.source_location_id)
        .single();

      if (stockRecord) {
        await supabase
          .from('stock')
          .update({ quantity: stockRecord.quantity - shippedQty })
          .eq('id', stockRecord.id);
      }

      // Insert move record (quantity is negative for deliveries)
      await supabase.from('moves').insert({
        date: new Date().toISOString(),
        type: 'DELIVERY',
        reference: delivery.reference,
        product_id: item.product_id,
        quantity: -shippedQty,
        from_location: locationName,
        to_location: `Customer (${delivery.customer_name})`,
        created_by: user.id,
      });
    }

    // Mark delivery as DONE
    const { data: updatedDelivery, error: updateError } = await supabase
      .from('deliveries')
      .update({
        status: 'DONE',
        validated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, source_location:locations(id, name, short_code), delivery_items(*, product:products(id, name, sku, unit_of_measure))')
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedDelivery);
  } catch (error) {
    console.error('Delivery validate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
