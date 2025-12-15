import InviteForm from "@/app/ui/friends/InviteForm";

export default function AddFriendPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">
        Agregar amigos
      </h2>
      <InviteForm />
    </div>
  );
}
