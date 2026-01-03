"use client";

import React from "react";

function getInitials(name: string) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function UserAvatar({
  username,
  color,
  size = 40,
}: {
  username: string;
  color: string;
  size?: number;
}) {
  const initials = getInitials(username);
  return (
    <div
      className="flex items-center justify-center font-bold text-white select-none"
      style={{
        background: color,
        borderRadius: "9999px",
        width: size,
        height: size,
        fontSize: size * 0.42,
        textTransform: "uppercase",
      }}
      title={username}
    >
      {initials}
    </div>
  );
}
