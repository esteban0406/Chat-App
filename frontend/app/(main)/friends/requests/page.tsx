import FriendRequestsList from "@/app/ui/friends/FriendRequestsList";

export default function FriendRequestsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">
        Solicitudes de amistad
      </h2>
      <FriendRequestsList />
    </div>
  );
}
