// Types pour l'authentification

export interface User {
  id: number;
  username: string;
  color: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  username: string;
  color: string;
}
