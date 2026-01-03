"use client";

import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";

type Props = {
  defaultUsername: string;
  defaultColor: string;
  onSubmit: (payload: { username: string; displayColor: string }) => void;
  statusMessage: string | null;
  loading?: boolean;
};

export default function ProfileForm({
  defaultUsername,
  defaultColor,
  onSubmit,
  statusMessage,
  loading = false,
}: Props) {
  const [username, setUsername] = useState(() => defaultUsername);
  const [displayColor, setDisplayColor] = useState(() => defaultColor);

  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Profil
      </h2>
      <div className="flex flex-col items-center my-2">
        <div
          className="font-bold text-white select-none"
          style={{
            background: displayColor,
            borderRadius: 9999,
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {username ? username[0].toUpperCase() : ""}
        </div>
      </div>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!username || !displayColor) return;
          onSubmit({ username, displayColor });
        }}
      >
        <label className="block text-xs">
          <span className="text-slate-600">Nom d’utilisateur</span>
          <input
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </label>
        <label className="block text-xs">
          <span className="text-slate-600">Couleur</span>
          <input
            type="color"
            className="mt-1 h-10 w-full cursor-pointer rounded border border-slate-200"
            value={displayColor}
            onChange={(e) => setDisplayColor(e.target.value)}
            disabled={loading}
          />
        </label>
        {statusMessage && (
          <p className="text-xs text-blue-600">{statusMessage}</p>
        )}
        <button
          type="submit"
          className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Mise à jour…
            </>
          ) : (
            "Mettre à jour"
          )}
        </button>
      </form>
    </section>
  );
}
