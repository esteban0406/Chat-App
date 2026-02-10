import ServerInviteList from "@/ui/home/ServerInviteList";

export default function ServerRequestsPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold text-text-primary">
        Invitaciones a servidores
      </h2>
      <ServerInviteList />
    </div>
  );
}
