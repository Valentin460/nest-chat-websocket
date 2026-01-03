import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LoginRequest, RegisterRequest } from "@/types/auth.types";
import { AxiosError } from "axios";

export const useAuth = () => {
  const { user, setUser, logout: logoutStore } = useAuthStore();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: LoginRequest) =>
      authApi.login(username, password),
    onSuccess: (response) => {
      setUser(response.data);
      toast.success("Connecté avec succès!");
      router.push("/chat");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const message = error.response?.data?.message || "Identifiants invalides";
      toast.error(message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ username, password }: RegisterRequest) =>
      authApi.register(username, password),
    onSuccess: (response) => {
      setUser(response.data);
      toast.success("Compte créé avec succès!");
      router.push("/chat");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const message =
        error.response?.data?.message || "Erreur lors de l'inscription";
      toast.error(message);
    },
  });

  const logout = () => {
    logoutStore();
    router.push("/");
    toast.success("Déconnecté");
  };

  return {
    user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoading: loginMutation.isPending || registerMutation.isPending,
  };
};
