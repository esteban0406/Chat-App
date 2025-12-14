export default function ServerHomePage({
  params,
}: {
  params: { serverId: string };
}) {
  return (
    <div className="flex h-full items-center justify-center text-gray-400">
      Selecciona un canal del servidor
    </div>
  );
}
