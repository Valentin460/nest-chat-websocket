import axios, { AxiosResponse } from "axios";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "@/types/auth.types";

export const api = axios.create({
  baseURL: "http://localhost:3001",
});

export const authApi = {
  register: (
    username: string,
    password: string
  ): Promise<AxiosResponse<AuthResponse>> =>
    api.post<AuthResponse>("/auth/register", {
      username,
      password,
    } as RegisterRequest),
  login: (
    username: string,
    password: string
  ): Promise<AxiosResponse<AuthResponse>> =>
    api.post<AuthResponse>("/auth/login", {
      username,
      password,
    } as LoginRequest),
};

export const userApi = {
  updateProfile: (userId: number, username?: string, color?: string) =>
    api.put("/users/profile", { userId, username, color }),
  getAll: () => api.get("/users"),
};
