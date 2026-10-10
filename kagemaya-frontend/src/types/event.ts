export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  quota: number;
  available_quota: number;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  city: string;
  location: string;
  banner_url?: string | null;
  start_date: string;
  end_date: string;
  category: Category;
  organizer_name: string;
  starting_price: number;
  is_sold_out: boolean;
}

export interface EventReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  customer: {
    id: string;
    name: string;
    profile_picture?: string | null;
  };
}

export interface EventDetail {
  id: string;
  title: string;
  description: string;
  city: string;
  location: string;
  banner_url?: string | null;
  start_date: string;
  end_date: string;
  available_seats?: number;
  category: Category;
  organizer: {
    id: string;
    name: string;
    email: string;
    profile_picture?: string | null;
    organizer_profile?: {
      organization_name: string;
      bio?: string | null;
    } | null;
    _count?: {
      events: number;
      following: number;
    };
  };
  ticket_types: TicketType[];
  reviews: EventReview[];
  starting_price: number;
  is_sold_out: boolean;
  review_stats?: {
    total_reviews: number;
    average_rating: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
