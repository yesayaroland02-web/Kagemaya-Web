export interface TicketItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  ticket_type: {
    id?: string;
    name: string;
    description?: string;
    price?: number;
  };
}

export interface TicketEvent {
  id: string;
  title: string;
  description?: string;
  banner_url?: string | null;
  start_date: string;
  end_date?: string;
  city: string;
  location: string;
  category?: {
    name: string;
    slug?: string;
  };
  organizer?: {
    id?: string;
    name: string;
    email?: string;
    organizer_profile?: {
      organization_name?: string;
      bio?: string | null;
    } | null;
  };
}

export interface TicketCustomer {
  id?: string;
  name?: string;
  email?: string;
}

export interface TicketData {
  id: string;
  status: 'WAITING_PAYMENT' | 'WAITING_CONFIRMATION' | 'DONE' | 'REJECTED' | 'EXPIRED' | 'CANCELED';
  total_price: number;
  voucher_discount?: number;
  coupon_discount?: number;
  points_used?: number;
  final_price: number;
  created_at: string;
  payment_deadline?: string;
  customer?: TicketCustomer;
  event: TicketEvent;
  transaction_items: TicketItem[];
}
