export default function ServerPage({ params }: { params: { serverId: string } }) {
  return (
    <div className="text-white p-4">
      Welcome to server {params.serverId}
    </div>
  );
}
