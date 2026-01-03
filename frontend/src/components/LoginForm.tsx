import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { AuthState } from "@/types/chat.types";
import { API_BASE } from "@/lib/apiClient";

export default function LoginForm({
  setAuth,
}: {
  setAuth: (auth: AuthState) => void;
}) {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    username: "",
    displayColor: "#3b82f6",
  });
  const [authError, setAuthError] = useState<string | null>(null);

  const registerOrLogin = async () => {
    const url = `${API_BASE}/auth/${
      authMode === "register" ? "register" : "login"
    }`;
    const payload: Record<string, string> = {
      email: authForm.email,
      password: authForm.password,
    };
    if (authMode === "register") {
      payload.username = authForm.username;
      payload.displayColor = authForm.displayColor;
    }
    const response = await axios.post(url, payload);
    return response.data as AuthState;
  };

  const authMutation = useMutation({
    mutationFn: registerOrLogin,
    onSuccess: (data: AuthState) => {
      setAuth(data);
      setAuthForm({
        email: "",
        password: "",
        username: "",
        displayColor: "#3b82f6",
      });
      setAuthError(null);
    },
    onError: (error: unknown) => {
      setAuthError(
        error instanceof Error ? error.message : "Action impossible"
      );
    },
  });
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Chat App</h1>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              className={`rounded px-3 py-1 ${
                authMode === "login" ? "bg-blue-600 text-white" : "bg-slate-200"
              }`}
              onClick={() => setAuthMode("login")}
            >
              Connexion
            </button>
            <button
              type="button"
              className={`rounded px-3 py-1 ${
                authMode === "register"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200"
              }`}
              onClick={() => setAuthMode("register")}
            >
              Inscription
            </button>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setAuthError(null);
            authMutation.mutate();
          }}
        >
          <label className="block text-sm">
            <span className="text-slate-600">Email</span>
            <input
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
              type="email"
              required
              value={authForm.email}
              onChange={(event) =>
                setAuthForm((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
            />
          </label>

          {authMode === "register" && (
            <label className="block text-sm">
              <span className="text-slate-600">Nom d’utilisateur</span>
              <input
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                required
                value={authForm.username}
                onChange={(event) =>
                  setAuthForm((prev) => ({
                    ...prev,
                    username: event.target.value,
                  }))
                }
              />
            </label>
          )}

          <label className="block text-sm">
            <span className="text-slate-600">Mot de passe</span>
            <input
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
              type="password"
              required
              value={authForm.password}
              onChange={(event) =>
                setAuthForm((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
            />
          </label>

          {authMode === "register" && (
            <label className="block text-sm">
              <span className="text-slate-600">Couleur</span>
              <input
                className="mt-1 h-10 w-full cursor-pointer rounded border border-slate-200"
                type="color"
                value={authForm.displayColor}
                onChange={(event) =>
                  setAuthForm((prev) => ({
                    ...prev,
                    displayColor: event.target.value,
                  }))
                }
              />
            </label>
          )}

          {authError && <p className="text-sm text-red-500">{authError}</p>}

          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white flex items-center justify-center gap-2"
            disabled={authMutation.isPending}
          >
            {authMutation.isPending ? (
              <>
                <FaSpinner className="animate-spin" />
                Veuillez patienter…
              </>
            ) : authMode === "login" ? (
              "Se connecter"
            ) : (
              "Créer un compte"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
