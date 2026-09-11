export interface User {
  id?: number | string;
  username: string;
  email?: string;
  name: string;
  role: 'user' | 'admin' | 'analyst';
  is_admin: boolean;
  gmail_connected?: boolean;
  auth_provider?: 'local' | 'google';
  badgeId?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user?: User;
}

export interface SignupResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}
