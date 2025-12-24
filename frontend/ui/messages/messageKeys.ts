"use client";

import { Message } from "@/lib/definitions";

type MessageLike = Message & { _id?: string };

export function getMessageKey(
  message: MessageLike,
  fallbackIndex?: number
) {
  if (message.id) return message.id;
  if (message._id) return message._id;
  if (message.createdAt) {
    return `${message.channel ?? "channel"}-${message.createdAt}`;
  }
  return `${message.channel ?? "channel"}-${
    fallbackIndex ?? Date.now()
  }-${message.text ?? ""}`;
}
