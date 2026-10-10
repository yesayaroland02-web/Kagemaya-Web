export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ORGANIZER';
  profile_picture?: string | null;
  referral_code: string;
  referred_by_id?: string | null;
  created_at: string;
  organizer_profile?: {
    organization_name: string;
    bio?: string | null;
  } | null;
}

export interface PointTransaction {
  id: string;
  amount: number;
  remaining_amount: number;
  type: 'EARN' | 'REDEEM' | 'EXPIRE';
  expires_at: string;
  created_at: string;
  transaction?: {
    id: string;
    final_price: number;
    created_at: string;
  } | null;
}

export interface PointsData {
  balance: number;
  history: PointTransaction[];
}

export interface Coupon {
  id: string;
  discount_amount: number;
  expires_at: string;
  is_used: boolean;
  created_at: string;
}
