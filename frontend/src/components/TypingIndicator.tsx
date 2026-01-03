interface TypingIndicatorProps {
  usernames: string[];
}

export default function TypingIndicator({ usernames }: TypingIndicatorProps) {
  if (usernames.length === 0) return null;

  const text =
    usernames.length === 1
      ? `${usernames[0]} est en train d'écrire...`
      : usernames.length === 2
      ? `${usernames[0]} et ${usernames[1]} sont en train d'écrire...`
      : `${usernames.length} personnes sont en train d'écrire...`;

  return (
    <div className="px-4 py-2">
      <div className="text-sm text-gray-500 italic">{text}</div>
    </div>
  );
}
