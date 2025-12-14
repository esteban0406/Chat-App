"use client";

import { useParams } from "next/navigation";
import SectionShell from "@/app/ui/layout/SectionShell";
import ChannelSidebar from "@/app/ui/channels/ChannelSidebar";

export default function ServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const serverIdRaw = params?.serverId;
  const serverId =
    typeof serverIdRaw === "string"
      ? serverIdRaw
      : Array.isArray(serverIdRaw)
      ? serverIdRaw[0]
      : undefined;

  return (
    <SectionShell sidebar={<ChannelSidebar />}>
      {children}
    </SectionShell>
  );
}
