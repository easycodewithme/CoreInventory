import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
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
    const { data: delivery, error } = await supabase
      .from('deliveries')
      .select('*, source_location:locations(id, name, short_code), delivery_items(*, product:products(id, name, sku, unit_of_measure))')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Get available stock for each product in the delivery items
    if (delivery.delivery_items && delivery.source_location_id) {
      const productIds = delivery.delivery_items.map(
        (item: { product_id: string }) => item.product_id
      );

      const { data: stockRows } = await supabase
        .from('stock')
        .select('product_id, quantity')
        .eq('location_id', delivery.source_location_id)
        .in('product_id', productIds);

      const stockMap: Record<string, number> = {};
      for (const s of stockRows ?? []) {
        stockMap[s.product_id] = (stockMap[s.product_id] ?? 0) + s.quantity;
      }

      delivery.delivery_items = delivery.delivery_items.map(
        (item: { product_id: string }) => ({
          ...item,
          available_stock: stockMap[item.product_id] ?? 0,
        })
      );
    }

    return NextResponse.json(delivery);
  } catch (error) {
    console.error('Delivery GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { date, customer_name, source_location_id, notes, status, items } = body;

    // Update delivery fields
    const updateData: Record<string, unknown> = {};
    if (date !== undefined) updateData.date = date;
    if (customer_name !== undefined) updateData.customer_name = customer_name;
    if (source_location_id !== undefined) updateData.source_location_id = source_location_id || null;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const { error: updateError } = await supabase
      .from('deliveries')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If items are provided, delete existing and re-insert
    if (items && Array.isArray(items)) {
      await supabase
        .from('delivery_items')
        .delete()
        .eq('delivery_id', id);

      if (items.length > 0) {
        const itemRows = items.map((item: { product_id: string; demand_qty: number; shipped_qty?: number }) => ({
          delivery_id: id,
          product_id: item.product_id,
          demand_qty: item.demand_qty,
          shipped_qty: item.shipped_qty ?? 0,
        }));

        const { error: itemsError } = await supabase
          .from('delivery_items')
          .insert(itemRows);

        if (itemsError) {
          return NextResponse.json({ error: itemsError.message }, { status: 500 });
        }
      }
    }

    // Return updated delivery with items
    const { data, error } = await supabase
      .from('deliveries')
      .select('*, source_location:locations(id, name, short_code), delivery_items(*, product:products(id, name, sku, unit_of_measure))')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Delivery PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Check if delivery is DRAFT
    const { data: delivery, error: fetchError } = await supabase
      .from('deliveries')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    if (delivery.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only DRAFT deliveries can be deleted' },
        { status: 400 }
      );
    }

    // Delete items first, then delivery
    await supabase.from('delivery_items').delete().eq('delivery_id', id);
    const { error } = await supabase.from('deliveries').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delivery DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
