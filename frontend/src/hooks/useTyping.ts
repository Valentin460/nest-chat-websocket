import { useState, useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";

export const useTyping = (
  roomId: number | null,
  userId: number,
  username: string
) => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const socket = getSocket();

  useEffect(() => {
    if (!roomId) return;

    socket.on(
      "typingUpdate",
      (data: { roomId: number; usernames: string[] }) => {
        if (data.roomId === roomId) {
          setTypingUsers(data.usernames.filter((u) => u !== username));
        }
      }
    );

    return () => {
      socket.off("typingUpdate");
    };
  }, [roomId, username, socket]);

  const startTyping = useCallback(() => {
    if (roomId) {
      socket.emit("typing", { roomId, userId, username });
    }
  }, [roomId, userId, username, socket]);

  const stopTyping = useCallback(() => {
    if (roomId) {
      socket.emit("stopTyping", { roomId, userId });
    }
  }, [roomId, userId, socket]);

  return { typingUsers, startTyping, stopTyping };
};
