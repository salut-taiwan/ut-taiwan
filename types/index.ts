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
  // Backend-formatted strings (Phase 1 additive)
  price_student_display?: string | null;
}

export interface ModuleDTO extends ModuleSummaryDTO {
  edition: string | null;
  author: string | null;
  publisher: string;
  price_general: number;
  weight_grams: number | null;
  has_multimedia: boolean;
  tbo_url: string | null;
  price_general_display?: string | null;
  subject_modules?: Array<{
    subjects: {
      id: string;
      code: string;
      name: string;
      programs?: { id: string; code: string; name: string };
    };
  }>;
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
  // Backend-derived (Phase 1 additive)
  available_count?: number;
  request_count?: number;
  total_modules?: number;
  summary_label?: string;
  totalPrice_display?: string;
}

export interface ProductImageDTO {
  id: string;
  image_url: string;
  sort_order: number;
}

export interface ProductVariantOptionDTO {
  id: string;
  value: string;
  hex_color: string | null;
  sort_order: number;
}

export interface ProductVariantTypeDTO {
  id: string;
  name: string;
  identifier: string;
  sort_order: number;
  product_variant_options: ProductVariantOptionDTO[];
}

export interface ProductSKUDTO {
  id: string;
  tokopedia_sku_id: string | null;
  price: number;
  option_names: string[];
  price_display?: string | null;
}

export interface ProductDTO {
  id: string;
  tokopedia_id: string | null;
  category: string;
  name: string;
  description: string | null;
  base_price: number;
  weight_grams: number;
  cover_image_url?: string | null;
  product_images?: ProductImageDTO[];
  product_variant_types?: ProductVariantTypeDTO[];
  product_skus?: ProductSKUDTO[];
  // Backend-formatted (Phase 1 additive)
  base_price_display?: string | null;
}

export interface CartItemDTO {
  id: string;
  itemType: 'module' | 'merch';
  // Module fields
  moduleId?: string;
  tboCode?: string;
  moduleName?: string;
  // Merch fields
  skuId?: string;
  variantLabel?: string | null;
  productNameSnapshot?: string;
  // Shared
  coverImageUrl: string | null;
  quantity: number;
  priceSnapshot: number;
  subtotal: number;
  isAvailable: boolean;
  isRequest: boolean;
  isStale?: boolean;
  isPricePending?: boolean;
  // Backend-formatted (Phase 1 additive)
  priceSnapshotDisplay?: string | null;
  subtotalDisplay?: string | null;
}

export interface FeeLine {
  key: 'shipping' | 'box' | 'admin';
  label: string;
  amount: number;
  amount_display: string;
  is_waived: boolean;
  original_amount?: number;
  original_amount_display?: string;
}

export interface TotalBreakdown {
  subtotal_display: string;
  fee_lines: FeeLine[];
  unique_code_display: string | null;
  total_display: string;
}

export interface CartDTO {
  id: string;
  userId: string;
  items: CartItemDTO[];
  subtotal: number;
  itemCount: number;
  hasStaleItems?: boolean;
  // Backend-formatted (Phase 1 additive)
  subtotal_display?: string;
  total_breakdown?: TotalBreakdown;
}

export interface OrderStep {
  key: string;
  label: string;
  state: 'completed' | 'current' | 'pending';
}

export interface OrderDTO {
  id: string;
  order_number: string;
  status: 'pending' | 'awaiting_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shipping_cost: number;
  box_fee: number;
  admin_fee: number;
  is_salut_order: boolean;
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
  // Computed by backend
  step_index?: number;
  can_cancel?: boolean;
  confirm_deadline?: string;
  confirm_deadline_is_urgent?: boolean;
  // Backend-formatted (Phase 1 additive)
  status_label?: string;
  subtotal_display?: string;
  shipping_cost_display?: string;
  box_fee_display?: string;
  admin_fee_display?: string;
  total_amount_display?: string;
  created_at_display?: string;
  shipped_at_display?: string | null;
  confirm_deadline_display?: string | null;
  progress_percent?: number;
  steps?: OrderStep[];
  shipping_address_lines?: string[];
  fee_lines?: FeeLine[];
  total_breakdown?: TotalBreakdown;
}

export interface OrderItemDTO {
  id: string;
  module_code: string;
  module_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  is_request: boolean;
  request_status: 'pending' | 'approved' | 'rejected' | null;
  sku_id?: string | null;
  variant_label?: string | null;
  display_status?: 'normal' | 'rejected' | 'pending_request' | 'zero_price';
  // Backend-formatted (Phase 1 additive)
  unit_price_display?: string;
  subtotal_display?: string;
  request_status_label?: string | null;
  price_visible?: boolean;
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
  show_payment_instructions?: boolean;
  show_payment_deadline?: boolean;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
  proof_path?: string | null;
  invoice_path?: string | null;
  proof_uploaded_at?: string | null;
  unique_code?: number;
  // Backend-formatted (Phase 1 additive)
  payment_status_label?: string | null;
  amount_display?: string | null;
  unique_code_display?: string | null;
  expires_at_display?: string | null;
  paid_at_display?: string | null;
  proof_uploaded_at_display?: string | null;
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
  is_salut?: boolean;
  is_salut_active?: boolean;
  salut_status?: 'none' | 'pending' | 'approved' | 'rejected' | 'expired';
  salut_applied_at?: string | null;
  salut_rejection_reason?: string | null;
  salut_approved_at?: string | null;
  programs?: { code: string; name: string } | null;
  // Backend-derived (Phase 1 additive)
  is_member?: boolean;
  is_pending?: boolean;
  shipping_address_display?: string | null;
  shipping_address_lines?: string[];
  salut_approved_at_display?: string | null;
  salut_applied_at_display?: string | null;
  salut_applied_fee_amount_display?: string | null;
}

export interface AdminSalutApplicationDTO {
  id: string;
  email: string;
  name: string;
  nim: string | null;
  current_semester: number | null;
  salut_applied_at: string;
  salut_payment_proof_url: string;
  salut_applied_fee_amount: string | null;
  salut_applied_semester: number | null;
  programs: { code: string; name: string } | null;
  // Backend-formatted (Phase 1 additive)
  salut_applied_at_display?: string | null;
  salut_applied_fee_amount_display?: string | null;
}

export interface AdminUserDTO {
  id: string;
  email: string;
  name: string;
  nim: string | null;
  phone: string | null;
  current_semester: number | null;
  is_salut: boolean;
  salut_status?: string;
  is_verified: boolean;
  created_at: string;
  programs?: { code: string; name: string } | null;
  // Backend-formatted (Phase 1 additive)
  created_at_display?: string | null;
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
  triggered_by: 'cron' | 'manual' | 'prefix-manual' | 'scheduled';
  // Backend-formatted (Phase 1 additive)
  started_at_display?: string | null;
  finished_at_display?: string | null;
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
