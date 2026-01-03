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

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  onAddReaction: (messageId: number, emoji: string) => void;
}

export default function MessageList({
  messages,
  currentUserId,
  onAddReaction,
}: MessageListProps) {
  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

  return (
    <div className="message-list">
      {messages.map((msg) => {
        if (!msg?.user) return null;

        const isMe = msg.user.id === currentUserId;

        return (
          <div key={msg.id} className={`message-row ${isMe ? "me" : ""}`}>
            {/* Avatar left */}
            {!isMe && (
              <div
                className="avatar-small flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: msg.user.color || "#3b82f6" }}
              >
                {msg.user.username?.[0]?.toUpperCase() || "?"}
              </div>
            )}

            {/* Content */}
            <div className="flex flex-col">
              {!isMe && (
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="font-semibold"
                    style={{ color: msg.user.color || "#3b82f6" }}
                  >
                    {msg.user.username || "Utilisateur"}
                  </span>
                  <span className="message-meta">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              )}

              <div
                className={[
                  "message-bubble",
                  isMe
                    ? "bg-blue-500 text-white border border-blue-500"
                    : "bg-slate-100 text-[#22223b] border border-gray-200",
                  "px-4 py-2",
                  "max-w-[72%]",
                  "min-w-xs",
                  "text-base",
                  "leading-snug",
                  "overflow-x-auto",
                  "break-normal",
                  "whitespace-pre-line",
                ].join(" ")}
                style={
                  isMe
                    ? {
                        borderTopLeftRadius: 18,
                        borderTopRightRadius: 18,
                        borderBottomRightRadius: 6,
                        borderBottomLeftRadius: 18,
                      }
                    : {
                        borderTopLeftRadius: 18,
                        borderTopRightRadius: 18,
                        borderBottomRightRadius: 18,
                        borderBottomLeftRadius: 6,
                      }
                }
              >
                {msg.content}
              </div>

              <div className="flex gap-2 items-center mt-2">
                <div className="flex gap-1 flex-wrap">
                  {msg.reactions &&
                    msg.reactions.map((reaction, idx) => (
                      <button
                        key={idx}
                        className="text-sm bg-gray-100 px-2 py-1 rounded-md"
                      >
                        {reaction.emoji}
                      </button>
                    ))}
                </div>

                <div className="ml-2 hidden group-hover:flex gap-1">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onAddReaction(msg.id, emoji)}
                      className="text-lg hover:scale-110 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Avatar right */}
            {isMe && (
              <div
                className="avatar-small flex items-center justify-center text-white font-bold ml-2"
                style={{ backgroundColor: msg.user.color || "#3b82f6" }}
              >
                {msg.user.username?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
