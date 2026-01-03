"use client";

import React, { useState } from "react";

type RoomMember = { id: string; username: string };
type PublicUser = { id: string; username: string };

export default function InviteForm({
  roomId,
  members,
  users,
  onInvite,
}: {
  roomId: string;
  members: RoomMember[];
  users: PublicUser[];
  onInvite: (payload: {
    roomId: string;
    userIds: string[];
    shareHistory: boolean;
  }) => void;
}) {
  const [shareHistory, setShareHistory] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set());

  const available = users.filter((u) => !members.some((m) => m.id === u.id));

  return (
    <section className="rounded-xl bg-white p-4 shadow">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Inviter
      </h2>
      <form
        className="space-y-2 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (selection.size === 0) return;
          onInvite({ roomId, userIds: Array.from(selection), shareHistory });
          setSelection(new Set());
          setShareHistory(false);
        }}
      >
        <div className="max-h-32 space-y-1 overflow-y-auto rounded border border-slate-200 p-2 text-xs">
          {available.map((user) => {
            const checked = selection.has(user.id);
            return (
              <label key={user.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = new Set(selection);
                    if (checked) next.delete(user.id);
                    else next.add(user.id);
                    setSelection(next);
                  }}
                />
                <span>{user.username}</span>
              </label>
            );
          })}
          {available.length === 0 && (
            <p className="text-slate-400">Personne à inviter</p>
          )}
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={shareHistory}
            onChange={(e) => setShareHistory(e.target.checked)}
          />
          Accès à l’historique
        </label>
        <button
          type="submit"
          className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
        >
          Ajouter
        </button>
      </form>
    </section>
  );
}
