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

    const { data, error } = await supabase
      .from('receipts')
      .select('*, destination_location:locations(id, name, short_code), receipt_items(*, product:products(id, name, sku, unit_of_measure))')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Receipt GET error:', error);
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
    const { date, supplier_name, destination_location_id, notes, status, items } = body;

    // Update receipt fields
    const updateData: Record<string, unknown> = {};
    if (date !== undefined) updateData.date = date;
    if (supplier_name !== undefined) updateData.supplier_name = supplier_name;
    if (destination_location_id !== undefined) updateData.destination_location_id = destination_location_id || null;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const { error: updateError } = await supabase
      .from('receipts')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If items are provided, delete existing and re-insert
    if (items && Array.isArray(items)) {
      await supabase
        .from('receipt_items')
        .delete()
        .eq('receipt_id', id);

      if (items.length > 0) {
        const itemRows = items.map((item: { product_id: string; ordered_qty: number; received_qty?: number }) => ({
          receipt_id: id,
          product_id: item.product_id,
          ordered_qty: item.ordered_qty,
          received_qty: item.received_qty ?? 0,
        }));

        const { error: itemsError } = await supabase
          .from('receipt_items')
          .insert(itemRows);

        if (itemsError) {
          return NextResponse.json({ error: itemsError.message }, { status: 500 });
        }
      }
    }

    // Return updated receipt with items
    const { data, error } = await supabase
      .from('receipts')
      .select('*, destination_location:locations(id, name, short_code), receipt_items(*, product:products(id, name, sku, unit_of_measure))')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Receipt PUT error:', error);
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

    // Check if receipt is DRAFT
    const { data: receipt, error: fetchError } = await supabase
      .from('receipts')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    if (receipt.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only DRAFT receipts can be deleted' },
        { status: 400 }
      );
    }

    // Delete items first, then receipt
    await supabase.from('receipt_items').delete().eq('receipt_id', id);
    const { error } = await supabase.from('receipts').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Receipt DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
