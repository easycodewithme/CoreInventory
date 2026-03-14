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

    // Fetch stock with product and location joins
    const { data: stockRows, error } = await supabase
      .from('stock')
      .select('*, product:products(id, name, sku, unit_of_measure, cost_per_unit, reorder_level, category_id), location:locations(id, name, short_code)');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch pending delivery demand to calculate free_to_use
    const { data: pendingDeliveryItems } = await supabase
      .from('delivery_items')
      .select('product_id, demand_qty, deliveries!inner(status)')
      .not('deliveries.status', 'in', '("DONE","CANCELLED")');

    // Build demand map: product_id -> total pending demand
    const demandMap: Record<string, number> = {};
    for (const item of pendingDeliveryItems ?? []) {
      demandMap[item.product_id] = (demandMap[item.product_id] ?? 0) + item.demand_qty;
    }

    // Group stock by product_id
    const grouped: Record<string, {
      product_id: string;
      product: unknown;
      on_hand: number;
      free_to_use: number;
      locations: Array<{ id: string; location: unknown; quantity: number }>;
    }> = {};

    for (const row of stockRows ?? []) {
      // Apply search filter
      if (search) {
        const product = row.product as { name?: string; sku?: string } | null;
        const nameMatch = product?.name?.toLowerCase().includes(search.toLowerCase());
        const skuMatch = product?.sku?.toLowerCase().includes(search.toLowerCase());
        if (!nameMatch && !skuMatch) continue;
      }

      if (!grouped[row.product_id]) {
        grouped[row.product_id] = {
          product_id: row.product_id,
          product: row.product,
          on_hand: 0,
          free_to_use: 0,
          locations: [],
        };
      }

      grouped[row.product_id].on_hand += row.quantity;
      grouped[row.product_id].locations.push({
        id: row.id,
        location: row.location,
        quantity: row.quantity,
      });
    }

    // Calculate free_to_use
    const result = Object.values(grouped).map((g) => ({
      ...g,
      free_to_use: g.on_hand - (demandMap[g.product_id] ?? 0),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Stock GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
