import ServerInviteList from "@/ui/friends/ServerInviteList";

export default function ServerRequestsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">
        Invitaciones a servidores
      </h2>
      <ServerInviteList />
    </div>
  );
}
