"use client";

import SectionShell from "@/app/ui/layout/SectionShell";
import ChannelSidebar from "@/app/ui/channels/ChannelSidebar";

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
