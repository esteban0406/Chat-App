"use client";

import { useState } from "react";
import Image from "next/image";

const AVATAR_COLORS = [
  "bg-gold",
  "bg-ruby",
  "bg-[#4A90D9]",
  "bg-[#43B581]",
  "bg-[#B56AD8]",
  "bg-[#E67E22]",
];

export function getAvatarColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type UserAvatarProps = {
  src?: string | null;
  username: string;
  userId?: string;
  size?: number;
  shape?: "circle" | "rounded";
  ring?: boolean;
  className?: string;
};

export default function UserAvatar({
  src,
  username,
  userId = "",
  size = 40,
  shape = "circle",
  ring = false,
  className = "",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-[10px]";
  const ringClass = ring ? "ring-2 ring-gold" : "";
  const avatarColor = getAvatarColor(userId || username);

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${shapeClass} ${ringClass} ${className}`}
      style={{ width: size, height: size }}
    >
      {src && !imgError ? (
        <Image
          src={src}
          alt={username || "Avatar"}
          fill
          unoptimized={process.env.NODE_ENV === "development"}
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center text-sm font-semibold text-white ${avatarColor}`}
        >
          {username?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );
}
