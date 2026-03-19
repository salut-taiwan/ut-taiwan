// ============================================================
// Shared DTOs — mirrors the Express backend contracts
// ============================================================

export interface FacultyDTO {
  id: string;
  code: string;
  name: string;
  description?: string;
  programCount?: number;
}

export interface ProgramDTO {
  id: string;
  faculty_id: string;
  code: string;
  name: string;
  level: 'D3' | 'D4' | 'S1';
  total_sks: number;
  faculties?: { code: string; name: string };
}

export interface ModuleSummaryDTO {
  id: string;
  tbo_code: string;
  name: string;
  cover_image_url: string | null;
  price_student: number;
  is_available: boolean;
}

export interface ModuleDTO extends ModuleSummaryDTO {
  edition: string | null;
  author: string | null;
  publisher: string;
  price_general: number;
  weight_grams: number | null;
  has_multimedia: boolean;
  tbo_url: string | null;
}

export interface SubjectDTO {
  id: string;
  program_id: string;
  code: string;
  name: string;
  sks: number;
  exam_period: string;
  semester_hint: number;
  is_required: boolean;
  notes: string | null;
  subject_modules?: Array<{
    sort_order: number;
    modules: ModuleSummaryDTO;
  }>;
}

export interface PackageDTO {
  id: string;
  program_id: string;
  name: string;
  description: string | null;
  semester: number;
  is_active: boolean;
  programs?: { id: string; code: string; name: string };
  package_modules?: Array<{
    sort_order: number;
    modules: ModuleSummaryDTO;
  }>;
  totalPrice: number;
}

export interface CartItemDTO {
  id: string;
  moduleId: string;
  tboCode: string;
  moduleName: string;
  coverImageUrl: string | null;
  quantity: number;
  priceSnapshot: number;
  subtotal: number;
  isAvailable: boolean;
}

export interface CartDTO {
  id: string;
  userId: string;
  items: CartItemDTO[];
  subtotal: number;
  itemCount: number;
}

export interface OrderDTO {
  id: string;
  order_number: string;
  status: 'pending' | 'awaiting_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shipping_cost: number;
  total_amount: number;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_province: string;
  shipping_postal: string;
  shipping_country: string;
  shipping_phone: string;
  notes: string | null;
  shipped_at?: string;
  order_items: OrderItemDTO[];
  payments: PaymentDTO[];
  created_at: string;
}

export interface OrderItemDTO {
  id: string;
  module_code: string;
  module_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface PaymentDTO {
  id: string;
  gateway: 'manual';
  method: string;
  bank: string | null;
  amount: number;
  status: 'pending' | 'paid' | 'expired' | 'failed' | 'refunded';
  paid_at: string | null;
  expires_at: string | null;
}

export interface UserProfileDTO {
  id: string;
  email: string;
  name: string;
  nim: string | null;
  phone: string | null;
  program_id: string | null;
  current_semester: number | null;
  shipping_address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string;
  bank_ntd_code?: string | null;
  bank_ntd_name?: string | null;
  bank_ntd_account?: string | null;
  bank_idr_name?: string | null;
  bank_idr_account?: string | null;
  birth_place?: string | null;
  birth_date?: string | null;
  address_zh_city?: string | null;
  address_zh_district?: string | null;
  address_zh_road?: string | null;
  address_zh_number?: string | null;
  address_zh_floor?: string | null;
  role: 'student' | 'admin';
  is_verified: boolean;
  programs?: { code: string; name: string } | null;
}

export interface ScraperRunDTO {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: 'running' | 'success' | 'failed';
  modules_added: number;
  modules_updated: number;
  modules_removed: number;
  error_message: string | null;
  triggered_by: 'cron' | 'manual';
}

// Request types
export interface CheckoutRequestDTO {
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostal: string;
  shippingCountry: string;
  shippingPhone: string;
  notes?: string;
  paymentMethod: 'bank_transfer';
  paymentBank?: string;
}
