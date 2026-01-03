"use client";

import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";

type PublicUser = {
  id: string;
  username: string;
};

type Props = {
  isLoading: boolean;
  availableUsers: PublicUser[];
  onSubmit: (payload: {
    name: string;
    memberIds: string[];
    shareHistory: boolean;
  }) => void;
};

export default function CreateRoomForm({
  isLoading,
  availableUsers,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [shareHistory, setShareHistory] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Créer un salon
      </h2>
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || selected.size === 0) return;
          onSubmit({
            name: name.trim(),
            memberIds: Array.from(selected),
            shareHistory,
          });
          setName("");
          setSelected(new Set());
          setShareHistory(true);
        }}
      >
        <input
          className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          placeholder="Nom du salon"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="max-h-32 space-y-1 overflow-y-auto rounded border border-slate-200 p-2 text-xs">
          {availableUsers.map((user) => {
            const checked = selected.has(user.id);
            return (
              <label key={user.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = new Set(selected);
                    if (checked) next.delete(user.id);
                    else next.add(user.id);
                    setSelected(next);
                  }}
                />
                <span>{user.username}</span>
              </label>
            );
          })}
          {availableUsers.length === 0 && (
            <p className="text-slate-400">Aucun utilisateur disponible</p>
          )}
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={shareHistory}
            onChange={(e) => setShareHistory(e.target.checked)}
          />
          Partager l’historique
        </label>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin" />
              Création…
            </>
          ) : (
            "Créer"
          )}
        </button>
      </form>
    </section>
  );
}
