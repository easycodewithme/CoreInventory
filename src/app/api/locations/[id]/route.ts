import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
    const { name, short_code, warehouse_id } = body;

    // Check short_code uniqueness excluding current location
    if (short_code) {
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('short_code', short_code)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'A location with this short code already exists' },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (short_code !== undefined) updateData.short_code = short_code;
    if (warehouse_id !== undefined) updateData.warehouse_id = warehouse_id;

    const { data, error } = await supabase
      .from('locations')
      .update(updateData)
      .eq('id', id)
      .select('*, warehouse:warehouses(id, name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Location PUT error:', error);
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

    // Check for associated stock
    const { data: stockRows } = await supabase
      .from('stock')
      .select('id')
      .eq('location_id', id)
      .limit(1);

    if (stockRows && stockRows.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location with existing stock. Move or remove stock first.' },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Location DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
