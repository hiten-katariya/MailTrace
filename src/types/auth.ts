export interface User {
  username: string;
  role: 'analyst' | 'admin' | 'investigator';
  name: string;
  badgeId: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}
