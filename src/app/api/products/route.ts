import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const search = request.nextUrl.searchParams.get('search');

    let query = supabase
      .from('products')
      .select('*, category:categories(id, name)')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    const { data: products, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch stock to calculate on_hand for each product
    const { data: stockRows } = await supabase
      .from('stock')
      .select('product_id, quantity');

    const onHandMap: Record<string, number> = {};
    for (const s of stockRows ?? []) {
      onHandMap[s.product_id] = (onHandMap[s.product_id] ?? 0) + s.quantity;
    }

    const enriched = (products ?? []).map((p) => ({
      ...p,
      on_hand: onHandMap[p.id] ?? 0,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Products GET error:', error);
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
    const { name, sku, category_id, unit_of_measure, cost_per_unit, reorder_level, description } = body;

    if (!name || !sku) {
      return NextResponse.json({ error: 'Name and SKU are required' }, { status: 400 });
    }

    // Check SKU uniqueness
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('sku', sku)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'A product with this SKU already exists' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        sku,
        category_id: category_id || null,
        unit_of_measure: unit_of_measure || 'pcs',
        cost_per_unit: cost_per_unit ?? 0,
        reorder_level: reorder_level ?? 0,
        description: description || null,
      })
      .select('*, category:categories(id, name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
