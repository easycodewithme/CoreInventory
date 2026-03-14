import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createAdminClient();

    // Check if data already exists
    const { data: existing } = await supabase.from('warehouses').select('id').limit(1);
    if (existing && existing.length > 0) {
      return NextResponse.json({ message: 'Database already seeded' }, { status: 200 });
    }

    // 1. Warehouses
    await supabase.from('warehouses').insert([
      { id: 'a0000000-0000-0000-0000-000000000001', name: 'Main Warehouse', main_policy: 'FIFO', address: '123 Industrial Park, Karachi' },
      { id: 'a0000000-0000-0000-0000-000000000002', name: 'Cold Storage Facility', main_policy: 'FEFO', address: '45 Cold Chain Blvd, Lahore' },
      { id: 'a0000000-0000-0000-0000-000000000003', name: 'Distribution Center', main_policy: 'LIFO', address: '78 Logistics Way, Islamabad' },
    ]);

    // 2. Locations
    await supabase.from('locations').insert([
      { id: 'b0000000-0000-0000-0000-000000000001', name: 'Zone A - Receiving', short_code: 'WH1-A', warehouse_id: 'a0000000-0000-0000-0000-000000000001' },
      { id: 'b0000000-0000-0000-0000-000000000002', name: 'Zone B - Storage', short_code: 'WH1-B', warehouse_id: 'a0000000-0000-0000-0000-000000000001' },
      { id: 'b0000000-0000-0000-0000-000000000003', name: 'Zone C - Dispatch', short_code: 'WH1-C', warehouse_id: 'a0000000-0000-0000-0000-000000000001' },
      { id: 'b0000000-0000-0000-0000-000000000004', name: 'Freezer Unit 1', short_code: 'CS-F1', warehouse_id: 'a0000000-0000-0000-0000-000000000002' },
      { id: 'b0000000-0000-0000-0000-000000000005', name: 'Chiller Unit 1', short_code: 'CS-C1', warehouse_id: 'a0000000-0000-0000-0000-000000000002' },
      { id: 'b0000000-0000-0000-0000-000000000006', name: 'Bay 1 - Inbound', short_code: 'DC-B1', warehouse_id: 'a0000000-0000-0000-0000-000000000003' },
      { id: 'b0000000-0000-0000-0000-000000000007', name: 'Bay 2 - Outbound', short_code: 'DC-B2', warehouse_id: 'a0000000-0000-0000-0000-000000000003' },
    ]);

    // 3. Categories
    await supabase.from('categories').insert([
      { id: 'c0000000-0000-0000-0000-000000000001', name: 'Electronics' },
      { id: 'c0000000-0000-0000-0000-000000000002', name: 'Raw Materials' },
      { id: 'c0000000-0000-0000-0000-000000000003', name: 'Packaging' },
      { id: 'c0000000-0000-0000-0000-000000000004', name: 'Spare Parts' },
      { id: 'c0000000-0000-0000-0000-000000000005', name: 'Food & Beverage' },
      { id: 'c0000000-0000-0000-0000-000000000006', name: 'Office Supplies' },
    ]);

    // 4. Products
    await supabase.from('products').insert([
      { id: 'd0000000-0000-0000-0000-000000000001', name: 'Wireless Keyboard', sku: 'ELEC-001', category_id: 'c0000000-0000-0000-0000-000000000001', unit_of_measure: 'pcs', cost_per_unit: 29.99, reorder_level: 25, description: 'Bluetooth wireless keyboard with backlight' },
      { id: 'd0000000-0000-0000-0000-000000000002', name: 'USB-C Hub 7-in-1', sku: 'ELEC-002', category_id: 'c0000000-0000-0000-0000-000000000001', unit_of_measure: 'pcs', cost_per_unit: 45.00, reorder_level: 15, description: 'Multi-port USB-C adapter' },
      { id: 'd0000000-0000-0000-0000-000000000003', name: 'LED Monitor 24"', sku: 'ELEC-003', category_id: 'c0000000-0000-0000-0000-000000000001', unit_of_measure: 'pcs', cost_per_unit: 189.99, reorder_level: 10, description: '24-inch FHD LED monitor' },
      { id: 'd0000000-0000-0000-0000-000000000004', name: 'Steel Sheets 4x8', sku: 'RAW-001', category_id: 'c0000000-0000-0000-0000-000000000002', unit_of_measure: 'pcs', cost_per_unit: 85.00, reorder_level: 50, description: '4x8 feet steel sheet, 16 gauge' },
      { id: 'd0000000-0000-0000-0000-000000000005', name: 'Copper Wire Spool', sku: 'RAW-002', category_id: 'c0000000-0000-0000-0000-000000000002', unit_of_measure: 'kg', cost_per_unit: 12.50, reorder_level: 100, description: '14 AWG copper wire' },
      { id: 'd0000000-0000-0000-0000-000000000006', name: 'Aluminum Rods', sku: 'RAW-003', category_id: 'c0000000-0000-0000-0000-000000000002', unit_of_measure: 'm', cost_per_unit: 8.75, reorder_level: 200, description: '10mm diameter aluminum rods' },
      { id: 'd0000000-0000-0000-0000-000000000007', name: 'Cardboard Box Large', sku: 'PKG-001', category_id: 'c0000000-0000-0000-0000-000000000003', unit_of_measure: 'pcs', cost_per_unit: 2.50, reorder_level: 500, description: '24x18x12 inch corrugated box' },
      { id: 'd0000000-0000-0000-0000-000000000008', name: 'Bubble Wrap Roll', sku: 'PKG-002', category_id: 'c0000000-0000-0000-0000-000000000003', unit_of_measure: 'm', cost_per_unit: 0.85, reorder_level: 300, description: '12-inch wide bubble wrap' },
      { id: 'd0000000-0000-0000-0000-000000000009', name: 'Packing Tape Clear', sku: 'PKG-003', category_id: 'c0000000-0000-0000-0000-000000000003', unit_of_measure: 'pcs', cost_per_unit: 3.25, reorder_level: 200, description: '2-inch clear packing tape roll' },
      { id: 'd0000000-0000-0000-0000-000000000010', name: 'Bearing 6205-2RS', sku: 'SPR-001', category_id: 'c0000000-0000-0000-0000-000000000004', unit_of_measure: 'pcs', cost_per_unit: 7.80, reorder_level: 40, description: 'Deep groove ball bearing' },
      { id: 'd0000000-0000-0000-0000-000000000011', name: 'Hydraulic Filter', sku: 'SPR-002', category_id: 'c0000000-0000-0000-0000-000000000004', unit_of_measure: 'pcs', cost_per_unit: 22.00, reorder_level: 20, description: 'Industrial hydraulic filter element' },
      { id: 'd0000000-0000-0000-0000-000000000012', name: 'V-Belt A68', sku: 'SPR-003', category_id: 'c0000000-0000-0000-0000-000000000004', unit_of_measure: 'pcs', cost_per_unit: 14.50, reorder_level: 30, description: 'Industrial V-belt type A, 68 inches' },
      { id: 'd0000000-0000-0000-0000-000000000013', name: 'Green Tea Bags', sku: 'FNB-001', category_id: 'c0000000-0000-0000-0000-000000000005', unit_of_measure: 'box', cost_per_unit: 5.99, reorder_level: 80, description: 'Premium green tea, 100 bags/box' },
      { id: 'd0000000-0000-0000-0000-000000000014', name: 'Mineral Water 500ml', sku: 'FNB-002', category_id: 'c0000000-0000-0000-0000-000000000005', unit_of_measure: 'pcs', cost_per_unit: 0.45, reorder_level: 1000, description: '500ml bottled mineral water' },
      { id: 'd0000000-0000-0000-0000-000000000015', name: 'Energy Bar Assorted', sku: 'FNB-003', category_id: 'c0000000-0000-0000-0000-000000000005', unit_of_measure: 'box', cost_per_unit: 18.00, reorder_level: 60, description: 'Assorted energy bars, 24-pack' },
      { id: 'd0000000-0000-0000-0000-000000000016', name: 'A4 Copy Paper', sku: 'OFS-001', category_id: 'c0000000-0000-0000-0000-000000000006', unit_of_measure: 'box', cost_per_unit: 32.00, reorder_level: 30, description: '80gsm white A4 paper, 5 reams/box' },
      { id: 'd0000000-0000-0000-0000-000000000017', name: 'Ballpoint Pens Blue', sku: 'OFS-002', category_id: 'c0000000-0000-0000-0000-000000000006', unit_of_measure: 'box', cost_per_unit: 8.50, reorder_level: 50, description: 'Medium point blue pens, 50-pack' },
      { id: 'd0000000-0000-0000-0000-000000000018', name: 'Whiteboard Marker Set', sku: 'OFS-003', category_id: 'c0000000-0000-0000-0000-000000000006', unit_of_measure: 'pcs', cost_per_unit: 12.00, reorder_level: 40, description: '4-color whiteboard marker set' },
      { id: 'd0000000-0000-0000-0000-000000000019', name: 'Webcam HD 1080p', sku: 'ELEC-004', category_id: 'c0000000-0000-0000-0000-000000000001', unit_of_measure: 'pcs', cost_per_unit: 55.00, reorder_level: 20, description: '1080p HD webcam with microphone' },
      { id: 'd0000000-0000-0000-0000-000000000020', name: 'Ethernet Cable 3m', sku: 'ELEC-005', category_id: 'c0000000-0000-0000-0000-000000000001', unit_of_measure: 'pcs', cost_per_unit: 6.99, reorder_level: 100, description: 'Cat6 ethernet cable, 3 meters' },
    ]);

    // 5. Stock
    await supabase.from('stock').insert([
      { product_id: 'd0000000-0000-0000-0000-000000000001', location_id: 'b0000000-0000-0000-0000-000000000002', quantity: 42 },
      { product_id: 'd0000000-0000-0000-0000-000000000002', location_id: 'b0000000-0000-0000-0000-000000000002', quantity: 18 },
      { product_id: 'd0000000-0000-0000-0000-000000000003', location_id: 'b0000000-0000-0000-0000-000000000002', quantity: 8 },
      { product_id: 'd0000000-0000-0000-0000-000000000019', location_id: 'b0000000-0000-0000-0000-000000000001', quantity: 35 },
      { product_id: 'd0000000-0000-0000-0000-000000000020', location_id: 'b0000000-0000-0000-0000-000000000002', quantity: 150 },
      { product_id: 'd0000000-0000-0000-0000-000000000004', location_id: 'b0000000-0000-0000-0000-000000000001', quantity: 38 },
      { product_id: 'd0000000-0000-0000-0000-000000000005', location_id: 'b0000000-0000-0000-0000-000000000001', quantity: 220 },
      { product_id: 'd0000000-0000-0000-0000-000000000006', location_id: 'b0000000-0000-0000-0000-000000000002', quantity: 180 },
      { product_id: 'd0000000-0000-0000-0000-000000000007', location_id: 'b0000000-0000-0000-0000-000000000006', quantity: 320 },
      { product_id: 'd0000000-0000-0000-0000-000000000008', location_id: 'b0000000-0000-0000-0000-000000000006', quantity: 450 },
      { product_id: 'd0000000-0000-0000-0000-000000000009', location_id: 'b0000000-0000-0000-0000-000000000007', quantity: 175 },
      { product_id: 'd0000000-0000-0000-0000-000000000010', location_id: 'b0000000-0000-0000-0000-000000000002', quantity: 55 },
      { product_id: 'd0000000-0000-0000-0000-000000000011', location_id: 'b0000000-0000-0000-0000-000000000003', quantity: 12 },
      { product_id: 'd0000000-0000-0000-0000-000000000012', location_id: 'b0000000-0000-0000-0000-000000000003', quantity: 28 },
      { product_id: 'd0000000-0000-0000-0000-000000000013', location_id: 'b0000000-0000-0000-0000-000000000005', quantity: 95 },
      { product_id: 'd0000000-0000-0000-0000-000000000014', location_id: 'b0000000-0000-0000-0000-000000000004', quantity: 850 },
      { product_id: 'd0000000-0000-0000-0000-000000000015', location_id: 'b0000000-0000-0000-0000-000000000005', quantity: 45 },
      { product_id: 'd0000000-0000-0000-0000-000000000016', location_id: 'b0000000-0000-0000-0000-000000000007', quantity: 22 },
      { product_id: 'd0000000-0000-0000-0000-000000000017', location_id: 'b0000000-0000-0000-0000-000000000007', quantity: 65 },
      { product_id: 'd0000000-0000-0000-0000-000000000018', location_id: 'b0000000-0000-0000-0000-000000000006', quantity: 38 },
    ]);

    // 6. Update ref_counters
    await supabase.from('ref_counters').update({ last_number: 5 }).eq('type', 'RECEIPT');
    await supabase.from('ref_counters').update({ last_number: 4 }).eq('type', 'DELIVERY');
    await supabase.from('ref_counters').update({ last_number: 2 }).eq('type', 'ADJUSTMENT');

    // 7. Receipts
    await supabase.from('receipts').insert([
      { id: 'e0000000-0000-0000-0000-000000000001', reference: 'RCP-0001', date: '2026-03-10', supplier_name: 'TechParts Global', destination_location_id: 'b0000000-0000-0000-0000-000000000001', status: 'DONE', notes: 'Monthly electronics restock', created_by: 'system', validated_at: '2026-03-10T14:30:00Z' },
      { id: 'e0000000-0000-0000-0000-000000000002', reference: 'RCP-0002', date: '2026-03-11', supplier_name: 'Steel Works Ltd', destination_location_id: 'b0000000-0000-0000-0000-000000000001', status: 'DONE', notes: 'Raw material order #4521', created_by: 'system', validated_at: '2026-03-11T09:15:00Z' },
      { id: 'e0000000-0000-0000-0000-000000000003', reference: 'RCP-0003', date: '2026-03-12', supplier_name: 'PackRight Industries', destination_location_id: 'b0000000-0000-0000-0000-000000000006', status: 'READY', notes: 'Packaging supplies Q1', created_by: 'system' },
      { id: 'e0000000-0000-0000-0000-000000000004', reference: 'RCP-0004', date: '2026-03-13', supplier_name: 'FreshFoods Corp', destination_location_id: 'b0000000-0000-0000-0000-000000000005', status: 'WAITING', notes: 'Cold storage items', created_by: 'system' },
      { id: 'e0000000-0000-0000-0000-000000000005', reference: 'RCP-0005', date: '2026-03-14', supplier_name: 'Office Depot', destination_location_id: 'b0000000-0000-0000-0000-000000000007', status: 'DRAFT', notes: 'Office supplies reorder', created_by: 'system' },
    ]);

    // 8. Receipt Items
    await supabase.from('receipt_items').insert([
      { receipt_id: 'e0000000-0000-0000-0000-000000000001', product_id: 'd0000000-0000-0000-0000-000000000001', ordered_qty: 50, received_qty: 50 },
      { receipt_id: 'e0000000-0000-0000-0000-000000000001', product_id: 'd0000000-0000-0000-0000-000000000002', ordered_qty: 20, received_qty: 20 },
      { receipt_id: 'e0000000-0000-0000-0000-000000000001', product_id: 'd0000000-0000-0000-0000-000000000003', ordered_qty: 15, received_qty: 12 },
      { receipt_id: 'e0000000-0000-0000-0000-000000000002', product_id: 'd0000000-0000-0000-0000-000000000004', ordered_qty: 100, received_qty: 100 },
      { receipt_id: 'e0000000-0000-0000-0000-000000000002', product_id: 'd0000000-0000-0000-0000-000000000005', ordered_qty: 250, received_qty: 250 },
      { receipt_id: 'e0000000-0000-0000-0000-000000000003', product_id: 'd0000000-0000-0000-0000-000000000007', ordered_qty: 800, received_qty: 0 },
      { receipt_id: 'e0000000-0000-0000-0000-000000000003', product_id: 'd0000000-0000-0000-0000-000000000008', ordered_qty: 500, received_qty: 0 },
      { receipt_id: 'e0000000-0000-0000-0000-000000000004', product_id: 'd0000000-0000-0000-0000-000000000013', ordered_qty: 200, received_qty: 0 },
      { receipt_id: 'e0000000-0000-0000-0000-000000000004', product_id: 'd0000000-0000-0000-0000-000000000015', ordered_qty: 100, received_qty: 0 },
      { receipt_id: 'e0000000-0000-0000-0000-000000000005', product_id: 'd0000000-0000-0000-0000-000000000016', ordered_qty: 50, received_qty: 0 },
      { receipt_id: 'e0000000-0000-0000-0000-000000000005', product_id: 'd0000000-0000-0000-0000-000000000017', ordered_qty: 100, received_qty: 0 },
    ]);

    // 9. Deliveries
    await supabase.from('deliveries').insert([
      { id: 'f0000000-0000-0000-0000-000000000001', reference: 'DEL-0001', date: '2026-03-10', customer_name: 'RetailMax Stores', source_location_id: 'b0000000-0000-0000-0000-000000000003', status: 'DONE', notes: 'Weekly retail restock', created_by: 'system', validated_at: '2026-03-10T16:00:00Z' },
      { id: 'f0000000-0000-0000-0000-000000000002', reference: 'DEL-0002', date: '2026-03-12', customer_name: 'CityMart Express', source_location_id: 'b0000000-0000-0000-0000-000000000007', status: 'DONE', notes: 'Express delivery order', created_by: 'system', validated_at: '2026-03-12T11:45:00Z' },
      { id: 'f0000000-0000-0000-0000-000000000003', reference: 'DEL-0003', date: '2026-03-13', customer_name: 'GreenLeaf Cafe', source_location_id: 'b0000000-0000-0000-0000-000000000005', status: 'READY', notes: 'F&B supplies for cafe chain', created_by: 'system' },
      { id: 'f0000000-0000-0000-0000-000000000004', reference: 'DEL-0004', date: '2026-03-14', customer_name: 'BuildPro Construction', source_location_id: 'b0000000-0000-0000-0000-000000000002', status: 'DRAFT', notes: 'Construction materials order', created_by: 'system' },
    ]);

    // 10. Delivery Items
    await supabase.from('delivery_items').insert([
      { delivery_id: 'f0000000-0000-0000-0000-000000000001', product_id: 'd0000000-0000-0000-0000-000000000001', demand_qty: 10, shipped_qty: 10 },
      { delivery_id: 'f0000000-0000-0000-0000-000000000001', product_id: 'd0000000-0000-0000-0000-000000000020', demand_qty: 25, shipped_qty: 25 },
      { delivery_id: 'f0000000-0000-0000-0000-000000000002', product_id: 'd0000000-0000-0000-0000-000000000009', demand_qty: 50, shipped_qty: 50 },
      { delivery_id: 'f0000000-0000-0000-0000-000000000002', product_id: 'd0000000-0000-0000-0000-000000000018', demand_qty: 15, shipped_qty: 15 },
      { delivery_id: 'f0000000-0000-0000-0000-000000000003', product_id: 'd0000000-0000-0000-0000-000000000013', demand_qty: 30, shipped_qty: 0 },
      { delivery_id: 'f0000000-0000-0000-0000-000000000003', product_id: 'd0000000-0000-0000-0000-000000000014', demand_qty: 200, shipped_qty: 0 },
      { delivery_id: 'f0000000-0000-0000-0000-000000000004', product_id: 'd0000000-0000-0000-0000-000000000004', demand_qty: 20, shipped_qty: 0 },
      { delivery_id: 'f0000000-0000-0000-0000-000000000004', product_id: 'd0000000-0000-0000-0000-000000000006', demand_qty: 50, shipped_qty: 0 },
    ]);

    // 11. Adjustments
    await supabase.from('adjustments').insert([
      { id: 'aa000000-0000-0000-0000-000000000001', reference: 'ADJ-0001', date: '2026-03-11', product_id: 'd0000000-0000-0000-0000-000000000003', location_id: 'b0000000-0000-0000-0000-000000000002', previous_qty: 10, counted_qty: 8, difference: -2, reason: 'Damaged in transit - 2 monitors cracked', created_by: 'system' },
      { id: 'aa000000-0000-0000-0000-000000000002', reference: 'ADJ-0002', date: '2026-03-13', product_id: 'd0000000-0000-0000-0000-000000000017', location_id: 'b0000000-0000-0000-0000-000000000007', previous_qty: 60, counted_qty: 65, difference: 5, reason: 'Found extra stock during audit', created_by: 'system' },
    ]);

    // 12. Demo Users
    const demoUsers = [
      { email: 'admin@coreinventory.demo', password: 'admin123', full_name: 'Demo Admin', role: 'ADMIN' },
      { email: 'manager@coreinventory.demo', password: 'manager123', full_name: 'Demo Manager', role: 'MANAGER' },
      { email: 'staff@coreinventory.demo', password: 'staff123', full_name: 'Demo Staff', role: 'STAFF' },
    ];

    for (const u of demoUsers) {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name },
      });

      if (authUser?.user && !authError) {
        await supabase.from('profiles').upsert({
          id: authUser.user.id,
          email: u.email,
          full_name: u.full_name,
          role: u.role,
        });
      }
    }

    // 13. Move History
    await supabase.from('moves').insert([
      { date: '2026-03-10T14:30:00Z', type: 'RECEIPT', reference: 'RCP-0001', product_id: 'd0000000-0000-0000-0000-000000000001', quantity: 50, from_location: 'Supplier', to_location: 'WH1-A', created_by: 'system' },
      { date: '2026-03-10T14:30:00Z', type: 'RECEIPT', reference: 'RCP-0001', product_id: 'd0000000-0000-0000-0000-000000000002', quantity: 20, from_location: 'Supplier', to_location: 'WH1-A', created_by: 'system' },
      { date: '2026-03-10T14:30:00Z', type: 'RECEIPT', reference: 'RCP-0001', product_id: 'd0000000-0000-0000-0000-000000000003', quantity: 12, from_location: 'Supplier', to_location: 'WH1-A', created_by: 'system' },
      { date: '2026-03-10T16:00:00Z', type: 'DELIVERY', reference: 'DEL-0001', product_id: 'd0000000-0000-0000-0000-000000000001', quantity: -10, from_location: 'WH1-C', to_location: 'Customer', created_by: 'system' },
      { date: '2026-03-10T16:00:00Z', type: 'DELIVERY', reference: 'DEL-0001', product_id: 'd0000000-0000-0000-0000-000000000020', quantity: -25, from_location: 'WH1-C', to_location: 'Customer', created_by: 'system' },
      { date: '2026-03-11T09:15:00Z', type: 'RECEIPT', reference: 'RCP-0002', product_id: 'd0000000-0000-0000-0000-000000000004', quantity: 100, from_location: 'Supplier', to_location: 'WH1-A', created_by: 'system' },
      { date: '2026-03-11T09:15:00Z', type: 'RECEIPT', reference: 'RCP-0002', product_id: 'd0000000-0000-0000-0000-000000000005', quantity: 250, from_location: 'Supplier', to_location: 'WH1-A', created_by: 'system' },
      { date: '2026-03-11T10:00:00Z', type: 'ADJUSTMENT', reference: 'ADJ-0001', product_id: 'd0000000-0000-0000-0000-000000000003', quantity: -2, from_location: 'WH1-B', to_location: 'WH1-B', created_by: 'system' },
      { date: '2026-03-12T11:45:00Z', type: 'DELIVERY', reference: 'DEL-0002', product_id: 'd0000000-0000-0000-0000-000000000009', quantity: -50, from_location: 'DC-B2', to_location: 'Customer', created_by: 'system' },
      { date: '2026-03-12T11:45:00Z', type: 'DELIVERY', reference: 'DEL-0002', product_id: 'd0000000-0000-0000-0000-000000000018', quantity: -15, from_location: 'DC-B1', to_location: 'Customer', created_by: 'system' },
      { date: '2026-03-13T14:00:00Z', type: 'ADJUSTMENT', reference: 'ADJ-0002', product_id: 'd0000000-0000-0000-0000-000000000017', quantity: 5, from_location: 'DC-B2', to_location: 'DC-B2', created_by: 'system' },
    ]);

    return NextResponse.json({ message: 'Database seeded successfully!' }, { status: 201 });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
