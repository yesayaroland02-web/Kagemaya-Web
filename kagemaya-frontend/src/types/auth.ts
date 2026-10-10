export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ORGANIZER';
  referral_code: string;
  profile_picture?: string | null;
  organizer_profile?: {
    organization_name: string;
    bio?: string | null;
  } | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}
