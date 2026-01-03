import { useState, useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";

interface User {
  id: number;
  username: string;
  color: string;
}

interface Reaction {
  id: number;
  emoji: string;
  user: User;
}

interface Message {
  id: number;
  content: string;
  user: User;
  createdAt: string;
  reactions: Reaction[];
}

export const useMessages = (roomId: number | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const socket = getSocket();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!roomId) return;

    if (!user) return;

    socket.emit(
      "joinRoom",
      { roomId, userId: user.id },
      (response: { messages: Message[] }) => {
        setMessages(response.messages || []);
      }
    );

    socket.on("newMessage", (message: Message) => {
      setMessages((prev) => {
        // Avoid duplicates: if the message (by id) already exists, skip
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socket.on("reactionUpdated", () => {
      // Recharger les messages pour avoir les réactions à jour
    });

    return () => {
      socket.off("newMessage");
      socket.off("reactionUpdated");
    };
  }, [roomId, socket, user]);

  const sendMessage = (content: string, userId: number) => {
    if (!roomId) return;
    // use acknowledgement to get the saved/sent message from the server
    socket.emit(
      "sendMessage",
      { roomId, userId, content },
      (sentMessage: Message) => {
        if (sentMessage) {
          setMessages((prev) => {
            // The server will broadcast the message to the room as well;
            // prevent adding a duplicate if we already have it.
            if (prev.some((m) => m.id === sentMessage.id)) return prev;
            return [...prev, sentMessage];
          });
        }
      }
    );
  };

  const addReaction = (messageId: number, userId: number, emoji: string) => {
    socket.emit("addReaction", { messageId, userId, emoji });
  };

  return { messages, sendMessage, addReaction };
};
