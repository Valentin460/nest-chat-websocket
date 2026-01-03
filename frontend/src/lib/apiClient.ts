import axios from "axios";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const api = axios.create({
  baseURL: API_BASE,
});

export default api;
