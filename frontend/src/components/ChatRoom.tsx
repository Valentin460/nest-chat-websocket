"use client";

import { useAuthStore } from "@/store/authStore";
import { useMessages } from "@/hooks/useMessages";
import { useRooms } from "@/hooks/useRooms";
import { useTyping } from "@/hooks/useTyping";
import { useAuth } from "@/hooks/useAuth";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import RoomSidebar from "./RoomSidebar";
import TypingIndicator from "./TypingIndicator";

export default function ChatRoom() {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { rooms, currentRoomId, setCurrentRoomId } = useRooms();
  const { messages, sendMessage, addReaction } = useMessages(currentRoomId);
  const { typingUsers, startTyping, stopTyping } = useTyping(
    currentRoomId,
    user?.id || 0,
    user?.username || ""
  );

  if (!user) return null;

  return (
    <div className="app-shell">
      <div className="chat-panel">
        <RoomSidebar
          rooms={rooms}
          currentRoomId={currentRoomId}
          onRoomSelect={setCurrentRoomId}
          onLogout={logout}
          username={user.username}
          color={user.color}
        />
        <div className="chat-content">
          <div className="header-panel flex items-center justify-between">
            <h1 className="text-lg font-semibold">
              # {rooms.find((r) => r.id === currentRoomId)?.name || "Salon"}
            </h1>
          </div>

          <MessageList
            messages={messages}
            currentUserId={user.id}
            onAddReaction={(messageId, emoji) =>
              addReaction(messageId, user.id, emoji)
            }
          />

          <TypingIndicator usernames={typingUsers} />

          <MessageInput
            onSend={(content) => sendMessage(content, user.id)}
            onTyping={startTyping}
            onStopTyping={stopTyping}
          />
        </div>
      </div>
    </div>
  );
}
