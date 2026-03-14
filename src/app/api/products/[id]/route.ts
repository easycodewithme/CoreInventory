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

    const [productRes, stockRes] = await Promise.all([
      supabase
        .from('products')
        .select('*, category:categories(id, name)')
        .eq('id', id)
        .single(),
      supabase
        .from('stock')
        .select('*, location:locations(id, name, short_code)')
        .eq('product_id', id),
    ]);

    if (productRes.error) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const onHand = (stockRes.data ?? []).reduce((sum, s) => sum + s.quantity, 0);

    return NextResponse.json({
      ...productRes.data,
      on_hand: onHand,
      stock: stockRes.data ?? [],
    });
  } catch (error) {
    console.error('Product GET error:', error);
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
    const { name, sku, category_id, unit_of_measure, cost_per_unit, reorder_level, description } = body;

    // Check SKU uniqueness excluding current product
    if (sku) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('sku', sku)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'A product with this SKU already exists' }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (sku !== undefined) updateData.sku = sku;
    if (category_id !== undefined) updateData.category_id = category_id || null;
    if (unit_of_measure !== undefined) updateData.unit_of_measure = unit_of_measure;
    if (cost_per_unit !== undefined) updateData.cost_per_unit = cost_per_unit;
    if (reorder_level !== undefined) updateData.reorder_level = reorder_level;
    if (description !== undefined) updateData.description = description;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select('*, category:categories(id, name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Product PUT error:', error);
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

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
