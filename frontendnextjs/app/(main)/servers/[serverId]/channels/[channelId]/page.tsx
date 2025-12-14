'use client';

import { useParams } from "next/navigation";

export default function ChannelPage() {
  const params = useParams();
  const channelId = Array.isArray(params?.channelId)
    ? params?.channelId[0]
    : params?.channelId;

  return (
    <div className="flex flex-col h-full">
      <header className="border-b border-gray-700 p-3 font-semibold">
        Canal #{channelId}
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {/* Messages */}
      </main>

      <footer className="border-t border-gray-700 p-3">
        {/* Message input */}
      </footer>
    </div>
  );
}
