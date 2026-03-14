import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [pendingReceiptsRes, pendingDeliveriesRes, productsRes, stockRes] = await Promise.all([
      supabase
        .from('receipts')
        .select('id', { count: 'exact', head: true })
        .not('status', 'in', '("DONE","CANCELLED")'),
      supabase
        .from('deliveries')
        .select('id', { count: 'exact', head: true })
        .not('status', 'in', '("DONE","CANCELLED")'),
      supabase.from('products').select('id, reorder_level'),
      supabase.from('stock').select('product_id, quantity'),
    ]);

    // Calculate low stock count
    const products = productsRes.data ?? [];
    const stockRows = stockRes.data ?? [];
    const onHandMap: Record<string, number> = {};
    for (const s of stockRows) {
      onHandMap[s.product_id] = (onHandMap[s.product_id] ?? 0) + s.quantity;
    }
    const lowStockCount = products.filter((p) => {
      const onHand = onHandMap[p.id] ?? 0;
      return onHand <= p.reorder_level;
    }).length;

    return NextResponse.json({
      pending_receipts: pendingReceiptsRes.count ?? 0,
      pending_deliveries: pendingDeliveriesRes.count ?? 0,
      low_stock_count: lowStockCount,
    });
  } catch (error) {
    console.error('Counts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
