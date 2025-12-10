// app/(main)/servers/[serverId]/layout.tsx
//import ChannelSidebar from "@/components/channels/ChannelSidebar";

export default function ServerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { serverId: string };
}) {
  const { serverId } = params;

  return (
    <div className="flex h-full">
      {/* Channels sidebar */}
      <div className="w-60 bg-gray-850 border-r border-gray-700">
        {/* <ChannelSidebar serverId={serverId} /> */}
      </div>

      {/* Channel content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
