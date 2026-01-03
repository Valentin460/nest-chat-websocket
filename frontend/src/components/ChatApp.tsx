import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaSpinner } from "react-icons/fa";

import UserAvatar from "@/components/UserAvatar";
import CreateRoomForm from "@/components/CreateRoomForm";
import ProfileForm from "@/components/ProfileForm";
import InviteForm from "@/components/InviteForm";
import LoginForm from "@/components/LoginForm";
import {
  AuthState,
  Message,
  PublicUser,
  RoomMember,
  RoomSummary,
} from "@/types/chat.types";
import api, { API_BASE } from "@/lib/apiClient";

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? API_BASE;
export const EMOJIS = ["👍", "❤️", "😂", "😮", "🎉", "🔥"];

export default function ChatApp() {
  const queryClient = useQueryClient();
  const [auth, setAuth] = useState<AuthState | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const raw = window.localStorage.getItem("chat-app-auth");
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthState;
    } catch {
      window.localStorage.removeItem("chat-app-auth");
      return null;
    }
  });

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [typingUsers, setTypingUsers] = useState<Record<string, RoomMember[]>>(
    {}
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<{
    roomId: string | null;
    timeoutId: number | null;
  }>({ roomId: null, timeoutId: null });
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (auth) {
      window.localStorage.setItem("chat-app-auth", JSON.stringify(auth));
    } else {
      window.localStorage.removeItem("chat-app-auth");
    }
  }, [auth]);

  const authHeaders = useMemo(() => {
    if (!auth) {
      return undefined;
    }
    return { Authorization: `Bearer ${auth.accessToken}` };
  }, [auth]);

  const roomsQuery = useQuery<RoomSummary[]>({
    queryKey: ["rooms"],
    enabled: !!auth,
    queryFn: async () => {
      const response = await api.get("/rooms", { headers: authHeaders });
      return response.data;
    },
  });

  const usersQuery = useQuery<PublicUser[]>({
    queryKey: ["users"],
    enabled: !!auth,
    queryFn: async () => {
      const response = await api.get("/users", { headers: authHeaders });
      return response.data;
    },
  });

  const rooms = useMemo<RoomSummary[]>(
    () => roomsQuery.data ?? [],
    [roomsQuery.data]
  );
  const currentRoomId = useMemo(() => {
    if (
      selectedRoomId &&
      rooms.some((room: RoomSummary) => room.id === selectedRoomId)
    ) {
      return selectedRoomId;
    }
    return rooms[0]?.id ?? null;
  }, [rooms, selectedRoomId]);

  const messagesQuery = useQuery<Message[]>({
    queryKey: ["messages", currentRoomId],
    enabled: !!auth && !!currentRoomId,
    queryFn: async () => {
      if (!currentRoomId) {
        return [];
      }
      const response = await api.get(`/rooms/${currentRoomId}/messages`, {
        headers: authHeaders,
      });
      return response.data;
    },
  });

  useEffect(() => {
    if (!auth) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      typingTimerRef.current = { roomId: null, timeoutId: null };
      return;
    }

    const socket = io(WS_URL, {
      auth: { token: auth.accessToken },
      transports: ["websocket"],
    });

    socket.on(
      "connection:init",
      (payload: { user: PublicUser; rooms: RoomSummary[] }) => {
        setAuth((prev) => (prev ? { ...prev, user: payload.user } : prev));
        queryClient.setQueryData(["rooms"], payload.rooms);
      }
    );

    socket.on("rooms:update", (rooms: RoomSummary[]) => {
      queryClient.setQueryData(["rooms"], rooms);
    });

    socket.on("message:new", (message: Message) => {
      queryClient.setQueryData<Message[]>(
        ["messages", message.roomId],
        (old: Message[] | undefined) => {
          const current = old ?? [];
          return [...current, message];
        }
      );
      if (message.roomId === currentRoomId) {
        setTimeout(() => {
          listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
          });
        }, 50);
      }
    });

    socket.on("message:updated", (message: Message) => {
      queryClient.setQueryData<Message[]>(
        ["messages", message.roomId],
        (old: Message[] | undefined) => {
          if (!old) {
            return [message];
          }
          return old.map((item: Message) =>
            item.id === message.id ? message : item
          );
        }
      );
    });

    socket.on(
      "typing:update",
      (payload: { roomId: string; users: RoomMember[] }) => {
        setTypingUsers((prev: Record<string, RoomMember[]>) => ({
          ...prev,
          [payload.roomId]: payload.users,
        }));
      }
    );

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [auth, queryClient, currentRoomId]);

  useEffect(() => {
    if (messagesQuery.data && currentRoomId) {
      setTimeout(() => {
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 50);
    }
  }, [messagesQuery.data, currentRoomId]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { username: string; displayColor: string }) => {
      const response = await api.patch<PublicUser>("/users/me", updates, {
        headers: authHeaders,
      });
      return response.data;
    },
    onSuccess: (user: PublicUser) => {
      setAuth((prev) => (prev ? { ...prev, user } : prev));
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setStatusMessage("Profil mis à jour");
    },
    onError: (error: unknown) => {
      setStatusMessage(
        error instanceof Error ? error.message : "Erreur profil"
      );
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      memberIds: string[];
      shareHistory: boolean;
    }) => {
      const response = await api.post<RoomSummary>(
        "/rooms",
        {
          name: payload.name,
          memberIds: payload.memberIds,
          shareHistoryWithNewMembers: payload.shareHistory,
        },
        { headers: authHeaders }
      );
      return response.data;
    },
    onSuccess: (room: RoomSummary) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setSelectedRoomId(room.id);
    },
  });

  const addMembersMutation = useMutation({
    mutationFn: async (payload: {
      roomId: string;
      userIds: string[];
      shareHistory: boolean;
    }) => {
      await api.post(
        `/rooms/${payload.roomId}/members`,
        {
          userIds: payload.userIds,
          shareHistoryWithNewMembers: payload.shareHistory,
        },
        { headers: authHeaders }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const logout = () => {
    setAuth(null);
    queryClient.clear();
    setSelectedRoomId(null);
    setMessageText("");
    setTypingUsers({});
  };

  const handleMessageChange = (value: string) => {
    setMessageText(value);
    const socket = socketRef.current;
    if (!socket || !currentRoomId) {
      return;
    }

    if (value.trim().length === 0) {
      if (typingTimerRef.current.timeoutId) {
        window.clearTimeout(typingTimerRef.current.timeoutId);
      }
      typingTimerRef.current = { roomId: null, timeoutId: null };
      socket.emit("typing:stop", { roomId: currentRoomId });
      return;
    }

    if (typingTimerRef.current.roomId !== currentRoomId) {
      socket.emit("typing:start", { roomId: currentRoomId });
    }

    if (typingTimerRef.current.timeoutId) {
      window.clearTimeout(typingTimerRef.current.timeoutId);
    }

    typingTimerRef.current = {
      roomId: currentRoomId,
      timeoutId: window.setTimeout(() => {
        socket.emit("typing:stop", { roomId: currentRoomId });
        typingTimerRef.current = { roomId: null, timeoutId: null };
      }, 1500),
    };
  };

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    const socket = socketRef.current;
    if (!socket || !currentRoomId) {
      return;
    }
    const value = messageText.trim();
    if (!value) {
      return;
    }
    socket.emit("message:send", { roomId: currentRoomId, content: value });
    setMessageText("");
  };

  const handleReactionToggle = (message: Message, emoji: string) => {
    const socket = socketRef.current;
    if (!socket || !currentRoomId || !auth) {
      return;
    }
    const hasReaction = message.reactions.some(
      (reaction) =>
        reaction.emoji === emoji && reaction.user.id === auth.user.id
    );
    socket.emit(hasReaction ? "reaction:remove" : "reaction:add", {
      roomId: currentRoomId,
      messageId: message.id,
      emoji,
    });
  };

  const activeRoom =
    rooms.find((room: RoomSummary) => room.id === currentRoomId) ?? null;
  const messages = messagesQuery.data ?? [];
  const currentTypers = currentRoomId ? typingUsers[currentRoomId] ?? [] : [];

  if (!auth) {
    return <LoginForm setAuth={setAuth} />;
  }

  return (
    <div className="grid min-h-screen grid-cols-[280px_1fr] bg-slate-100 text-slate-900">
      <aside className="flex flex-col gap-6 border-r border-slate-200 bg-white p-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar
                username={auth.user.username}
                color={auth.user.displayColor}
                size={44}
              />
              <div>
                <p className="text-sm font-semibold">{auth.user.username}</p>
                <p className="text-xs text-slate-500">{auth.user.email}</p>
              </div>
            </div>
            <button
              className="text-xs font-semibold text-red-500"
              onClick={logout}
            >
              Déconnexion
            </button>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Salons
          </h2>
          <div className="space-y-2 overflow-y-auto">
            {roomsQuery.isLoading ? (
              <div className="w-full flex justify-center py-6">
                <FaSpinner className="animate-spin text-lg text-blue-500" />
              </div>
            ) : (
              <>
                {rooms.map((room: RoomSummary) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full rounded border px-3 py-2 text-left text-sm ${
                      currentRoomId === room.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-blue-400"
                    }`}
                  >
                    <div className="font-medium">{room.name}</div>
                    <div className="text-xs text-slate-500">
                      {room.isGeneral
                        ? "Salon général"
                        : `${room.members.length} membres`}
                    </div>
                  </button>
                ))}
                {rooms.length === 0 && (
                  <p className="text-xs text-slate-500">
                    Aucun salon pour le moment
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        <CreateRoomForm
          isLoading={createRoomMutation.isPending}
          onSubmit={(payload) => createRoomMutation.mutate(payload)}
          availableUsers={usersQuery.data ?? []}
        />

        <ProfileForm
          key={`${auth.user.id}-${auth.user.updatedAt}`}
          defaultUsername={auth.user.username}
          defaultColor={auth.user.displayColor}
          onSubmit={(payload) => updateProfileMutation.mutate(payload)}
          statusMessage={statusMessage}
          loading={updateProfileMutation.isPending}
        />
      </aside>

      <main className="flex h-screen flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold">
              {activeRoom ? activeRoom.name : "Sélectionnez un salon"}
            </h1>
            {activeRoom && (
              <p className="text-xs text-slate-500">
                {activeRoom.isGeneral
                  ? "Salon général"
                  : `${activeRoom.members.length} personnes • Historique ${
                      activeRoom.membership?.canAccessHistory
                        ? "autorisé"
                        : "limité"
                    }`}
              </p>
            )}
          </div>
          {messagesQuery.isFetching && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <FaSpinner className="animate-spin" /> Mise à jour…
            </span>
          )}
        </header>

        <div className="flex flex-1 gap-6 overflow-hidden p-6">
          <section className="flex flex-1 flex-col rounded-xl bg-white p-4 shadow">
            <div ref={listRef} className="flex-1 overflow-y-auto space-y-4">
              {messagesQuery.isLoading && (
                <div className="flex justify-center py-6">
                  <FaSpinner className="animate-spin text-xl text-blue-600 mr-2" />
                  <span className="text-center text-sm text-slate-400">
                    Chargement…
                  </span>
                </div>
              )}
              {messages.map((message: Message) => (
                <article key={message.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      username={message.sender.username}
                      color={message.sender.displayColor}
                      size={28}
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      {message.sender.username}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-800">
                    {message.content}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {EMOJIS.map((emoji) => {
                      const count = message.reactions.filter(
                        (reaction: Message["reactions"][number]) =>
                          reaction.emoji === emoji
                      ).length;
                      const isMine = message.reactions.some(
                        (reaction: Message["reactions"][number]) =>
                          reaction.emoji === emoji &&
                          reaction.user.id === auth.user.id
                      );
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleReactionToggle(message, emoji)}
                          className={`rounded-full px-2 py-1 ${
                            isMine
                              ? "bg-blue-100 text-blue-600"
                              : "bg-slate-200"
                          }`}
                        >
                          {emoji} {count > 0 ? count : ""}
                        </button>
                      );
                    })}
                  </div>
                </article>
              ))}
              {messages.length === 0 && !messagesQuery.isLoading && (
                <p className="text-center text-sm text-slate-400">
                  Aucun message pour ce salon.
                </p>
              )}
            </div>

            {currentTypers.length > 0 && (
              <div className="py-2 text-xs text-slate-500">
                {currentTypers.map((user) => user.username).join(", ")}{" "}
                {currentTypers.length > 1 ? "écrivent" : "écrit"}…
              </div>
            )}

            <form className="mt-2 flex gap-3" onSubmit={handleSendMessage}>
              <input
                className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm"
                placeholder="Écrire un message"
                value={messageText}
                onChange={(event) => handleMessageChange(event.target.value)}
              />
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white flex items-center justify-center gap-1"
                type="submit"
              >
                Envoyer
              </button>
            </form>
          </section>

          <aside className="w-64 shrink-0 space-y-4">
            <section className="rounded-xl bg-white p-4 shadow">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Participants
              </h2>
              <div className="space-y-2">
                {activeRoom?.members.map((member: RoomMember) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        username={member.username}
                        color={member.displayColor}
                        size={28}
                      />
                      <span>{member.username}</span>
                    </div>
                    {member.id === auth.user.id && (
                      <span className="text-xs text-slate-400">
                        {activeRoom.membership?.canAccessHistory
                          ? "Historique"
                          : "En direct"}
                      </span>
                    )}
                  </div>
                ))}
                {activeRoom?.members.length === 0 && (
                  <p className="text-xs text-slate-400">Salon vide</p>
                )}
              </div>
            </section>

            {activeRoom && (
              <InviteForm
                key={activeRoom.id}
                roomId={activeRoom.id}
                members={activeRoom.members}
                users={usersQuery.data ?? []}
                onInvite={(payload) => addMembersMutation.mutate(payload)}
              />
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
