import FriendList from "@/app/ui/friends/FriendList";

export default function FriendsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">Tus amigos</h2>
      <FriendList />
    </div>
  );
}
