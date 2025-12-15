"use client";

type Props = {
  sidebarControls?: {
    closeSidebar?: () => void;
  };
};

export default function FriendsSidebar({ sidebarControls }: Props) {
  const closeSidebar = sidebarControls?.closeSidebar;

  return (
    <div className="h-full w-full space-y-3 p-4 text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Amigos</h2>
        {closeSidebar && (
          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-md p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none md:hidden"
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-sm text-gray-400">
        Administra tus amigos, solicitudes y accesos a servidores.
      </p>
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-sm text-gray-300">
        <p className="font-semibold text-gray-100">Consejo</p>
        <p>
          Desde aquí puedes aceptar invitaciones, agregar nuevos amigos o
          revisar tus solicitudes pendientes.
        </p>
      </div>
    </div>
  );
}
