import { useState, useCallback, useRef, useEffect } from "react";
import { FiSend } from "react-icons/fi";

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
}

export default function MessageInput({
  onSend,
  onTyping,
  onStopTyping,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<number | undefined>(undefined);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setMessage(value);

      // if user starts typing (after being idle or from empty input)
      if (!isTyping && value.length > 0) {
        setIsTyping(true);
        onTyping();
      }

      // clear previous timeout whenever the user types
      if (typingTimeoutRef.current !== undefined) {
        clearTimeout(typingTimeoutRef.current);
      }

      // if input emptied, stop typing immediately
      if (value.length === 0) {
        if (isTyping) {
          setIsTyping(false);
          onStopTyping();
        }
        return;
      }

      // set a timeout to consider the user stopped typing after 2s of inactivity
      typingTimeoutRef.current = window.setTimeout(() => {
        setIsTyping(false);
        onStopTyping();
        typingTimeoutRef.current = undefined;
      }, 2000);
    },
    [isTyping, onTyping, onStopTyping]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage("");
      setIsTyping(false);
      onStopTyping();
      if (typingTimeoutRef.current !== undefined) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = undefined;
      }
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current !== undefined) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = undefined;
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="input-row">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder="Envoyer un message..."
          className="flex-1 px-4 py-3 border border-gray-200 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors placeholder-gray-400"
        />

        <button
          type="submit"
          aria-label="Envoyer"
          className="bg-blue-500 text-white min-w-14 px-6 py-3 rounded-full
          hover:bg-blue-600 transition font-medium flex items-center justify-center
          disabled:opacity-60 disabled:pointer-events-none h-12"
          disabled={!message.trim()}
          style={{ height: "48px" }}
        >
          <FiSend className="text-xl mr-2" />
          <span className="hidden md:inline">Envoyer</span>
        </button>
      </div>
    </form>
  );
}
