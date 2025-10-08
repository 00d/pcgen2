export interface User {
  id: string;
  email: string;
  username: string;
  preferences?: {
    theme: 'light' | 'dark';
    language: string;
    pdfTemplate: 'standard' | 'compact';
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
