import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all data in parallel
    const [
      productsRes,
      stockRes,
      pendingReceiptsRes,
      pendingDeliveriesRes,
      recentReceiptsRes,
      recentDeliveriesRes,
      deliveryItemsRes,
      movesRes,
      categoriesRes,
    ] = await Promise.all([
      supabase.from('products').select('id, name, sku, reorder_level, cost_per_unit, category_id'),
      supabase.from('stock').select('product_id, quantity, location_id'),
      supabase
        .from('receipts')
        .select('id', { count: 'exact', head: true })
        .not('status', 'in', '("DONE","CANCELLED")'),
      supabase
        .from('deliveries')
        .select('id', { count: 'exact', head: true })
        .not('status', 'in', '("DONE","CANCELLED")'),
      supabase
        .from('receipts')
        .select('*, destination_location:locations(name)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('deliveries')
        .select('*, source_location:locations(name)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('delivery_items')
        .select('product_id, demand_qty, deliveries!inner(status)')
        .not('deliveries.status', 'in', '("DONE","CANCELLED")'),
      supabase
        .from('moves')
        .select('id, type, quantity, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true }),
      supabase.from('categories').select('id, name'),
    ]);

    const products = productsRes.data ?? [];
    const stockRows = stockRes.data ?? [];

    // Build a map: product_id -> total on_hand
    const onHandMap: Record<string, number> = {};
    for (const s of stockRows) {
      onHandMap[s.product_id] = (onHandMap[s.product_id] ?? 0) + s.quantity;
    }

    // Total products with on_hand > 0
    const totalProducts = Object.values(onHandMap).filter((qty) => qty > 0).length;

    // Total stock value
    let totalStockValue = 0;
    for (const s of stockRows) {
      const product = products.find((p) => p.id === s.product_id);
      if (product) {
        totalStockValue += s.quantity * product.cost_per_unit;
      }
    }

    // Low stock items
    const lowStockItems = products
      .filter((p) => {
        const onHand = onHandMap[p.id] ?? 0;
        return onHand <= p.reorder_level;
      })
      .map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        on_hand: onHandMap[p.id] ?? 0,
        reorder_level: p.reorder_level,
      }));

    // Stock movement trends (30 days)
    const moves = movesRes.data ?? [];
    const categories = categoriesRes.data ?? [];
    const trendMap: Record<string, { date: string; receipts: number; deliveries: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      trendMap[key] = { date: key, receipts: 0, deliveries: 0 };
    }
    for (const m of moves) {
      const day = m.created_at.split('T')[0];
      if (trendMap[day]) {
        if (m.type === 'RECEIPT') trendMap[day].receipts += Math.abs(m.quantity);
        else if (m.type === 'DELIVERY') trendMap[day].deliveries += Math.abs(m.quantity);
      }
    }
    const stock_movement_trend = Object.values(trendMap);

    // Category distribution
    const categoryValueMap: Record<string, { name: string; value: number }> = {};
    for (const p of products) {
      const cat = categories.find((c) => c.id === p.category_id);
      const catName = cat?.name ?? 'Uncategorized';
      const stockValue = (onHandMap[p.id] ?? 0) * p.cost_per_unit;
      if (!categoryValueMap[catName]) categoryValueMap[catName] = { name: catName, value: 0 };
      categoryValueMap[catName].value += stockValue;
    }
    const category_distribution = Object.values(categoryValueMap)
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);

    return NextResponse.json({
      total_products: totalProducts,
      low_stock_count: lowStockItems.length,
      pending_receipts: pendingReceiptsRes.count ?? 0,
      pending_deliveries: pendingDeliveriesRes.count ?? 0,
      total_stock_value: totalStockValue,
      recent_receipts: recentReceiptsRes.data ?? [],
      recent_deliveries: recentDeliveriesRes.data ?? [],
      low_stock_items: lowStockItems,
      stock_movement_trend,
      category_distribution,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
