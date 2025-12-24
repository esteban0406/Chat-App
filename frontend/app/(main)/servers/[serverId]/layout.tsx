"use client";

import SectionShell from "@/ui/layout/SectionShell";
import ChannelSidebar from "@/ui/channels/ChannelSidebar";

export default function ServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <SectionShell sidebar={<ChannelSidebar />}>
      {children}
    </SectionShell>
  );
}
