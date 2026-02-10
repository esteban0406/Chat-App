import FriendRequestsList from "@/ui/home/FriendRequestsList";

export default function FriendRequestsPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold text-text-primary">
        Solicitudes de amistad
      </h2>
      <FriendRequestsList />
    </div>
  );
}
