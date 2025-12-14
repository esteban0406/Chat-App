import FriendList from "@/app/ui/friends/FriendsSidebar";

export default function FriendsPage() {
  return (
    <div className="p-4 text-white">
      <h2 className="text-xl mb-4">Tus Amigos</h2>
      <FriendList />
    </div>
  );
}
