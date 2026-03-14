// ── Database Types ──

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  main_policy: 'FIFO' | 'LIFO' | 'FEFO';
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  short_code: string;
  warehouse_id: string;
  created_at: string;
  updated_at: string;
  // Joined
  warehouse?: Warehouse;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  unit_of_measure: string;
  cost_per_unit: number;
  reorder_level: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  category?: Category;
  on_hand?: number;
}

export interface Stock {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  // Joined
  product?: Product;
  location?: Location;
}

export interface Receipt {
  id: string;
  reference: string;
  date: string;
  supplier_name: string;
  destination_location_id: string | null;
  status: 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELLED';
  notes: string | null;
  created_by: string;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  receipt_items?: ReceiptItem[];
  destination_location?: Location;
  profile?: Profile;
}

export interface ReceiptItem {
  id: string;
  receipt_id: string;
  product_id: string;
  ordered_qty: number;
  received_qty: number;
  // Joined
  product?: Product;
}

export interface Delivery {
  id: string;
  reference: string;
  date: string;
  customer_name: string;
  source_location_id: string | null;
  status: 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELLED';
  notes: string | null;
  created_by: string;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  delivery_items?: DeliveryItem[];
  source_location?: Location;
  profile?: Profile;
}

export interface DeliveryItem {
  id: string;
  delivery_id: string;
  product_id: string;
  demand_qty: number;
  shipped_qty: number;
  // Joined
  product?: Product;
}

export interface Adjustment {
  id: string;
  reference: string;
  date: string;
  product_id: string;
  location_id: string | null;
  previous_qty: number;
  counted_qty: number;
  difference: number;
  reason: string;
  created_by: string;
  created_at: string;
  // Joined
  product?: Product;
  location?: Location;
  profile?: Profile;
}

export interface Move {
  id: string;
  date: string;
  type: 'RECEIPT' | 'DELIVERY' | 'TRANSFER' | 'ADJUSTMENT';
  reference: string;
  product_id: string;
  quantity: number;
  from_location: string;
  to_location: string;
  created_by: string;
  created_at: string;
  // Joined
  product?: Product;
  profile?: Profile;
}

export interface RefCounter {
  id: string;
  type: 'RECEIPT' | 'DELIVERY' | 'ADJUSTMENT' | 'TRANSFER';
  last_number: number;
}

// ── Status badge colors ──
export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-zinc-700 text-zinc-200',
  WAITING: 'bg-amber-900/50 text-amber-300',
  READY: 'bg-blue-900/50 text-blue-300',
  DONE: 'bg-emerald-900/50 text-emerald-300',
  CANCELLED: 'bg-red-900/50 text-red-300',
};

export const MOVE_TYPE_COLORS: Record<string, string> = {
  RECEIPT: 'bg-emerald-900/50 text-emerald-300',
  DELIVERY: 'bg-blue-900/50 text-blue-300',
  TRANSFER: 'bg-amber-900/50 text-amber-300',
  ADJUSTMENT: 'bg-red-900/50 text-red-300',
};

export const UOM_OPTIONS = ['pcs', 'kg', 'ltr', 'm', 'box'] as const;
