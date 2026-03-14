import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [productsRes, stockRes, categoriesRes, movesRes] = await Promise.all([
      supabase.from('products').select('id, name, sku, category_id, cost_per_unit, reorder_level'),
      supabase.from('stock').select('product_id, quantity'),
      supabase.from('categories').select('id, name'),
      supabase
        .from('moves')
        .select('id, type, quantity, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true }),
    ]);

    const products = productsRes.data ?? [];
    const stockRows = stockRes.data ?? [];
    const categories = categoriesRes.data ?? [];
    const moves = movesRes.data ?? [];

    // Build on-hand map
    const onHandMap: Record<string, number> = {};
    for (const s of stockRows) {
      onHandMap[s.product_id] = (onHandMap[s.product_id] ?? 0) + s.quantity;
    }

    // Stock by category
    const categoryMap: Record<string, { name: string; value: number }> = {};
    for (const p of products) {
      const cat = categories.find((c) => c.id === p.category_id);
      const catName = cat?.name ?? 'Uncategorized';
      const stockValue = (onHandMap[p.id] ?? 0) * p.cost_per_unit;
      if (!categoryMap[catName]) categoryMap[catName] = { name: catName, value: 0 };
      categoryMap[catName].value += stockValue;
    }
    const stock_by_category = Object.values(categoryMap)
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);

    // Movement trends (daily for 30 days)
    const trendMap: Record<string, { date: string; receipts: number; deliveries: number; adjustments: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      trendMap[key] = { date: key, receipts: 0, deliveries: 0, adjustments: 0 };
    }
    for (const m of moves) {
      const day = m.created_at.split('T')[0];
      if (trendMap[day]) {
        if (m.type === 'RECEIPT') trendMap[day].receipts += Math.abs(m.quantity);
        else if (m.type === 'DELIVERY') trendMap[day].deliveries += Math.abs(m.quantity);
        else trendMap[day].adjustments += Math.abs(m.quantity);
      }
    }
    const movement_trends = Object.values(trendMap);

    // Low stock items
    const low_stock_items = products
      .filter((p) => (onHandMap[p.id] ?? 0) <= p.reorder_level)
      .map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        on_hand: onHandMap[p.id] ?? 0,
        reorder_level: p.reorder_level,
        cost_per_unit: p.cost_per_unit,
      }))
      .sort((a, b) => a.on_hand - b.on_hand);

    // Top 10 products by value
    const top_products_by_value = products
      .map((p) => ({
        name: p.name,
        value: (onHandMap[p.id] ?? 0) * p.cost_per_unit,
        quantity: onHandMap[p.id] ?? 0,
      }))
      .filter((p) => p.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return NextResponse.json({
      stock_by_category,
      movement_trends,
      low_stock_items,
      top_products_by_value,
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
