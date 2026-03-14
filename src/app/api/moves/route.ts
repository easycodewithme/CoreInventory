import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get('type');
    const search = request.nextUrl.searchParams.get('search');

    let query = supabase
      .from('moves')
      .select('*, product:products(id, name, sku)')
      .order('date', { ascending: false });

    if (type && type !== 'ALL') {
      query = query.eq('type', type);
    }

    const { data: moves, error } = await query;

    if (error) {
      console.error('Moves query error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Apply search filter in-memory (product name or reference)
    let filtered = moves ?? [];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((m) => {
        const productName = (m.product as { name?: string } | null)?.name?.toLowerCase() ?? '';
        const ref = m.reference?.toLowerCase() ?? '';
        return productName.includes(q) || ref.includes(q);
      });
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Moves GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
